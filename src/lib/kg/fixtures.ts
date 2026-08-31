import questions from "../../../fixtures/design/questions.json";
import workspace from "../../../fixtures/design/workspace.json";
import corpus from "../../../fixtures/design/corpus.json";
import { TOOL_MANIFEST } from "@/lib/webmcp/manifest";
import type { Question } from "./types";

export function getQuestions(): Question[] {
  return questions as Question[];
}

export function getQuestionCount(): number {
  return getQuestions().length;
}

export function getWorkspace() {
  return workspace;
}

export function getCorpus() {
  return corpus;
}

/** Live WebMCP tools registered on this site. */
export function getToolCount(): number {
  return TOOL_MANIFEST.length;
}

/**
 * Canonical layer-1 default once this tree is live: zero until traffic supports more.
 * Walkthrough can still force ?layer1=steady|low_n.
 */
export type RefusalsLayer1 = "zero" | "low_n" | "steady";

export function getRefusalsReviewDefault(): RefusalsLayer1 {
  return "zero";
}

export function formatInt(n: number): string {
  return n.toLocaleString("en-US");
}
