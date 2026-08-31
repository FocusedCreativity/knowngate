import "server-only";

/**
 * The corpus layer reads from GET /v0/corpus. Every number on it is a field
 * from that response or a percentage derived from two of them — nothing is
 * written by hand, so a snapshot refresh upstream is the only thing that can
 * move these figures.
 *
 * Note the two population counts are different things and the copy depends on
 * the distinction: unique_products is how many distinct products we hold,
 * shelf_records is how many store-shelf listings those appear as. Coverage
 * percentages are against shelf_records.
 */
export type CorpusSnapshot = {
  computed_at: string;
  metros: number;
  menu_items: number;
  chains_ruled: number;
  chart_dishes: number;
  shelf_records: number;
  sitdown_venues: number;
  unique_products: number;
  nutrition_panels: number;
  panels_with_serving: number;
  products_with_findings: number;
  menu_findings_presence_only: number;
  panels_trans_fat_quantified: number;
  panels_added_sugar_quantified: number;
};

export type Corpus = CorpusSnapshot & {
  /** Rendered as "31 Aug 2026", from computed_at. */
  measured_at: string;
  findings_pct: number;
  shop_refusal_pct: number;
  panels_pct: number;
  serving_basis_pct: number;
  trans_fat_pct: number;
  added_sugar_pct: number;
};

function corpusUrl(): string {
  const base = process.env.KNOWNGATE_API_BASE?.replace(/\/$/, "");
  return base ? `${base}/corpus` : "https://www.knowngate.com/api/knowngate/v0/corpus";
}

const pct = (n: number, d: number): number => (d > 0 ? Math.round((n / d) * 100) : 0);
const pct1 = (n: number, d: number): number =>
  d > 0 ? Math.round((n / d) * 1000) / 10 : 0;

function formatMeasuredAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function deriveCorpus(s: CorpusSnapshot): Corpus {
  return {
    ...s,
    measured_at: formatMeasuredAt(s.computed_at),
    findings_pct: pct(s.products_with_findings, s.shelf_records),
    shop_refusal_pct: 100 - pct(s.products_with_findings, s.shelf_records),
    panels_pct: pct(s.nutrition_panels, s.shelf_records),
    serving_basis_pct: pct(s.panels_with_serving, s.nutrition_panels),
    trans_fat_pct: pct1(s.panels_trans_fat_quantified, s.nutrition_panels),
    added_sugar_pct: pct(s.panels_added_sugar_quantified, s.nutrition_panels),
  };
}

/** Null when the snapshot cannot be read; the page renders held state rather than a stale number. */
export async function getCorpusSnapshot(): Promise<Corpus | null> {
  try {
    const res = await fetch(corpusUrl(), { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<CorpusSnapshot>;
    if (typeof body.shelf_records !== "number" || typeof body.computed_at !== "string") return null;
    return deriveCorpus(body as CorpusSnapshot);
  } catch {
    return null;
  }
}
