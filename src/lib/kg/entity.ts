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
  "KnownGate is the food verification layer for people and AI agents: it checks food against what must not be in it, or a number it must stay under, and returns evidence-backed verdicts with their sources and read dates.";

/** The endpoint we publish. The versioned path still works and is documented
 *  on /agents and /developers, but it is never the address we hand out: a
 *  mirrored registry entry carrying "v0" cannot be corrected later. */
export const KNOWNGATE_MCP_ENDPOINT = "https://mcp.knowngate.com";

export const KNOWNGATE_ORIGIN = "https://www.knowngate.com";

/**
 * Every other place KnownGate demonstrably exists. Only verified URLs belong
 * here: a sameAs pointing at a profile that does not exist yet weakens the
 * whole block rather than strengthening it.
 */
export const KNOWNGATE_SAME_AS = ["https://github.com/FocusedCreativity/knowngate"];
