/**
 * Client for POST /v0/premise/parse.
 *
 * The parser only ever fills in the form. It never rules: no verdict, no
 * evidence and no date comes from this endpoint, so nothing it returns can
 * reach a user as a finding. Whatever comes back is shown for the person to
 * confirm or edit before any check is run.
 *
 * A threshold is only ever returned with a number the person actually stated.
 * Anything numeric that was implied rather than said comes back under
 * needs_number for them to fill in themselves.
 */

export type ParsedThreshold = { nutrient: string; max: number; unit: string };
export type ParsedSubject = { kind: "upc" | "product_query" | "menu_item" | "ingredients"; value: string };
export type NeedsNumber = { nutrient: string; said: string };

export type ParsedPremise = {
  restrictions: string[];
  thresholds: ParsedThreshold[];
  subject: ParsedSubject | null;
  needs_number: NeedsNumber[];
  unparsed: string[];
  note: string;
};

export type ParseOutcome =
  | { status: "parsed"; premise: ParsedPremise }
  | { status: "invalid"; message: string }
  /** Parser is down or unreachable. The caller falls back to the hand-built chips. */
  | { status: "unavailable" };

export const PARSE_MAX_CHARS = 400;

const isThreshold = (v: unknown): v is ParsedThreshold => {
  if (!v || typeof v !== "object") return false;
  const t = v as Record<string, unknown>;
  // A threshold without a real number is not a threshold. Drop it rather than
  // render a rule the person never stated.
  return (
    typeof t.nutrient === "string" &&
    typeof t.unit === "string" &&
    typeof t.max === "number" &&
    Number.isFinite(t.max)
  );
};

const isSubject = (v: unknown): v is ParsedSubject => {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.value === "string" &&
    s.value.length > 0 &&
    (s.kind === "upc" || s.kind === "product_query" || s.kind === "menu_item" || s.kind === "ingredients")
  );
};

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];

/** Re-validates the shape client-side; the server validates too, this is belt and braces. */
export function normalizeParsed(body: unknown): ParsedPremise {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    restrictions: strings(b.restrictions),
    thresholds: Array.isArray(b.thresholds) ? b.thresholds.filter(isThreshold) : [],
    subject: isSubject(b.subject) ? b.subject : null,
    needs_number: Array.isArray(b.needs_number)
      ? (b.needs_number as unknown[]).filter(
          (n): n is NeedsNumber =>
            !!n &&
            typeof n === "object" &&
            typeof (n as NeedsNumber).nutrient === "string" &&
            typeof (n as NeedsNumber).said === "string",
        )
      : [],
    unparsed: strings(b.unparsed),
    note: typeof b.note === "string" ? b.note : "",
  };
}

/** True when there is nothing to confirm, so the composer should say so rather than open an empty panel. */
export function isEmptyPremise(p: ParsedPremise): boolean {
  return (
    p.restrictions.length === 0 &&
    p.thresholds.length === 0 &&
    p.needs_number.length === 0 &&
    p.subject === null
  );
}

export async function parsePremise(text: string, signal?: AbortSignal): Promise<ParseOutcome> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > PARSE_MAX_CHARS) {
    return { status: "invalid", message: `Say that in 1 to ${PARSE_MAX_CHARS} characters.` };
  }
  let res: Response;
  try {
    res = await fetch("/api/knowngate/v0/premise/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
      signal,
    });
  } catch {
    return { status: "unavailable" };
  }
  if (res.status === 400) {
    const body = await res.json().catch(() => null);
    const message =
      (body as { error?: { message?: string } } | null)?.error?.message ??
      "That did not read as a rule about food.";
    return { status: "invalid", message };
  }
  if (!res.ok) return { status: "unavailable" };
  const body = await res.json().catch(() => null);
  if (!body) return { status: "unavailable" };
  return { status: "parsed", premise: normalizeParsed(body) };
}
