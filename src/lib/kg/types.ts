/** Free tier, decided 1 Sep 2026. The API's own copy and the frames agree. */
export const FREE_TIER_CHECKS = 100;

export type DesignVerdict =
  | "no_conflict_found"
  | "conflict_found"
  | "ask_one_question"
  | "couldnt_verify";

export type AxisState = "covered" | "not_covered";

export type Question = {
  code: string;
  family: "preparation" | "serving" | "composition";
  question: string;
  what_counts: string;
  context: string;
};

export const VERDICT_PROSE: Record<DesignVerdict, string> = {
  no_conflict_found: "no conflict found",
  conflict_found: "conflict found",
  ask_one_question: "ask one question",
  couldnt_verify: "couldn't verify",
};

export const VERDICT_TITLE: Record<DesignVerdict, string> = {
  no_conflict_found: "No conflict found",
  conflict_found: "Conflict found",
  ask_one_question: "Ask one question",
  couldnt_verify: "Couldn't verify",
};

export const NAV_LINKS = [
  { href: "/standard", label: "The standard", short: "what counts as proof" },
  { href: "/questions", label: "Questions", short: "every question we can ask" },
  { href: "/refusals", label: "Refusals", short: "how often we decline" },
  { href: "/agents", label: "Agents", short: "the machine front door" },
  { href: "/developers", label: "Developers", short: "tools, docs and keys" },
] as const;
