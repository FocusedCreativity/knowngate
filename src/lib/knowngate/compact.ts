import type { BoardResult, ItemResult, PlaceResult, Premise } from "./contracts.ts";

export function compactItem(result: ItemResult) {
  return {
    verdict: result.verdict,
    subject: result.subject,
    coverage: result.coverage,
    conflicts: result.conflicts,
    unverified: result.unverified,
    question: result.question,
    source: result.source,
    caveat: result.caveat,
    label_url: result.label_url,
  };
}

export function compactPlace(result: PlaceResult) {
  return {
    venue: result.venue,
    chart: result.chart,
    verdict_counts: result.verdict_counts,
    notable: result.notable.slice(0, 5).map(compactItem),
    caveat: result.caveat,
    source: result.source,
  };
}

export function compactResult(result: BoardResult) {
  return "verdict" in result ? compactItem(result) : compactPlace(result);
}

export function compactBoard(premise: Premise | null, results: BoardResult[]) {
  return { premise, results: results.map(compactResult) };
}

export function utf8Bytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
