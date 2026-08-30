# Product Requirements Document

## Product Summary

KnownGate is a verification layer for agents and the humans who rely on them. A browser agent brings a food subject to the page, the page rules it against a household premise confirmed by a human, and the result is one of four evidence-backed verdicts. The product does not recommend what to buy or where to eat; it determines whether the supplied evidence clears, conflicts with, or cannot fully answer the household's stated restrictions.

The defining interaction pattern is **Page as Authority**: *agent proposes → page rules → human owns the premise.* The agent may propose restrictions and candidates, run checks, read the shared board, and request a frozen record. It may not confirm or change the premise, override a verdict, decide an amber result, or send a record.

## Product Principles

1. **Unknown counts as no.** Missing evidence can never appear as clearance.
2. **A clear requires composition and preparation.** If preparation is silent, the product asks one concrete question.
3. **The premise belongs to the human.** Checks remain blocked until a person confirms the restrictions in the page.
4. **Evidence is part of the answer.** Every verdict displays its source and read date.
5. **The interface is shared state.** Agent actions visibly update the same page the human reads.
6. **Honest failure is a feature.** `cannot_verify` and incomplete operator evidence are designed outcomes, not generic errors.
7. **Restrictions are transient.** No account, profile, cookie, or server-side household premise persists them.
8. **KnownGate rules; it does not choose.** Search, ranking, planning, and recommendation remain outside the product.

## Target Users

### Restricted household member

A person who needs a defensible answer about whether a packaged product, ingredient list, restaurant, or menu item conflicts with household restrictions.

### Household decision-maker

A parent or other responsible person who owns the restriction premise and decides what to do with incomplete evidence.

### Household collaborator

A relative, sitter, school worker, or other person who needs a frozen, dated record that states both the premise and the findings.

### Browser agent

An agent acting on a human's behalf that needs a deterministic, schema-defined verification step instead of improvising an answer from general knowledge.

### Judge or evaluator

A reviewer who needs to understand the product quickly, inspect its tools, reproduce the core workflow, and see measurable evidence that WebMCP improves agent behavior.

## Core User Journey

### First visit without an agent

1. The visitor sees the KnownGate masthead, tagline, compact doctrine, and an empty ruling ledger.
2. The page makes it clear that no checks can run until restrictions are confirmed.
3. The visitor can manually enter or select FDA-9 restrictions, optionally name diners and location, and confirm the premise.
4. The visitor can manually submit a UPC, product name, menu item and venue, venue, or ingredient list.
5. Results enter the same ledger used by WebMCP calls.
6. The visitor can switch between the human-readable ledger and its structured Agent view.
7. The visitor can request a frozen record, then confirm that action in-page.

### First visit with an agent

1. The agent discovers exactly five ruling-room tools.
2. It calls `propose_premise`; the proposed restrictions become visible immediately.
3. The page pauses for human confirmation. Until confirmation, check attempts return a correctable “premise not confirmed” error.
4. After confirmation, the agent calls `check_item` and `check_place`.
5. Each tool call visibly creates or updates ledger state before returning its compact result.
6. The agent calls `get_board` to read the same premise and verdict state the human sees.
7. The agent calls `freeze_check`; the page again requires a human decision before creating the record.

### Direct label or venue visit

1. A human sees the subject's evidence, preparation coverage, source, and dates.
2. An agent discovers exactly `get_label_facts` and `check_here`.
3. `check_here` accepts restrictions for this call only, visibly renders the verdict, and returns the same verdict semantics as the ruling room.

### Frozen record visit

1. The visitor sees the freeze date and a notice that the page does not update.
2. The confirmed premise appears above the findings and states that it came from the household, not KnownGate.
3. The evidence and verdicts remain readable, but the page exposes no tools and no mutation controls.

## Epics And User Stories

### Epic 1: Establish a human-owned premise

#### Story 1.1 — Human enters a premise

As a household decision-maker, I want to state who is eating and what they avoid so that every ruling has an explicit premise.

Acceptance criteria:

- The page offers the nine FDA-9 restrictions as clear selectable options.
- A person can add free-text “other” restrictions, which are labeled as not currently ruleable.
- Diners and location are optional.
- The page distinguishes draft/proposed premises from confirmed premises.
- No check can run while the premise is absent or unconfirmed.
- Confirmation is a visible human action.
- Once confirmed, the premise is printed above or immediately before the ledger.
- Reloading or leaving the page does not restore the premise.

#### Story 1.2 — Agent proposes a premise

As a browser agent, I want to propose a premise for human review so that I can help without owning the household's restrictions.

Acceptance criteria:

- Calling `propose_premise` makes the proposal visible before requesting interaction.
- The human can confirm or edit the proposal in-page.
- The tool returns the confirmed premise only after supported human interaction completes.
- If native interaction is unavailable, the tool returns `awaiting_human_confirmation` and the page remains blocked until a human confirms.
- Invalid restriction shapes return a compact error explaining exactly what to correct.

#### Story 1.3 — Protect the confirmed premise

As a household decision-maker, I want agents prevented from silently changing confirmed restrictions so that every later verdict remains tied to what I approved.

Acceptance criteria:

- No registered tool changes a confirmed premise.
- A human can begin a deliberate premise-change flow from the interface.
- Changing a confirmed premise cannot silently preserve old verdicts as if they were ruled against the new premise; the interface clears or explicitly invalidates them.
- The page never sends the premise to storage except as part of a user-confirmed frozen record payload.

### Epic 2: Rule individual food subjects

#### Story 2.1 — Check a packaged product by UPC

As a household member, I want a UPC ruled against the confirmed premise so that I can receive the strongest available product evidence.

Acceptance criteria:

- A valid UPC check produces exactly one of the four verdicts.
- The visible result names the product when resolved.
- The result shows composition and preparation coverage separately.
- Conflicts identify the restriction and quote the matching evidence.
- The source name and read date are always visible.
- A label link appears when the API supplies one.
- A miss explains that the package UPC is the preferred reliable path when appropriate.

#### Story 2.2 — Check a product query

As a household member, I want to check a product name when I do not have the UPC so that I can attempt a convenience match without mistaking it for stronger evidence.

Acceptance criteria:

- The interface identifies product-name lookup as less reliable than UPC resolution.
- A successful match renders the same verdict shape as a UPC result.
- A miss returns a visible, agent-correctable suggestion to try the package UPC.
- The product-query path never turns an unresolved match into clearance.

#### Story 2.3 — Check a menu item

As a household member, I want to rule a named menu item at a named venue so that composition and preparation evidence are evaluated together.

Acceptance criteria:

- Venue is required for a menu-item subject.
- A missing venue yields a specific correction, not a generic failure.
- When composition is covered and preparation is silent, the verdict is `ask_one_question`.
- An amber result displays the literal question returned by the API prominently enough to carry to the counter.
- Operator caveats appear verbatim with their capture date.

#### Story 2.4 — Check a supplied ingredient list

As a household member, I want to paste an ingredient list so that the exact text I possess can be ruled immediately.

Acceptance criteria:

- The ingredient text itself is treated as the source.
- Conflicting tokens are highlighted or quoted in the evidence detail.
- The result never implies preparation coverage that the supplied list does not contain.
- Source copy states “the ingredient list you provided.”

### Epic 3: Rule a place and its published menu evidence

#### Story 3.1 — Rule a machine-readable published chart

As a household member, I want a venue's published chart ruled as a whole so that I can see the evidence gradient across its menu.

Acceptance criteria:

- The result identifies the venue, chain, and resolved location where available.
- The page displays counts for all four verdicts.
- Up to five notable items appear with their complete visible verdict context.
- The source and read date appear with the menu ledger.
- A large ledger remains scannable without concealing the dominance of amber or conflict results.

#### Story 3.2 — Report a published but unreadable chart honestly

As a household member, I want to know when a venue publishes information that cannot be ruled item-by-item so that I do not confuse publication with verification.

Acceptance criteria:

- `published_not_machine_readable` is a named visible state.
- The operator caveat is shown verbatim with source and capture/read date.
- The interface does not fabricate per-item results.
- The state is framed as evidence honesty, not a system crash.

#### Story 3.3 — Report that no chart was found

As a household member, I want an unmistakable cannot-verify result when no published chart exists so that absence of evidence never appears safe.

Acceptance criteria:

- `none_found` maps to an honest cannot-verify presentation.
- The result uses the diagonal hatch treatment and text/icon labeling, not a standalone color.
- The page explains what evidence is missing.

### Epic 4: Understand and share the ruling ledger

#### Story 4.1 — Read verdicts as a human

As a household member, I want each verdict to be legible before its supporting details so that I can understand the finding without losing the evidence.

Acceptance criteria:

- Verdict label and subject are visually dominant.
- Source, read date, coverage, conflicts, caveats, and questions use the evidence typography.
- Green, amber, and red never serve as the only signal.
- `cannot_verify` is always hatched and named.
- The footer disclaimer appears on every page.

#### Story 4.2 — Read the same state as an agent

As a judge or developer, I want to switch to the raw structured board so that I can verify the agent and human views are derived from the same state.

Acceptance criteria:

- A Human/Agent toggle is always discoverable on the ruling room.
- Agent view displays valid structured JSON for the current premise and ledger.
- Switching views does not change, refetch, or reorder the board.
- New tool results appear in whichever view is active.

#### Story 4.3 — Freeze a dated record

As a household decision-maker, I want to freeze the current board after confirming the action so that I can hand a stable record to another person.

Acceptance criteria:

- Freeze remains disabled until a premise is confirmed and at least one result exists.
- The human confirms freeze in-page.
- Success returns and navigates or links to a valid `/ck/ck_…` URL.
- The frozen page prints the premise above the verdicts.
- The frozen timestamp is visible and the page states that it does not update.
- The frozen page exposes no WebMCP tools.

### Epic 5: Recover from incorrect agent behavior

#### Story 5.1 — Correct out-of-order calls

As a browser agent, I want precise errors when I call a tool out of order so that I can recover without human debugging.

Acceptance criteria:

- Checking before premise confirmation returns `premise_not_confirmed` or an equivalent stable code.
- The message tells the agent to call `propose_premise` first.
- Freezing an empty board explains what prerequisite is missing.
- Invalid parameters identify the missing or malformed field.
- Errors appear visibly in page activity/state as well as in tool output.

#### Story 5.2 — Preserve honest API failures

As a household member, I want network and evidence failures distinguished so that technical failure is not confused with a safety verdict.

Acceptance criteria:

- A request failure never renders as `no_conflict`.
- Evidence-level `cannot_verify` remains a first-class verdict.
- Transport/server errors appear as retryable operational errors with concise detail.
- The previous valid ledger remains readable after a later request fails.

### Epic 6: Use KnownGate without WebMCP

#### Story 6.1 — Plain website fallback

As a human using an unsupported browser, I want the same core ruling workflow so that WebMCP support is an enhancement rather than a requirement for basic access.

Acceptance criteria:

- The page loads without console-breaking errors when `document.modelContext` is absent.
- Manual premise entry, confirmation, checks, ledger views, evidence links, and freeze remain usable.
- The interface does not present a blocking browser-support warning.
- Agent-specific status may be shown unobtrusively without degrading human use.

### Epic 7: Expose deterministic WebMCP tools

#### Story 7.1 — Discover the correct tool set

As a browser agent, I want a small page-specific tool set so that I can select the correct action reliably.

Acceptance criteria:

- The ruling room registers exactly five specified tools.
- Label and venue pages register exactly two specified tools.
- Frozen pages register zero tools.
- `get_board` and `get_label_facts` are marked read-only.
- Tool names, descriptions, parameter descriptions, and outputs remain within the stated budgets.
- Tools unregister when the route/page lifecycle ends.

#### Story 7.2 — See every tool effect

As a human observer, I want every agent action reflected visibly so that I can understand and audit what the agent did.

Acceptance criteria:

- Premise proposals appear before interaction is requested.
- Checks create or update visible ledger rows during execution.
- Freeze requests show a pending human decision.
- Tool errors produce visible, non-destructive feedback.

### Epic 8: Prove the product and WebMCP behavior

#### Story 8.1 — Run deterministic scenarios

As a project evaluator, I want repeatable scenarios for valid, invalid, and out-of-order calls so that implementation quality is evidenced rather than asserted.

Acceptance criteria:

- The repository includes scenarios covering all seven tool names.
- Scenarios include valid input, malformed input, and prerequisite violations.
- Results record pass/fail and whether the agent can recover.
- Published metrics are generated from real recorded runs.
- Unmeasured metrics display “not yet measured.”

#### Story 8.2 — Understand the reusable pattern

As a protocol or browser-platform reviewer, I want the README to explain Page as Authority so that the design contribution can be evaluated independently of the food use case.

Acceptance criteria:

- The exact pattern name and phrase appear in the README.
- A diagram shows agent proposal, page ruling, human premise ownership, and visible shared state.
- The README identifies actions deliberately omitted from tools.
- Setup works in fixture mode without credentials.
- Browser testing instructions cover ChatGPT's in-app browser and Chrome's WebMCP flags/panel.

## Experience Requirements

### Visual register

- Terminal-ledger presentation, light-first with a complete dark theme.
- Anybody for masthead and large verdicts; Familjen Grotesk for body; Azeret Mono for evidence, dates, IDs, sources, and tool names.
- Light background `#F4F5F4`, ink `#15181A`, petrol chrome `#1F4A57`.
- Verdict colors are limited to green `#20714A`, amber `#9A6A0B`, and red `#A43B2F`.
- Dark theme uses the same system on `#0B0D0D`.
- Fluid, full-width layout with one responsive structure rather than a separate mobile composition.

### Voice and terminology

- Use “finding” or “verdict,” never a promise of safety.
- Use “no conflict found,” not “safe.”
- Use “ask one question,” not “probably okay.”
- Use “couldn't verify” or “cannot verify,” not “unknown” without explanation.
- Make it explicit that the premise came from the household.

### Loading and mutation

- Pending operations identify the subject being checked.
- New results should land without shifting the premise out of view or obscuring existing evidence.
- A repeated check may update the existing subject row or add a dated new result, but must do so consistently and visibly.
- Controls remain operable by keyboard, and focus moves predictably into human confirmation surfaces.

## Edge Cases

- Empty board: explain the premise-first workflow and show no fabricated sample result as live state.
- Agent checks before proposing a premise: return a correctable error and do not call the API.
- Agent proposes an empty restriction list: reject it with the accepted shape and FDA-9 guidance.
- “Other” restriction: accept the premise but return `cannot_verify` for that restriction with the documented vocabulary reason.
- Human edits a proposed premise: return only the edited, confirmed value.
- Human declines premise confirmation: keep the board blocked and report that confirmation did not occur.
- Premise changes after results exist: do not silently reinterpret old results; clear or visibly invalidate the ledger.
- Duplicate subject checks: avoid ambiguous duplicate rows or clearly distinguish repeated attempts.
- Extremely long ingredient text: enforce a usable input limit and return a specific correction when exceeded.
- Product query ambiguity: never choose a weak match silently; ask for or recommend the UPC.
- Venue location omitted: allow chain-level resolution where supported and disclose the resolved scope.
- Published chart cannot be parsed: preserve source and caveat without per-item invention.
- No published chart: show hatched cannot-verify state.
- API timeout or unavailable backend: show an operational error, preserve prior results, and allow retry.
- Unsupported WebMCP browser: no registration attempt should break the plain website.
- WebMCP route change: tools from the prior page must no longer be callable.
- Tool output approaching 1.5KB: return compact counts/notable items and link to the rendered detail.
- Freeze requested with no results: reject with a precise prerequisite error.
- Invalid freeze ID: show a clear not-found state without registering tools.
- Frozen payload contains a caveat or question: preserve it verbatim and maintain the original evidence date.
- Source URL is null: show the source name and read date without rendering a broken link.
- Dark theme cannot-verify hatch: maintain sufficient contrast without introducing another saturated verdict color.
- JavaScript or hydration delay: the initial page remains understandable and does not display misleading cleared results.

## What We Are Building

- The complete ruling-room, label, venue, and frozen-record experience.
- All seven page-appropriate native WebMCP tools with human gates and visible mutations.
- Live API integration plus standalone fixtures/mock mode.
- All four verdicts and real evidence-gradient states.
- Plain-web fallback, responsive themes, accessibility signals, and deterministic errors.
- Evaluation scenarios, honest AX metrics, judged README, and deployable Vercel build.

## What We Would Add With More Time

These are roadmap directions, not hidden requirements for this submission:

- Operator-side evidence publishing and preparation statements.
- Practitioner-issued premises.
- Multi-household institutional menu ruling for schools and caterers.
- Wider venue-chart ingestion and deeper national per-item coverage.
- Additional non-FDA-9 vocabularies once they can be ruled honestly.

The product would still not become a planner, recommendation engine, account system, or chat interface.

## Submission Proof Points

- The page visibly blocks an agent until a human owns the premise.
- The same agent receives a sourced verdict through WebMCP where an ungated answer could freestyle.
- Product and place checks demonstrate both conflict and amber outcomes.
- A failure state produces a useful human handoff question or an honest hatch rather than a guess.
- Human and Agent views prove a single shared state.
- Freeze turns agent work into a dated artifact humans can hand to one another.
- The tool set is intentionally constrained: consequential human decisions are absent by design.
- Fixture mode proves the public repository is independently runnable.
- Real evaluation output demonstrates tool choice, completion, and recovery without invented numbers.

## Product Acceptance

The product is accepted when a judge can complete the definition-of-done path from the live ruling room, inspect the correct tools on each page, reproduce the same behavior in fixture mode from the public repository, and understand within the first portion of the demo why the page—not merely the backend API—is the authority that changes agent behavior.
