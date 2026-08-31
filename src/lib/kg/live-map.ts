import type { ItemResult, PlaceResult, LiveVerdict } from "@/lib/knowngate/contracts";
import { questionText } from "@/lib/knowngate/contracts";
import type { DesignVerdict } from "./types";

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
    const names = result.conflicts.map((c) => c.restriction).join(", ");
    return names
      ? `Conflict found. ${names} present on the evidence.`
      : "Conflict found.";
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
