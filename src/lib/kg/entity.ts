/**
 * One sentence, used verbatim everywhere KnownGate has to say what it is:
 * the landing meta and og:description, llms.txt, the MCP server card, the
 * standard's opening, the footer, and the Organization schema.
 *
 * It lives here as a constant because entity resolution is defeated by
 * variation. Reword it in one place and every surface moves together; reword
 * it in one surface and the search and model layers see two products.
 */
export const KNOWNGATE_DEFINITION =
  "KnownGate is the food verification layer for people and AI agents with dietary restrictions: it checks food against a stated premise and returns evidence-backed verdicts with sources and dates.";

export const KNOWNGATE_ORIGIN = "https://www.knowngate.com";

/**
 * Every other place KnownGate demonstrably exists. Only verified URLs belong
 * here: a sameAs pointing at a profile that does not exist yet weakens the
 * whole block rather than strengthening it.
 */
export const KNOWNGATE_SAME_AS = ["https://github.com/FocusedCreativity/knowngate"];
