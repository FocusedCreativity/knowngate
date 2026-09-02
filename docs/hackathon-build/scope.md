# Project Scope

## Project Name

**KnownGate** — confirmed. Tagline: *every answer, with its source.*

## One-Line Summary

KnownGate is a verification layer where agents bring food candidates, the page rules them against a human-confirmed household premise, and every verdict returns sourced, dated evidence.

## Target User

- Primary: households managing food allergies or other food restrictions.
- Human collaborators: parents, relatives, sitters, school staff, and anyone carrying a household's restrictions into a food decision.
- Agent collaborators: browser agents planning or assisting elsewhere that need a deterministic verification gate before a household acts.
- Future, not this build: practitioners issuing premises; manufacturers and operators closing evidence gaps; schools and caterers ruling menus across households.

## Problem

Agents can produce plausible food-safety answers without binding themselves to evidence, preparation coverage, or a human-owned premise. For restricted households, an unsourced guess or an answer that treats missing evidence as clearance is unacceptable.

KnownGate makes verification a callable page-level primitive. The agent proposes; the page rules; the human owns the premise and all consequential decisions.

## Product Law

- Unknown counts as no.
- A clear requires both composition and preparation coverage.
- Restrictions are never stored server-side.
- KnownGate verifies eligibility; it never searches, recommends, ranks, or plans.
- Every verdict shows its source and read date.
- Operator caveats are quoted and preserved, never interpreted away.
- Only humans confirm or change restrictions, decide ambers, and send frozen records.
- Every page carries: “A finding, not a promise. Not allergen advice.”

## Core Workflow

1. A human or agent opens the ruling room.
2. The agent calls `propose_premise` with diners, location, and restrictions.
3. The page renders the proposal and requires human confirmation in-page.
4. After confirmation, the agent calls `check_item` and/or `check_place`.
5. Verdict rows land visibly in the shared ledger with coverage, evidence, source, date, conflicts, caveats, and any written counter-question.
6. The Human/Agent toggle switches between the human-readable ledger and the compact structured state the agent sees.
7. The agent may read the board with `get_board`.
8. A human-gated `freeze_check` creates a dated, read-only `/ck/[id]` record with the premise printed above the verdicts.
9. The same evidence is available through label and venue pages, each exposing `get_label_facts` and `check_here`.

## Verdict Set

- `no_conflict`: composition and preparation are both covered.
- `conflict`: evidence names a restriction.
- `ask_one_question`: composition is covered and preparation is silent; return the exact question a human should ask.
- `cannot_verify`: no adequate published evidence; render with a hatch pattern, never color alone.

## What We Are Building

- Ruling room at `/` with premise confirmation, visible ledger, four verdict states, theme support, and Human/Agent toggle.
- Exactly five ruling-room WebMCP tools: `propose_premise`, `check_item`, `check_place`, `get_board`, and `freeze_check`.
- Label pages at `/label/[gtin]` and venue pages at `/venue/[slug]`, each with exactly two WebMCP tools.
- Frozen, tool-free check pages at `/ck/[id]`.
- Typed API client for the live private KnownGate v0 API.
- Fixture corpus and mock mode that run without secrets and match the real API shapes.
- Terminal-ledger visual system specified in the build brief, including both themes and accessible non-color verdict signaling.
- Scenario-based WebMCP evaluation runner and an AX results surface that never invents measurements.
- Judged README deliverables: Page as Authority pattern, diagram, tool contract, API summary, setup, browser testing, evaluations, and four-point challenge narrative.
- Vercel deployment from the public GitHub repository.

## What We Are Not Building

- Meal planning or planning boards.
- Restaurant or product search and discovery as a product experience.
- Accounts, authentication, stored household profiles, or server-side premises.
- Recommendations, rankings, or nutrition scoring.
- A chat interface inside KnownGate.
- Human decisions exposed as agent tools: changing confirmed premises, overriding verdicts, deciding ambers, or sending records.
- Operator publishing workflows in this submission; that remains roadmap scope.

## Inspiration And References

- Vercel: precision, hierarchy, and disciplined product presentation.
- Val Town: technical clarity and visible system behavior.
- Linear: dense information made calm and coherent.
- WebMCP examples: registration lifecycle, schema clarity, read/write annotations, visible mutation, and recoverable errors.
- KnownGate's distinguishing move: verification itself is the product, not a wrapper around search, shopping, or planning.

## Delivery Constraints

- Solo build.
- Full focused time through 3 September 2026 at 22:00 CEST.
- Live private KnownGate API is ready to integrate.
- Vercel is already connected to the Git repository.
- Preserve the complete brief; sequence work to achieve an early end-to-end ruling loop, but do not plan feature cuts.
- Commit in small descriptive steps so timestamped history clearly separates challenge work.

## Demo Path

1. Open the live ruling room in ChatGPT's in-app browser.
2. Show the registered site tools.
3. Have the agent propose peanut and sesame restrictions for a household.
4. Human confirms the premise visibly.
5. Agent checks a packaged product and receives a sourced conflict verdict.
6. Agent checks Panda Express and receives the menu ledger, including an amber item with its written counter-question.
7. Show an honest `cannot_verify` or published-but-not-machine-readable recovery state.
8. Toggle Human → Agent to prove both views read the same state.
9. Freeze the check after human confirmation and open the dated `/ck/` record.
10. Close on the Page as Authority pattern: agent proposes → page rules → human owns the premise.

## Submission Story

KnownGate is a non-trivial WebMCP use case because the browser page becomes the authority at the exact point an agent answers. A server API alone cannot stop an agent from improvising a safety answer; the page exposes the sole deterministic route to a verdict, keeps every effect visible to the human, and reserves the premise and consequential actions for human control. The result is a credible verification primitive for restricted households, measured with real tool and recovery evaluations rather than AI theater.

## Definition Of Done

A judge can use the live URL with or without an agent. In the WebMCP path, an agent proposes a premise, a human confirms it, product and venue checks produce visible sourced verdicts, an amber carries a usable question, freeze produces a working immutable URL, and the Human/Agent toggle proves a single shared state. In the plain-web path, the same information remains understandable and usable without WebMCP support.
