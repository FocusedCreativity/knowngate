import questions from "../../../fixtures/design/questions.json";
import workspace from "../../../fixtures/design/workspace.json";
import type { Question } from "./types";

export function getQuestions(): Question[] {
  return questions as Question[];
}

export function getWorkspace() {
  return workspace;
}

/** Merge-time note: canonical /refusals should default to zero/low_n from live stats, not steady. */
export type RefusalsLayer1 = "zero" | "low_n" | "steady";

export function getRefusalsReviewDefault(): RefusalsLayer1 {
  return "steady";
}
