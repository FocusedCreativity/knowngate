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

export type ThresholdHit = {
  nutrient: string;
  found: number | null;
  unit: string;
  basis?: string;
  max?: number;
  min?: number;
  verdict: Verdict;
  reason?: string;
};

export type CheckPlaceRequest = {
  restrictions: Restriction[];
  venue: { name: string; location?: string };
};

export type Verdict =
  | "no_conflict"
  | "conflict"
  | "ask_one_question"
  | "cannot_verify";

export type CoverageState = "covered" | "silent" | "unknown";

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
  verdict: Verdict;
  subject: Subject;
  coverage: {
    composition: CoverageState;
    preparation: CoverageState;
  };
  conflicts: Conflict[];
  unverified: Unverified[];
  question: string | null;
  source: Source | null;
  caveat: Caveat | null;
  label_url: string | null;
  threshold_hits?: ThresholdHit[];
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
};

export type LabelFinding = {
  allergen_token: string;
  status: "present" | "absent_declared" | "indeterminate";
  evidence_kind: string;
  matched_text: string;
};

export type LabelResult = {
  gtin: string;
  name: string;
  brand: string;
  statement_read: boolean;
  findings: LabelFinding[];
  source: Source | null;
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
