import type {
  CoverageState,
  LabelResult,
  NutritionPanel,
  ItemResult,
  LiveVerdict,
  PlaceResult,
  Source,
  Subject,
} from "./contracts.ts";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function mapAxis(value: unknown): CoverageState {
  if (value === "covered") return "covered";
  if (value === "silent") return "silent";
  // Live API uses not_covered; UI axis vocabulary is silent/unknown.
  if (value === "not_covered") return "unknown";
  if (value === "unknown") return "unknown";
  return "unknown";
}

function mapSource(raw: unknown): Source | null {
  const source = asRecord(raw);
  if (!source || typeof source.name !== "string") return null;
  const read =
    (typeof source.read_date === "string" && source.read_date) ||
    (typeof source.read_at === "string" && source.read_at) ||
    "";
  return {
    name: source.name,
    url: typeof source.url === "string" ? source.url : null,
    read_date: read,
  };
}

function mapQuestion(raw: unknown): string | null {
  if (typeof raw === "string") return raw;
  const q = asRecord(raw);
  if (!q) return null;
  if (typeof q.text === "string") return q.text;
  if (typeof q.question === "string") return q.question;
  return null;
}

function mapSubject(raw: unknown): Subject {
  const subject = asRecord(raw) ?? {};
  const kind = typeof subject.kind === "string" ? subject.kind : "product_query";
  return {
    kind: kind as Subject["kind"],
    value: typeof subject.value === "string" ? subject.value : "",
    venue: typeof subject.venue === "string" ? subject.venue : undefined,
    name: typeof subject.name === "string" ? subject.name : undefined,
  };
}

function mapCaveat(raw: unknown): ItemResult["caveat"] {
  const caveat = asRecord(raw);
  if (!caveat || typeof caveat.text !== "string") return null;
  return {
    text: caveat.text,
    captured: typeof caveat.captured === "string" ? caveat.captured : "",
  };
}

/** Map live proxy payloads (and legacy fixtures) onto the UI ItemResult shape. */
export function normalizeItemResult(raw: unknown): ItemResult {
  const input = asRecord(raw) ?? {};
  const axes = asRecord(input.axes);
  const coverage = asRecord(input.coverage);
  const hits = Array.isArray(input.allergen_hits)
    ? input.allergen_hits
    : Array.isArray(input.conflicts)
      ? input.conflicts
      : [];

  return {
    verdict: (typeof input.verdict === "string" ? input.verdict : "couldnt_verify") as LiveVerdict,
    subject: mapSubject(input.subject),
    coverage: {
      composition: mapAxis(axes?.composition ?? coverage?.composition),
      preparation: mapAxis(axes?.preparation ?? coverage?.preparation),
    },
    conflicts: hits
      .map((hit) => asRecord(hit))
      .filter((hit): hit is Record<string, unknown> => !!hit)
      .map((hit) => ({
        restriction: typeof hit.restriction === "string" ? hit.restriction : "",
        evidence: typeof hit.evidence === "string" ? hit.evidence : "",
      }))
      .filter((hit) => hit.restriction),
    unverified: Array.isArray(input.unverified)
      ? input.unverified
          .map((row) => asRecord(row))
          .filter((row): row is Record<string, unknown> => !!row)
          .map((row) => ({
            restriction: typeof row.restriction === "string" ? row.restriction : "",
            reason: typeof row.reason === "string" ? row.reason : "",
          }))
      : [],
    question: mapQuestion(input.question),
    source: mapSource(input.source),
    caveat: mapCaveat(input.caveat),
    label_url: typeof input.label_url === "string" ? input.label_url : null,
    // The standard forbids dropping these, so they survive normalisation.
    must_not_omit: Array.isArray(input.must_not_omit)
      ? input.must_not_omit.filter((v): v is string => typeof v === "string")
      : [],
    threshold_hits: Array.isArray(input.threshold_hits)
      ? (input.threshold_hits as ItemResult["threshold_hits"])
      : undefined,
  };
}

export function normalizePlaceResult(raw: unknown): PlaceResult {
  const input = asRecord(raw) ?? {};
  const venue = asRecord(input.venue) ?? {};
  const counts = asRecord(input.verdict_counts) ?? {};
  const number = (key: string, alt?: string) => {
    const primary = counts[key];
    if (typeof primary === "number") return primary;
    if (alt && typeof counts[alt] === "number") return counts[alt] as number;
    return 0;
  };

  return {
    venue: {
      name: typeof venue.name === "string" ? venue.name : "",
      chain: typeof venue.chain === "string" ? venue.chain : null,
      city: typeof venue.city === "string" ? venue.city : null,
    },
    chart: (typeof input.chart === "string" ? input.chart : "none_found") as PlaceResult["chart"],
    must_not_omit: Array.isArray(input.must_not_omit)
      ? input.must_not_omit.filter((v): v is string => typeof v === "string")
      : [],
    verdict_counts: {
      no_conflict: number("no_conflict", "no_conflict_found"),
      conflict: number("conflict", "conflict_found"),
      ask_one_question: number("ask_one_question"),
      cannot_verify: number("cannot_verify", "couldnt_verify"),
    },
    notable: Array.isArray(input.notable)
      ? input.notable.map((row) => normalizeItemResult(row))
      : [],
    caveat: mapCaveat(input.caveat),
    source: mapSource(input.source),
  };
}

/** Absent, null and empty all mean the same thing here: nothing to render. */
export function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

const NUTRITION_NUMBERS = [
  "serving_qty",
  "energy_kcal",
  "protein_g",
  "fat_g",
  "saturated_fat_g",
  "trans_fat_g",
  "carbohydrate_g",
  "sugar_g",
  "added_sugar_g",
  "fiber_g",
  "sodium_mg",
  "cholesterol_mg",
  "calcium_mg",
  "iron_mg",
  "potassium_mg",
  "vitamin_d_mcg",
] as const;

/**
 * A panel is only a panel if a number survived. Packs with no panel on file
 * come back null, and that absence is rendered as itself rather than as a
 * table of blanks.
 */
export function nutritionPanel(value: unknown): NutritionPanel | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const panel = { serving_unit: optionalText(input.serving_unit) } as NutritionPanel;
  let stated = false;
  for (const key of NUTRITION_NUMBERS) {
    const raw = input[key];
    const num = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
    panel[key] = num;
    if (num !== null) stated = true;
  }
  return stated ? panel : null;
}

/** Client-side twin of parseLabelResult: lenient, same field meanings. */
export function normalizeLabelResult(raw: unknown): LabelResult {
  const input = asRecord(raw) ?? {};
  return {
    gtin: typeof input.gtin === "string" ? input.gtin : "",
    name: typeof input.name === "string" ? input.name : "",
    brand: typeof input.brand === "string" ? input.brand : "",
    statement_read: Boolean(input.statement_read),
    findings: [],
    source: mapSource(input.source),
    image_url: optionalText(input.image_url),
    ingredients_verbatim: optionalText(input.ingredients_verbatim),
    allergens_description: optionalText(input.allergens_description),
    nutrition: nutritionPanel(input.nutrition),
  };
}
