/**
 * The evidence standard, as data.
 *
 * /standard states these rules in prose for a person; this states the same
 * rules in a form something else can build against. They are one object so
 * the page and the published profile cannot drift: the ceiling table a
 * reader sees is rendered from the rows served at /standard/v1.json.
 *
 * A standard nobody can validate against is doctrine. This is the part that
 * lets an outside party check a verdict against the rules without asking us
 * whether it is right.
 */

export const STANDARD_VERSION = "1.0";
export const STANDARD_EFFECTIVE = "2026-08-30";
export const STANDARD_NEXT_REVIEW = "2027-02-28";

export type SourceCeiling = {
  source: string;
  what_it_is: string;
  /** The best verdict this source kind alone can ever support. */
  ceiling: Verdict;
};

export type Verdict =
  | "no_conflict_found"
  | "conflict_found"
  | "ask_one_question"
  | "couldnt_verify";

export const VERDICTS: { name: Verdict; issued_when: string }[] = [
  {
    name: "no_conflict_found",
    issued_when:
      "Both what is in it and how it is made were covered by a source that can say so, and nothing you named was found.",
  },
  {
    name: "conflict_found",
    issued_when: "A restriction is present on any source, including a claim. Presence is enough.",
  },
  {
    name: "ask_one_question",
    issued_when:
      "One half is covered. The other can be closed by a single question, and the question is named.",
  },
  {
    name: "couldnt_verify",
    issued_when: "The gap cannot be closed by any question available. Stated plainly, never softened.",
  },
];

/**
 * Who wrote the evidence decides how far it can take you, not whether it
 * happens to be right. A correct reading of a PDF is still our reading.
 */
export const SOURCE_CEILINGS: SourceCeiling[] = [
  {
    source: "Manufacturer label",
    what_it_is: "A legal declaration by the party that made the food",
    ceiling: "no_conflict_found",
  },
  {
    source: "Nutrition panel",
    what_it_is:
      "A mandatory declaration by the party that made the food, per stated serving",
    ceiling: "no_conflict_found",
  },
  {
    source: "Venue statement",
    what_it_is: "Filed by a named person at the venue, dated and superseding",
    ceiling: "no_conflict_found",
  },
  {
    source: "Structured menu field",
    what_it_is: "Item names in a machine-readable field the venue maintains",
    ceiling: "no_conflict_found",
  },
  {
    source: "Q-PREP answer",
    what_it_is: "A dated answer attributed to a named person",
    ceiling: "no_conflict_found",
  },
  { source: "Document", what_it_is: "A PDF or HTML menu we parsed", ceiling: "ask_one_question" },
  {
    source: "Image",
    what_it_is: "A menu or label we transcribed from a photo",
    ceiling: "ask_one_question",
  },
  {
    source: "Agent claim",
    what_it_is: "Ingredients or menu text supplied by an agent",
    ceiling: "ask_one_question",
  },
  {
    source: "Spoken claim",
    what_it_is: "“It has no nuts”, unattributed or unrecorded",
    ceiling: "couldnt_verify",
  },
  { source: "Nothing", what_it_is: "No source on either axis", ceiling: "couldnt_verify" },
];

/** The rules that hold whatever the sources happen to say. */
export const INVARIANTS = [
  "Unknown counts as no. Absence of evidence is never evidence of absence, and no number of reassurances becomes a clear.",
  "A claim can create a conflict but never a clear. Unverified presence is a flag; unverified absence is not a pass.",
  "The both-halves rule applies to allergens only: what is in it and how it is made must both be covered before a clear. A number stands or falls on the panel alone.",
  "Every verdict names the source it rested on and the date that source was read.",
  "A verdict is a statement about a date, not a standing fact.",
  "Changing the restriction set voids every verdict under the previous premise. Nothing carries over.",
  "Verdicts issued under a superseded statement keep their original date. They are not re-cleared and not re-failed.",
  "No payment changes a ruling. A paying publisher gets the same verdict as anyone else.",
  "The word “safe” is not used anywhere in this system.",
];

export const NEVER_COUNTS = [
  "A collective term that hides the source: “natural flavoring”, “spices”, “natural colors”.",
  "Silence in prose. A menu that does not mention nuts is evidence of nothing.",
  "A marketing claim: “non-dairy”, “plant-based”, “allergy friendly”.",
  "An unanswered question, however likely the answer.",
  "Any payment. Publishing evidence is free and a paying publisher gets the same ruling as anyone else.",
  "A front-of-pack claim standing in for the panel. “Low sodium” on the label is a claim, not a measurement.",
  "A panel with no stated serving basis. Per 100g and per serving are different answers to the same question.",
];

/**
 * How this document changes. A standard people write policy against has to
 * promise its own stability, or it cannot be relied on for anything that
 * outlives a single check.
 */
export const CHANGE_POLICY = {
  versioning: "Semantic. MAJOR.MINOR, published at /standard and at /standard/v{major}.json.",
  breaking_change:
    "Anything that could change the verdict on an unchanged premise and unchanged evidence: adding or removing a verdict, moving a source kind's ceiling, or altering the both-halves rule. A breaking change takes a new MAJOR version.",
  non_breaking_change:
    "Wording that does not move a ruling, a new source kind at an existing ceiling, or a new question in the library. These take a new MINOR version.",
  announcement:
    "Every version is published here with its date and what changed, before it takes effect. There are no silent revisions and no per-customer terms.",
  effect_on_existing_verdicts:
    "None. A verdict carries the standard version it was issued under and keeps it. Old verdicts are never re-ruled by a new version; re-running the check is the only way to get a ruling under the current one.",
  proposals: "Proposals are welcome and are answered in public.",
} as const;

export const CHANGELOG = [
  { version: "1.0", date: "2026-08-30", change: "First published." },
];

/** The published profile, exactly as served at /standard/v1.json. */
export function evidenceStandardProfile() {
  return {
    name: "KnownGate Evidence Standard",
    version: STANDARD_VERSION,
    effective: STANDARD_EFFECTIVE,
    next_review: STANDARD_NEXT_REVIEW,
    canonical_url: "https://www.knowngate.com/standard",
    profile_url: "https://www.knowngate.com/standard/v1.json",
    license: "CC-BY-4.0",
    summary:
      "What counts as proof when ruling food against a stated premise, and what each kind of source can and cannot establish.",
    premise_kinds: [
      {
        kind: "absence",
        asserts:
          "This must not be present. The nine major allergens, plus anything more specific you name; “cashew” is recorded as cashew, not blurred into “tree nut”.",
        must_be_covered:
          "Both halves: what is in it (the ingredient list) and how it is made (shared equipment, surfaces, practice). The list alone never produces a clear.",
      },
      {
        kind: "threshold",
        asserts:
          "This must stay under a number, per serving. Sodium, added sugar, saturated fat, potassium, protein floors.",
        must_be_covered:
          "The nutrition panel alone, cited and dated, with its serving size stated. How it is made does not apply; a number does not rub off a shared board.",
      },
    ],
    verdicts: VERDICTS,
    source_ceilings: SOURCE_CEILINGS,
    invariants: INVARIANTS,
    never_counts: NEVER_COUNTS,
    change_policy: CHANGE_POLICY,
    changelog: CHANGELOG,
    /**
     * Stated so nobody builds against a guarantee that does not exist yet.
     * A signature is what would let a third party verify a verdict without
     * trusting us, and this profile is the document it would commit to.
     */
    attestation: {
      signed_verdicts: false,
      note: "Verdicts are not cryptographically signed in v1.0. A saved record at /ck/{id} is the durable artifact: it carries the subject, the premise, the verdict, its source and read date, and the standard version it was issued under.",
    },
  };
}
