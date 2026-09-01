export const FDA9_KEYS = [
  "milk",
  "egg",
  "fish",
  "shellfish",
  "tree_nut",
  "peanut",
  "wheat",
  "soy",
  "sesame",
] as const;

export type Fda9Key = (typeof FDA9_KEYS)[number];
export type RestrictionKey = Fda9Key | "other";

export type Restriction = {
  key: RestrictionKey;
  note?: string;
};

export type Premise = {
  restrictions: Restriction[];
  diners?: string;
  location?: string;
};

export type SubjectKind =
  | "upc"
  | "product_query"
  | "menu_item"
  | "ingredients";

export type Subject = {
  kind: SubjectKind;
  value: string;
  venue?: string;
  name?: string;
};

export type CheckItemRequest = {
  restrictions: Restriction[];
  subject: Subject;
  thresholds?: Threshold[];
};

export type Threshold = {
  nutrient: string;
  max?: number;
  min?: number;
  unit: string;
  basis?: string;
};

export type Verdict =
  | "no_conflict"
  | "conflict"
  | "ask_one_question"
  | "cannot_verify";

/** Live API may return design-system verdict names verbatim through the proxy. */
export type LiveVerdict =
  | Verdict
  | "no_conflict_found"
  | "conflict_found"
  | "couldnt_verify";

export type ThresholdHit = {
  nutrient: string;
  found: number | null;
  unit: string;
  basis?: string;
  max?: number;
  min?: number;
  verdict: LiveVerdict;
  reason?: string;
};

export type CheckPlaceRequest = {
  restrictions: Restriction[];
  venue: { name: string; location?: string };
};

export type CoverageState = "covered" | "not_covered" | "silent" | "unknown";

export type Source = {
  name: string;
  url: string | null;
  read_date: string;
};

export type Caveat = {
  text: string;
  captured: string;
};

export type Conflict = {
  restriction: string;
  evidence: string;
};

export type Unverified = {
  restriction: string;
  reason: string;
};

export type ItemResult = {
  verdict: LiveVerdict;
  subject: Subject;
  coverage: {
    composition: CoverageState;
    preparation: CoverageState;
  };
  conflicts: Conflict[];
  unverified: Unverified[];
  /** The API returns the coded form; older payloads carried a bare string. */
  question: string | { code: string; text: string; what_counts?: string } | null;
  source: Source | null;
  caveat: Caveat | null;
  label_url: string | null;
  threshold_hits?: ThresholdHit[];
  /** Lines the standard forbids dropping from any rendering of this result. */
  must_not_omit?: string[];
};

export type PlaceChartState =
  | "ruled"
  | "published_not_machine_readable"
  | "none_found";

export type VerdictCounts = Record<Verdict, number>;

export type PlaceResult = {
  venue: { name: string; chain: string | null; city: string | null };
  chart: PlaceChartState;
  verdict_counts: VerdictCounts;
  notable: ItemResult[];
  caveat: Caveat | null;
  source: Source | null;
  /** Lines the standard forbids dropping from any rendering of this result. */
  must_not_omit?: string[];
};

export type LabelFinding = {
  allergen_token: string;
  status: "present" | "absent_declared" | "indeterminate";
  evidence_kind: string;
  matched_text: string;
};

/**
 * The typed panel as the corpus holds it. A null means the pack does not
 * state that row, which is not the same as a zero and is never rendered.
 */
export type NutritionPanel = {
  serving_qty: number | null;
  serving_unit: string | null;
  energy_kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  carbohydrate_g: number | null;
  sugar_g: number | null;
  added_sugar_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  cholesterol_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  potassium_mg: number | null;
  vitamin_d_mcg: number | null;
};

export type LabelResult = {
  gtin: string;
  name: string;
  brand: string;
  statement_read: boolean;
  findings: LabelFinding[];
  source: Source | null;
  /** Retailer product photo. Null when the corpus holds none. */
  image_url: string | null;
  /** The ingredient statement as captured. Rendered verbatim or not at all. */
  ingredients_verbatim: string | null;
  /** The retailer's own "Contains:" line, likewise verbatim. */
  allergens_description: string | null;
  /** Null for packs with no panel on file, which is a fact worth printing. */
  nutrition: NutritionPanel | null;
};

export type BoardResult = ItemResult | PlaceResult;

export type FreezeRequest = {
  premise: Premise;
  results: BoardResult[];
};

export type FreezeCreated = {
  ck_id: string;
  url: string;
  frozen_at: string;
};

export type FrozenCheck = {
  ck_id: string;
  payload: FreezeRequest;
  frozen_at: string;
};

export type KnownGateErrorBody = {
  error: { code: string; message: string; missing?: string };
};

export const RESTRICTION_ALIASES: Record<string, Fda9Key> = {
  dairy: "milk",
  milk: "milk",
  egg: "egg",
  eggs: "egg",
  fish: "fish",
  shellfish: "shellfish",
  crustacean_shellfish: "shellfish",
  tree_nut: "tree_nut",
  tree_nuts: "tree_nut",
  peanut: "peanut",
  peanuts: "peanut",
  wheat: "wheat",
  soy: "soy",
  soya: "soy",
  sesame: "sesame",
};

export const EMPTY_VERDICT_COUNTS: VerdictCounts = {
  no_conflict: 0,
  conflict: 0,
  ask_one_question: 0,
  cannot_verify: 0,
};

/** The question as a person would say it, whichever shape the payload used. */
export function questionText(
  q: string | { code: string; text: string; what_counts?: string } | null | undefined,
): string | null {
  if (!q) return null;
  return typeof q === "string" ? q : q.text;
}
