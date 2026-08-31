import "server-only";

import { getQuestions as fixtureQuestions } from "./fixtures.ts";
import type { Question } from "./types.ts";

export type QuestionLibrary = {
  questions: Question[];
  count: number;
  /** False when the endpoint could not be read and the page fell back to fixtures. */
  live: boolean;
};

/**
 * The frame marks this library [LIVE], so it is read from the question-library
 * endpoint rather than the checked-in fixture, which drifts behind production.
 *
 * Resolved here rather than shared with landing-data on purpose: the landing
 * wiring is verified and is not worth disturbing for this.
 */
function questionsUrl(): string {
  if (process.env.KNOWNGATE_MOCK === "1") return "";
  const base = process.env.KNOWNGATE_API_BASE?.replace(/\/$/, "");
  return base
    ? `${base}/questions`
    : "https://www.knowngate.com/api/knowngate/v0/questions";
}

export async function getQuestionLibrary(): Promise<QuestionLibrary> {
  const url = questionsUrl();
  if (url) {
    try {
      // The page says this is read at build time, so it is: resolved when the
      // route is generated and refreshed on each deploy.
      const res = await fetch(url, { cache: "force-cache" });
      if (res.ok) {
        const body = (await res.json()) as { count?: number; questions?: Question[] };
        if (Array.isArray(body.questions) && body.questions.length) {
          return {
            questions: body.questions,
            count: body.count ?? body.questions.length,
            live: true,
          };
        }
      }
    } catch {
      // fall through to fixtures
    }
  }
  const questions = fixtureQuestions();
  return { questions, count: questions.length, live: false };
}
