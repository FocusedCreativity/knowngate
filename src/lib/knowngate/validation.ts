import {
  FDA9_KEYS,
  type CheckItemRequest,
  type CheckPlaceRequest,
  type FreezeCreated,
  type FreezeRequest,
  type FrozenCheck,
  type ItemResult,
  type KnownGateErrorBody,
  type LabelResult,
  type PlaceResult,
  type Premise,
  type Restriction,
} from "./contracts.ts";

const VERDICTS = new Set([
  "no_conflict",
  "conflict",
  "ask_one_question",
  "cannot_verify",
]);
const COVERAGE = new Set(["covered", "silent", "unknown"]);
const CHART_STATES = new Set([
  "ruled",
  "published_not_machine_readable",
  "none_found",
]);
const SUBJECT_KINDS = new Set([
  "upc",
  "product_query",
  "menu_item",
  "ingredients",
]);

export class ContractError extends Error {
  readonly code: string;
  readonly missing?: string;

  constructor(
    message: string,
    code = "invalid_contract",
    missing?: string,
  ) {
    super(message);
    this.name = "ContractError";
    this.code = code;
    this.missing = missing;
  }

  toBody(): KnownGateErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.missing ? { missing: this.missing } : {}),
      },
    };
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContractError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ContractError(`${label} must be a non-empty string`, "invalid_input", label);
  }
  return value.trim();
}

function nullableText(value: unknown, label: string): string | null {
  if (value === null) return null;
  return text(value, label);
}

function source(value: unknown) {
  const input = record(value, "source");
  return {
    name: text(input.name, "source.name"),
    url: nullableText(input.url, "source.url"),
    read_date: text(input.read_date, "source.read_date"),
  };
}

export function parseRestrictions(value: unknown): Restriction[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ContractError(
      "restrictions must be a non-empty array of { key } objects (FDA-9 keys)",
      "invalid_restrictions",
      "restrictions",
    );
  }

  return value.map((entry, index) => {
    const item = record(entry, `restrictions[${index}]`);
    const key = text(item.key, `restrictions[${index}].key`);
    if (![...FDA9_KEYS, "other"].includes(key as never)) {
      throw new ContractError(
        `restriction key ${key} is not supported; use an FDA-9 key or other`,
        "invalid_restriction_key",
        `restrictions[${index}].key`,
      );
    }
    const note = item.note === undefined ? undefined : text(item.note, `restrictions[${index}].note`);
    if (key === "other" && !note) {
      throw new ContractError(
        "other restrictions require a note",
        "invalid_restriction_note",
        `restrictions[${index}].note`,
      );
    }
    return { key, ...(note ? { note } : {}) } as Restriction;
  });
}

export function parsePremise(value: unknown): Premise {
  const input = record(value, "premise");
  return {
    restrictions: parseRestrictions(input.restrictions),
    ...(input.diners === undefined ? {} : { diners: text(input.diners, "diners") }),
    ...(input.location === undefined ? {} : { location: text(input.location, "location") }),
  };
}

export function parseCheckItemRequest(value: unknown): CheckItemRequest {
  const input = record(value, "request");
  const subject = record(input.subject, "subject");
  const kind = text(subject.kind, "subject.kind");
  if (!SUBJECT_KINDS.has(kind)) {
    throw new ContractError("subject.kind is invalid", "invalid_subject", "subject.kind");
  }
  const venue = subject.venue === undefined ? undefined : text(subject.venue, "subject.venue");
  if (kind === "menu_item" && !venue) {
    throw new ContractError(
      "menu_item checks require subject.venue",
      "missing_venue",
      "subject.venue",
    );
  }
  return {
    restrictions: parseRestrictions(input.restrictions),
    subject: { kind, value: text(subject.value, "subject.value"), ...(venue ? { venue } : {}) } as CheckItemRequest["subject"],
  };
}

export function parseCheckPlaceRequest(value: unknown): CheckPlaceRequest {
  const input = record(value, "request");
  const venue = record(input.venue, "venue");
  return {
    restrictions: parseRestrictions(input.restrictions),
    venue: {
      name: text(venue.name, "venue.name"),
      ...(venue.location === undefined ? {} : { location: text(venue.location, "venue.location") }),
    },
  };
}

export function parseItemResult(value: unknown): ItemResult {
  const input = record(value, "item result");
  const verdict = text(input.verdict, "verdict");
  if (!VERDICTS.has(verdict)) throw new ContractError("verdict is invalid");
  const subjectInput = record(input.subject, "subject");
  const kind = text(subjectInput.kind, "subject.kind");
  if (!SUBJECT_KINDS.has(kind)) throw new ContractError("subject.kind is invalid");
  const coverageInput = record(input.coverage, "coverage");
  const composition = text(coverageInput.composition, "coverage.composition");
  const preparation = text(coverageInput.preparation, "coverage.preparation");
  if (!COVERAGE.has(composition) || !COVERAGE.has(preparation)) {
    throw new ContractError("coverage state is invalid");
  }
  if (!Array.isArray(input.conflicts) || !Array.isArray(input.unverified)) {
    throw new ContractError("conflicts and unverified must be arrays");
  }

  return {
    verdict: verdict as ItemResult["verdict"],
    subject: {
      kind: kind as ItemResult["subject"]["kind"],
      value: text(subjectInput.value, "subject.value"),
      ...(subjectInput.venue === undefined ? {} : { venue: text(subjectInput.venue, "subject.venue") }),
      ...(subjectInput.name === undefined ? {} : { name: text(subjectInput.name, "subject.name") }),
    },
    coverage: {
      composition: composition as ItemResult["coverage"]["composition"],
      preparation: preparation as ItemResult["coverage"]["preparation"],
    },
    conflicts: input.conflicts.map((entry) => {
      const conflict = record(entry, "conflict");
      return { restriction: text(conflict.restriction, "conflict.restriction"), evidence: text(conflict.evidence, "conflict.evidence") };
    }),
    unverified: input.unverified.map((entry) => {
      const unverified = record(entry, "unverified");
      return { restriction: text(unverified.restriction, "unverified.restriction"), reason: text(unverified.reason, "unverified.reason") };
    }),
    question: nullableText(input.question, "question"),
    source: source(input.source),
    caveat: input.caveat === null ? null : (() => {
      const caveat = record(input.caveat, "caveat");
      return { text: text(caveat.text, "caveat.text"), captured: text(caveat.captured, "caveat.captured") };
    })(),
    label_url: nullableText(input.label_url, "label_url"),
  };
}

export function parsePlaceResult(value: unknown): PlaceResult {
  const input = record(value, "place result");
  const venue = record(input.venue, "venue");
  const chart = text(input.chart, "chart");
  if (!CHART_STATES.has(chart)) throw new ContractError("chart state is invalid");
  const counts = record(input.verdict_counts, "verdict_counts");
  const count = (key: string) => {
    const value = counts[key];
    if (!Number.isInteger(value) || (value as number) < 0) throw new ContractError(`verdict_counts.${key} is invalid`);
    return value as number;
  };
  if (!Array.isArray(input.notable)) throw new ContractError("notable must be an array");
  return {
    venue: {
      name: text(venue.name, "venue.name"),
      chain: nullableText(venue.chain, "venue.chain"),
      city: nullableText(venue.city, "venue.city"),
    },
    chart: chart as PlaceResult["chart"],
    verdict_counts: {
      no_conflict: count("no_conflict"),
      conflict: count("conflict"),
      ask_one_question: count("ask_one_question"),
      cannot_verify: count("cannot_verify"),
    },
    notable: input.notable.map(parseItemResult),
    caveat: input.caveat === null ? null : (() => {
      const caveat = record(input.caveat, "caveat");
      return { text: text(caveat.text, "caveat.text"), captured: text(caveat.captured, "caveat.captured") };
    })(),
    source: source(input.source),
  };
}

export function parseLabelResult(value: unknown): LabelResult {
  const input = record(value, "label result");
  if (!Array.isArray(input.findings)) throw new ContractError("findings must be an array");
  return {
    gtin: text(input.gtin, "gtin"),
    name: text(input.name, "name"),
    brand: text(input.brand, "brand"),
    statement_read: Boolean(input.statement_read),
    findings: input.findings.map((entry) => {
      const finding = record(entry, "finding");
      const status = text(finding.status, "finding.status");
      if (!["present", "absent_declared", "indeterminate"].includes(status)) throw new ContractError("finding.status is invalid");
      return {
        allergen_token: text(finding.allergen_token, "finding.allergen_token"),
        status: status as LabelResult["findings"][number]["status"],
        evidence_kind: text(finding.evidence_kind, "finding.evidence_kind"),
        matched_text: text(finding.matched_text, "finding.matched_text"),
      };
    }),
    source: source(input.source),
  };
}

export function parseFrozenCheck(value: unknown): FrozenCheck {
  const input = record(value, "frozen check");
  const payload = record(input.payload, "payload");
  if (!Array.isArray(payload.results)) throw new ContractError("payload.results must be an array");
  return {
    ck_id: text(input.ck_id, "ck_id"),
    payload: parseFreezeRequest(payload),
    frozen_at: text(input.frozen_at, "frozen_at"),
  };
}

export function parseFreezeRequest(value: unknown): FreezeRequest {
  const input = record(value, "freeze request");
  if (!Array.isArray(input.results) || input.results.length === 0) {
    throw new ContractError("results must be a non-empty array", "invalid_results", "results");
  }
  return {
    premise: parsePremise(input.premise),
    results: input.results.map((result) => {
      const candidate = record(result, "result");
      return "chart" in candidate ? parsePlaceResult(candidate) : parseItemResult(candidate);
    }),
  };
}

export function parseFreezeCreated(value: unknown): FreezeCreated {
  const input = record(value, "freeze response");
  const ck_id = text(input.ck_id, "ck_id");
  if (!isFreezeId(ck_id)) throw new ContractError("ck_id is invalid", "invalid_freeze_id", "ck_id");
  return { ck_id, url: text(input.url, "url"), frozen_at: text(input.frozen_at, "frozen_at") };
}

export function isFreezeId(value: string): boolean {
  return /^ck_[a-z0-9]{16,32}$/.test(value);
}
