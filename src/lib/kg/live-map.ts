import type { ItemResult, PlaceResult, LiveVerdict, ThresholdHit } from "../knowngate/contracts.ts";
import { questionText } from "../knowngate/contracts.ts";
import type { DesignVerdict } from "./types.ts";

/** Accept legacy adapter verdicts and live API design names. */
export function toDesignVerdict(verdict: LiveVerdict | DesignVerdict | string): DesignVerdict {
  switch (verdict) {
    case "no_conflict":
    case "no_conflict_found":
      return "no_conflict_found";
    case "conflict":
    case "conflict_found":
      return "conflict_found";
    case "ask_one_question":
      return "ask_one_question";
    case "cannot_verify":
    case "couldnt_verify":
      return "couldnt_verify";
    default:
      return "couldnt_verify";
  }
}

export function formatReadDate(isoOrDisplay: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(isoOrDisplay)) {
    const d = new Date(`${isoOrDisplay.slice(0, 10)}T12:00:00Z`);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return isoOrDisplay;
}

export function summarizeItem(result: ItemResult): string {
  const design = toDesignVerdict(result.verdict);
  if (design === "conflict_found") {
    const names = result.conflicts.map((c) => c.restriction);
    if (!names.length) return "Conflict found.";
    // These arrive as bare keys ("peanut"), and they open a sentence.
    const listed = names.join(", ");
    const opener = listed.charAt(0).toUpperCase() + listed.slice(1);
    return `Conflict found. ${opener} ${names.length > 1 ? "are" : "is"} present on the evidence.`;
  }
  if (design === "ask_one_question") {
    return questionText(result.question) ?? "Ask one question to close the remaining gap.";
  }
  if (design === "couldnt_verify") {
    return "Couldn't verify. The evidence does not cover what you asked.";
  }
  return "No conflict found against this premise.";
}

export function mapPlaceCounts(result: PlaceResult) {
  const counts = result.verdict_counts as PlaceResult["verdict_counts"] & {
    no_conflict_found?: number;
    conflict_found?: number;
    couldnt_verify?: number;
  };
  return {
    no_conflict_found: counts.no_conflict_found ?? counts.no_conflict,
    ask_one_question: counts.ask_one_question,
    conflict_found: counts.conflict_found ?? counts.conflict,
    couldnt_verify: counts.couldnt_verify ?? counts.cannot_verify,
  };
}

export function mapNotable(result: PlaceResult) {
  return result.notable.map((n) => ({
    name: n.subject.name ?? n.subject.value,
    verdict: toDesignVerdict(n.verdict),
    line: summarizeItem(n),
    source: n.source
      ? `${n.source.name}, ${formatReadDate(n.source.read_date)}`
      : "No source",
  }));
}

/** "per_serving" is how the API says it; people say it the other way. */
function basisWords(basis?: string): string {
  if (!basis) return "";
  return ` ${basis.replace(/_/g, " ")}`;
}

/** Whether a hit breaches the limit it was measured against. */
export function thresholdBreached(hit: ThresholdHit): boolean {
  if (hit.found === null) return false;
  if (typeof hit.max === "number" && hit.found > hit.max) return true;
  if (typeof hit.min === "number" && hit.found < hit.min) return true;
  return toDesignVerdict(hit.verdict) === "conflict_found";
}

/**
 * The evidence line under a threshold panel. Read off the hit every time:
 * whether a number clears its limit is exactly what the reader is here for,
 * so it is never safe to assume the direction.
 */
export function describeThresholdHit(hit: ThresholdHit): string {
  const where = `${hit.nutrient}${basisWords(hit.basis)}`;
  if (hit.found === null) {
    return `No ${where} figure on the evidence, so the limit could not be checked.`;
  }
  const limit =
    typeof hit.max === "number"
      ? `the ${hit.max} ${hit.unit} limit`
      : typeof hit.min === "number"
        ? `the ${hit.min} ${hit.unit} minimum`
        : null;
  const measured = `${hit.found} ${hit.unit}${basisWords(hit.basis)}`;
  if (!limit) return `${measured}.`;
  return thresholdBreached(hit)
    ? `${measured}, over ${limit}.`
    : `${measured}, under ${limit}.`;
}

/** The same fact as a sentence, for the line under the verdict. */
export function summarizeThresholdHit(hit: ThresholdHit): string {
  if (hit.found === null) return `The ${hit.nutrient} limit could not be checked.`;
  return thresholdBreached(hit)
    ? `The ${hit.nutrient} limit is exceeded.`
    : `The ${hit.nutrient} limit is met.`;
}
