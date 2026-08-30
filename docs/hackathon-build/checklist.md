# Build Checklist

## Build Preferences

- **Plan design:** Codex-owned, derived from the approved scope, PRD, and spec.
- **Build mode:** Autonomous. This choice locks when implementation begins.
- **Comprehension checks:** N/A.
- **Git:** Commit after each coherent completed item; use small descriptive messages that preserve timestamped challenge history. Never bundle unrelated work.
- **Verification:** Yes. Run relevant automated checks for every item.
- **Check-in cadence:** Three participant checkpoints after items 3, 6, and 9; continue autonomously between them.
- **Failure behavior:** Stop immediately on a non-trivial break, explain the failure, and propose checklist changes before proceeding.
- **Submission wow moment:** The same agent moves from a plausible unsourced guess to a visible, sourced ruling after the human confirms the premise.

## Checklist

- [x] **1. Establish contracts, fixtures, and test foundation**
  Spec ref: `spec.md > API Contracts`; `spec.md > Architecture > 7. Fixture/mock implementation`; `spec.md > Verification Matrix`
  What to build: Define the complete TypeScript contract model, runtime discriminant guards, stable KnownGate error shape, restriction aliases, compact serializers, and the deterministic fixture corpus for all four item verdicts and all three place-chart states. Add a lightweight automated test command and contract tests before UI work begins.
  Acceptance: Captured item, place, label, freeze, and error fixtures satisfy the frozen shapes in `docs/build-brief.md`; malformed discriminants fail validation; compact item/place payloads remain measurable; fixture content covers conflict, clear, amber, cannot-verify, ruled chart, unreadable chart, and no-chart behavior.
  Verify: Run the contract test command, TypeScript/production build, ESLint, and `git diff --check`; inspect that fixtures contain sources and read dates and no invented evaluation metrics.

- [x] **2. Build the live/mock API boundary and Route Handlers**
  Spec ref: `spec.md > Architecture > 6. API adapter and Route Handlers`; `spec.md > Environment Configuration`; `spec.md > Error Strategy`
  What to build: Implement the server-only API adapter, deterministic fixture selection, same-origin Route Handlers for item/place checks, label lookup, freeze create/read, and optional venue detail. Default local development to mock mode when no API base is present, preserve live status/error shapes, enforce input and payload limits, and prevent request-body logging.
  Acceptance: Manual HTTP calls receive the documented responses in mock mode; live mode targets `KNOWNGATE_API_BASE`; transport failures stay operational errors rather than verdicts; no backend base URL enters the browser bundle; freeze IDs and payload size are validated.
  Verify: Invoke every Route Handler with valid and invalid requests, run contract tests/build/lint, inspect browser-facing code for `KNOWNGATE_API_BASE`, and confirm no premise payload logging exists.

- [x] **3. Deliver the plain-web ruling-room vertical slice**
  Spec ref: `spec.md > Architecture > 2. Ruling-room client application`; `spec.md > Data Flow > Premise proposal and confirmation`; `spec.md > Data Flow > Item check`; `spec.md > Data Flow > Place check`
  What to build: Implement the board reducer, invariant tests, manual premise editor with FDA-9 and free-text restrictions, human confirmation gate, manual item/place controls, visible pending/error activity, Human/Agent shared-state toggle, and functional ledger using mock APIs. Premise changes must clear or invalidate old results and reload must forget restrictions.
  Acceptance: A human can confirm a premise, check a conflict product and Panda Express, see an amber question, switch to identical compact Agent JSON, recover from an out-of-order action, and reload to an empty premise. Previous successful results survive later operational errors.
  Verify: Run reducer/recovery tests, build/lint, and complete the full manual flow in an ordinary browser. **Checkpoint 1:** ask the participant to inspect premise ownership, ledger behavior, and Human/Agent parity before continuing.

- [ ] **4. Apply the terminal-ledger design system and accessible verdict language**
  Spec ref: `spec.md > Architecture > 1. Root application shell`; `spec.md > Architecture > 4. Ledger and shared Agent view`; `prd.md > Experience Requirements`
  What to build: Install the frozen visual register across the working vertical slice: three `next/font` families, CSS variables, light/dark themes, fluid layout, large verdict hierarchy, mono evidence rows, petrol chrome, accessible labels/icons, and diagonal-hatch `cannot_verify`. Add shared `VerdictCard`, `PlaceLedger`, `SourceLine`, and `Coverage` renderers plus the universal disclaimer.
  Acceptance: All verdicts are distinguishable without color; hatch is used for cannot-verify in both themes; every result visibly includes source/read date; amber questions and operator caveats remain prominent and verbatim; keyboard/focus behavior is usable at narrow and wide layouts.
  Verify: Run build/lint, inspect light/dark and narrow/medium/wide layouts, keyboard through premise confirmation, and verify no saturated colors outside the frozen palette.

- [ ] **5. Register and verify the five ruling-room WebMCP tools**
  Spec ref: `spec.md > Architectural Constraints > WebMCP constraints`; `spec.md > Architecture > 3. Human-interaction gate`; `spec.md > Architecture > 5. WebMCP registration layer`
  What to build: Add minimal native WebMCP types, JSON Schemas, hard-budget constants/tests, feature-detected registration hook, AbortController cleanup, fresh-state refs, and exactly `propose_premise`, `check_item`, `check_place`, `get_board`, and `freeze_check`. Route every executor through the same commands as manual UI and mutate visible state before returning.
  Acceptance: Unsupported browsers remain fully functional; `get_board` is read-only; invalid/out-of-order calls return correctable errors; proposal/freeze are human-gated with documented fallback; names/descriptions/parameters/outputs stay under limits; no tool can change a confirmed premise, override a verdict, decide an amber, or send a record.
  Verify: Run schema/output budget and recovery tests, build/lint, inspect exactly five tools in Chrome's WebMCP panel, invoke each tool, and confirm visible mutation plus cleanup on route navigation.

- [ ] **6. Implement label and venue evidence routes with two-tool surfaces**
  Spec ref: `spec.md > Architecture > 8. Label and venue evidence pages`; `spec.md > Data Flow > Evidence page check`
  What to build: Add server-rendered `/label/[gtin]` and `/venue/[slug]` pages using async Next.js 16 params, static fixture params, shared evidence renderers, source/date/coverage detail, and a narrow client check island. Register exactly `get_label_facts` and `check_here` on each evidence page with per-call restrictions only.
  Acceptance: Fixture routes prerender and live IDs resolve through the adapter; evidence remains readable without JavaScript/WebMCP; restrictions are not retained; `check_here` visibly renders its verdict; route changes remove ruling-room tools and expose exactly two evidence tools.
  Verify: Run production build/lint, open fixture label/venue routes, invoke both tools in the WebMCP panel, navigate across route families, and confirm tool sets change from five to two. **Checkpoint 2:** ask the participant to inspect the designed ruling room and page-specific WebMCP behavior.

- [ ] **7. Complete human-gated freeze and immutable record pages**
  Spec ref: `spec.md > Architecture > 9. Frozen record page`; `spec.md > Data Flow > Freeze`; `prd.md > Story 4.3 — Freeze a dated record`
  What to build: Finish `freeze_check` and manual freeze through the shared human gate, live create/read roundtrip, local in-process mock plus canonical frozen fixture, validated `/ck/[id]` pages, frozen timestamp/banner, household-origin premise copy, and shared read-only verdict renderers. Ensure frozen pages import no WebMCP registration or mutation controls.
  Acceptance: Freeze is blocked without confirmed premise/results; cancellation creates nothing; confirmation returns a valid `ck_` URL; live records survive a separate page request; canonical mock record is reproducible; invalid IDs render not-found; frozen pages show premise above results and expose zero tools.
  Verify: Run freeze tests/build/lint, test mock and live create/read roundtrips, inspect the frozen page in Chrome/ChatGPT, and confirm Site tools/WebMCP panel reports zero tools.

- [ ] **8. Add evaluation runner, AX surface, and privacy/security checks**
  Spec ref: `spec.md > Architecture > 10. Evaluations and AX surface`; `spec.md > Security And Trust Boundaries`; `spec.md > Risks And Verification`
  What to build: Implement scenarios for all seven tool names with valid, invalid, and out-of-order inputs; record pass/fail, completion, recovery, and calls/task; generate `evals/results.json`; render `/ax`; add checks for UTF-8 output budgets, untrusted caveat handling, storage/logging leakage, input limits, and lifecycle cleanup. Display “not yet measured” for unrun browser-agent metrics.
  Acceptance: Results are reproducible and derived from real runs; all tool definitions and fixture outputs pass hard budgets; recovery cases identify the next action; no restriction storage/logging is found; AX never invents values.
  Verify: Run the evaluation and full automated suite, regenerate results, inspect `/ax`, search source for storage/logging of premise data, and review the results diff for unsupported claims.

- [ ] **9. Harden the deployed judging path in Chrome, Vercel, and ChatGPT**
  Spec ref: `spec.md > Verification Matrix`; `spec.md > Demo And Submission Flow`; `scope.md > Definition Of Done`
  What to build: Configure live Vercel environment, deploy through the connected repository, verify HTTPS/origin isolation, run the complete definition-of-done sequence against the live API, correct runtime differences, and collect real browser-agent metrics. Exercise light/dark, keyboard, responsive, operational-failure, route-lifecycle, and output-budget behavior on the deployed app.
  Acceptance: The live URL works as a plain website and in ChatGPT's in-app browser; five/two/zero tool sets appear on correct routes; `requestUserInteraction` or its documented fallback behaves correctly; product, place, amber, failure, Agent view, and durable freeze all work; no unverified metric is presented as measured.
  Verify: Run production build/lint/tests, Vercel deployment checks, Chrome WebMCP panel flow, and ChatGPT Site tools flow. **Checkpoint 3:** have the participant complete and approve the live demo path before submission materials are finalized.

- [ ] **10. Prepare the judged repository and Devpost handoff**
  Spec ref: `spec.md > Demo And Submission Flow`; `prd.md > Submission Proof Points`; `docs/build-brief.md > Definition of done`
  What to build: Replace the starter README with the complete judged artifact: KnownGate doctrine, exact **Page as Authority** pattern and diagram, tool reference, API/fixture contract, zero-secret mock setup, live configuration, both browser testing paths, real eval results, pre-existing/new-work distinction, four-point WebMCP narrative, demo instructions, license/repository/live links, and timestamped verification notes. Assemble screenshot targets, <3-minute video shot list/script, and submission handoff notes without submitting.
  Acceptance: A fresh clone runs in mock mode; README explains why the page is essential rather than merely the API; repository/license are public and visible; all claims match the deployed build; the participant has the repo link, live URL, verified demo path, screenshots list, video plan, testing instructions, and learning documents required for `$prepare-submission`.
  Verify: Follow README setup from a clean environment, test public links in an unauthenticated browser, run the full quality suite, review the handoff materials against official requirements, and confirm the next command is `$prepare-submission`.
