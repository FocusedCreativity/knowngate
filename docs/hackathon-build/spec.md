# Technical Spec

## Overview

KnownGate is a Next.js 16 App Router application deployed on Vercel. It has one stateful client surface—the ruling room—and three evidence-oriented route families rendered primarily on the server: label pages, venue pages, and frozen records. Native WebMCP registration lives only in small client components because it requires `document.modelContext`, React lifecycle hooks, and access to current visible UI state.

The application uses a same-origin API boundary. Browser UI and WebMCP tools call `/api/knowngate/v0/*`; Next.js Route Handlers delegate to a typed adapter in `src/lib/knowngate/api.ts`. The adapter selects real `fuda` requests or repository fixtures based on environment configuration. This keeps the client unaware of backend origins, prevents environment leakage, and gives manual UI and WebMCP calls one identical data path.

The ruling room uses a single `useReducer` state machine. Manual controls and WebMCP executors dispatch the same commands, and renderers consume the same state. This directly implements the judged Human/Agent shared-state claim.

## Stack

- **Framework:** Next.js 16.3.3 App Router and React 19.2.8.
- **Language:** TypeScript 5 with strict project settings.
- **Styling:** existing Tailwind CSS 4/PostCSS toolchain plus design tokens and component-level classes in `globals.css`; no runtime CSS library.
- **Fonts:** `next/font/google` for Anybody, Familjen Grotesk, and Azeret Mono, exposed as CSS variables from the root layout.
- **State:** React `useReducer`, refs, and context limited to the ruling-room client boundary; no persistence library.
- **Validation:** small handwritten type guards for runtime API/tool input at first; add a schema library only if repeated validation becomes error-prone.
- **Tests:** Node's built-in test runner or Vitest for pure state/contract tests; Playwright only for browser flows if it can be added without slowing the core build.
- **Deployment:** Vercel through the existing Git integration.

Documentation:

- [Next.js App Router](https://nextjs.org/docs/app)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Dynamic route segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes)
- [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [next/font](https://nextjs.org/docs/app/getting-started/fonts)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP developer documentation](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome WebMCP evaluation guidance](https://developer.chrome.com/docs/ai/webmcp/evals)

## Architectural Constraints

### App Router conventions

- Pages and layouts remain Server Components by default.
- Dynamic route `params` are typed as promises and awaited, matching Next.js 16 conventions.
- `'use client'` is applied at the narrowest boundary that needs state, event handlers, effects, or browser APIs.
- Props crossing from server to client are plain serializable contract objects.
- Label and venue fixture routes use `generateStaticParams`; unlisted live routes resolve dynamically through the API adapter.
- Frozen routes are dynamic in live mode because IDs are created at runtime. Known fixture IDs may still be statically generated.

### WebMCP constraints

- Registration runs in top-level page JavaScript only.
- Every registration checks `typeof document.modelContext?.registerTool === 'function'`.
- One `AbortController` owns each page's tool set; effect cleanup aborts it.
- Tool callbacks read fresh state through refs to avoid stale React closures without re-registering on every ledger change.
- Every executor dispatches a visible pending/activity mutation before awaiting work and a visible success/error mutation before returning.
- Tool outputs are compacted and measured under 1.5KB in automated contract tests.
- Operator-provided caveat text is returned as untrusted content where the runtime supports the annotation.
- Frozen pages import no registration component.

### Privacy constraints

- Premise state lives only in the ruling-room client reducer.
- No local storage, session storage, cookies, analytics payload, or server session contains restrictions.
- The premise is sent only with check requests and a user-confirmed freeze request.
- Logs must not print request bodies containing premises.

## Architecture

### 1. Root application shell

Implements: `prd.md > Experience Requirements`, `Epic 4`, `Epic 6`.

The root layout loads font variables, metadata, color-scheme support, global tokens, and the universal disclaimer footer. Static chrome remains server-rendered. Theme selection uses CSS media preference initially; an optional human theme toggle is a small client island if added.

### 2. Ruling-room client application

Implements: `prd.md > Epics 1–5`, `Epic 6`, `Epic 7`.

`src/app/page.tsx` is a Server Component shell that renders `RulingRoom`. `RulingRoom` is the main client boundary and owns a reducer containing:

```ts
type BoardState = {
  premise: {
    status: 'empty' | 'proposed' | 'confirmed'
    draft: Premise | null
    confirmed: Premise | null
  }
  entries: BoardEntry[]
  activity: ActivityEvent[]
  view: 'human' | 'agent'
  interaction: HumanInteraction | null
  freeze: { status: 'idle' | 'awaiting_human' | 'pending' | 'complete' | 'error'; url?: string }
}
```

The reducer enforces state transitions, while async command functions call the API and dispatch actions. Manual forms and WebMCP tools invoke those same commands. A `stateRef` updated after render gives WebMCP callbacks current state.

Changing a confirmed premise is a human-only command. It resets entries and activity related to prior checks before committing the new premise, preventing stale rulings from appearing attached to a new premise.

### 3. Human-interaction gate

Implements: `prd.md > Stories 1.2, 1.3, 4.3, 7.2`.

`HumanGate` renders an accessible modal/sheet with focus management, explicit confirm/cancel actions, and a summary of what will happen. The WebMCP callback first dispatches the proposal/freeze request so it is visible, then calls `client.requestUserInteraction` with an interaction callback where supported.

Because runtime callback semantics may differ, the command exposes a promise resolver stored outside serializable UI state. The in-page confirm button resolves that promise. If `requestUserInteraction` is absent or rejects as unsupported, the executor returns `awaiting_human_confirmation`; the visible proposal remains and checks remain blocked.

### 4. Ledger and shared Agent view

Implements: `prd.md > Epic 4`.

`Ledger` renders stable ordered entries. `VerdictCard` handles the four item verdicts, evidence, links, questions, and caveats. `PlaceLedger` handles place counts, chart state, and notable items. `AgentView` serializes `toCompactBoard(state)` using a stable JSON representation.

Both views receive the same reducer state. The toggle changes only `state.view`; it does not transform or refetch data. All verdict presentation includes text labels and evidence structure; color is supplementary.

### 5. WebMCP registration layer

Implements: `prd.md > Epic 7`.

`useWebMcpTools` accepts immutable tool definitions plus executor refs. It registers sequentially inside an effect, tracks failure as non-blocking local status, and aborts registration on cleanup.

Page-specific registrars:

- `RulingRoomTools`: exactly five tools.
- `EvidencePageTools`: exactly `get_label_facts` and `check_here`.
- No registrar for frozen pages.

Tool schemas are plain JSON Schema objects exported from `src/lib/webmcp/schemas.ts`. Descriptions and parameter descriptions are constants so budget tests can measure them. `src/types/webmcp.d.ts` augments `Document` with the minimum native API used by the app without weakening types globally.

### 6. API adapter and Route Handlers

Implements: `prd.md > Epics 2, 3, 4.3, 5.2, 6`.

The browser always calls same-origin routes:

- `POST /api/knowngate/v0/check/item`
- `POST /api/knowngate/v0/check/place`
- `POST /api/knowngate/v0/freeze`
- `GET /api/knowngate/v0/freeze/[id]`
- `GET /api/knowngate/v0/label/[gtin]`
- `GET /api/knowngate/v0/venue/[slug]` if venue-detail data is available through the backend contract

The server adapter reads:

- `KNOWNGATE_API_BASE`: live API origin/base path.
- `KNOWNGATE_MOCK`: `1` uses fixture mode; defaults to `1` in development when no live base is configured.

`src/lib/knowngate/api.ts` exports typed functions rather than a generic fetch wrapper. It normalizes non-2xx responses into `KnownGateError`, validates essential response discriminants, sets timeouts, and never converts operational failures into verdicts.

Route Handlers preserve backend status codes and documented error shapes. They do not log request bodies. Client code can therefore use one stable `requestKnownGate` helper for manual and tool flows.

### 7. Fixture/mock implementation

Implements: `prd.md > Stories 2.1–2.4, 3.1–3.3, 4.3, 8.1`.

Fixtures are real captured shapes with synthetic or authorized content where necessary:

- conflict packaged product
- no-conflict product with both coverage fields
- amber menu item with written question
- cannot-verify product/venue
- ruled Panda Express place response
- published-but-not-machine-readable place response
- no-chart place response
- product label
- frozen record
- correctable error examples

Fixture selection is deterministic from request subject/value. Mock freeze uses an in-process store during local development and tests, plus a checked-in canonical frozen fixture for static/demo access. The README clearly states that durable freeze persistence requires the live API; all other core behavior remains reproducible without secrets.

### 8. Label and venue evidence pages

Implements: `prd.md > Direct label or venue visit`, `Epic 2`, `Epic 3`, `Epic 7`.

Server pages await route params and fetch through the server adapter. Fixture IDs/slugs are returned by `generateStaticParams`. Each page renders source/date/evidence as server HTML, then mounts a small `EvidenceCheckIsland` with serialized facts. The island owns only per-call restrictions, current verdict, and the two WebMCP tools.

The evidence page does not create or retain a household premise. `check_here` requires restrictions in each call.

### 9. Frozen record page

Implements: `prd.md > Story 4.3`.

The server page validates IDs against `^ck_[a-z0-9]{16,32}$`, fetches the payload, and returns `notFound()` for invalid/missing records. It displays the freeze timestamp, immutable banner, household-origin premise statement, and the shared read-only verdict renderers. It has no client registration import and no mutation controls.

### 10. Evaluations and AX surface

Implements: `prd.md > Epic 8`.

Pure tool-command logic is separated from browser registration enough to run in a deterministic harness. `evals/scenarios.ts` defines valid, invalid, and out-of-order cases. The runner records:

- expected tool choice
- tool completion
- correctable error produced
- recovery on the next attempt
- calls per task

The checked-in results artifact contains only real run output. `/ax` renders that artifact; absent fields display “not yet measured.” Tool string/output budget checks run independently of browser-agent evaluation.

## File Structure

```text
src/
  app/
    layout.tsx                         # Fonts, metadata, global shell, disclaimer
    globals.css                        # Design tokens, themes, hatch, layout, components
    page.tsx                           # Server shell for the ruling room
    ax/page.tsx                        # Measured AX/evaluation results
    label/[gtin]/page.tsx              # Server-rendered product evidence page
    venue/[slug]/page.tsx              # Server-rendered venue evidence page
    ck/[id]/page.tsx                   # Immutable frozen record, no tools
    api/knowngate/v0/
      check/item/route.ts              # Item-check proxy/mock handler
      check/place/route.ts             # Place-check proxy/mock handler
      freeze/route.ts                  # Create-freeze proxy/mock handler
      freeze/[id]/route.ts             # Read-freeze proxy/mock handler
      label/[gtin]/route.ts            # Label proxy/mock handler
      venue/[slug]/route.ts            # Venue proxy/mock handler if contract supports it
  components/
    shell/
      site-header.tsx                  # Masthead and pattern/status framing
      site-footer.tsx                  # Universal disclaimer
      view-toggle.tsx                  # Human/Agent toggle client control
    premise/
      premise-editor.tsx               # Manual FDA-9/free-text premise form
      premise-line.tsx                 # Confirmed premise display
      human-gate.tsx                   # Accessible human-only confirmation surface
    ruling-room/
      ruling-room.tsx                  # Client state boundary and composition
      manual-check-form.tsx            # Plain-web item/place inputs
      activity-ledger.tsx              # Visible agent/human operation history
      agent-view.tsx                   # Compact board JSON
    verdict/
      verdict-card.tsx                 # Shared item verdict renderer
      place-ledger.tsx                 # Place counts/chart/notable renderer
      source-line.tsx                  # Source, link, read/capture dates
      coverage.tsx                     # Composition/preparation evidence display
    evidence/
      evidence-page.tsx                # Shared server-rendered label/venue layout
      evidence-check-island.tsx        # Per-call restrictions + two WebMCP tools
    frozen/
      frozen-banner.tsx                # Immutable status and date
  lib/
    knowngate/
      contracts.ts                     # API/request/result TypeScript types
      validation.ts                    # Runtime guards and correctable errors
      api.ts                            # Server-only live/mock adapter
      client.ts                         # Same-origin client requests
      fixtures.ts                       # Deterministic fixture selection
      compact.ts                        # Tool-safe compact payloads
    board/
      reducer.ts                        # Board state machine and invariants
      commands.ts                       # Shared manual/WebMCP operations
      selectors.ts                      # Compact board and render selectors
    webmcp/
      use-webmcp-tools.ts               # Feature detect/register/abort hook
      ruling-room-tools.ts              # Exactly five definitions/executors
      evidence-tools.ts                 # Exactly two definitions/executors
      schemas.ts                        # JSON Schemas and description constants
      budgets.ts                        # Name/description/output byte checks
  types/
    webmcp.d.ts                         # Native document.modelContext declarations
fixtures/
  item-conflict.json
  item-clear.json
  item-amber.json
  item-cannot-verify.json
  place-ruled.json
  place-unreadable.json
  place-none.json
  label-product.json
  frozen-check.json
evals/
  scenarios.ts                          # Task cases and expected outcomes
  runner.ts                             # Executes and records scenarios
  results.json                          # Real generated results or empty status
tests/
  board-reducer.test.ts                 # Premise/ledger state invariants
  contract-validation.test.ts           # Captured response shapes
  tool-budgets.test.ts                  # WebMCP hard limits
  tool-recovery.test.ts                 # Out-of-order and corrected calls
docs/hackathon-build/
  scope.md
  prd.md
  spec.md
  checklist.md
  build-notes.md
```

## Data Flow

### Premise proposal and confirmation

1. Manual form or `propose_premise` validates `PremiseInput` locally.
2. `PROPOSE_PREMISE` stores the proposal and displays `HumanGate`.
3. The agent executor requests user interaction when available; the manual path simply waits on the same gate.
4. Human confirm dispatches `CONFIRM_PREMISE`; human edit updates the proposal before confirmation.
5. `confirmed` remains only in reducer memory and `stateRef`.
6. Cancel returns the state to empty/unconfirmed and tool output reports that confirmation did not occur.

### Item check

1. Manual form or `check_item` calls `runItemCheck(subject)`.
2. Command reads the current confirmed premise from `stateRef`; absent premise returns a correctable error before network work.
3. `CHECK_STARTED` visibly adds a pending entry/activity event.
4. Client posts `{ restrictions, subject }` to the same-origin Route Handler.
5. Route Handler validates basic input, delegates to live API or fixture selector, and returns the documented shape/status.
6. Client validates the verdict discriminant and dispatches `CHECK_SUCCEEDED` or `CHECK_FAILED`.
7. Ledger and Agent view rerender from the same state.
8. WebMCP tool returns `compactVerdict(result)` after the visible success mutation.

### Place check

The place path follows the same sequence but stores one place entry with counts and up to five notable item verdicts. Tool output is compacted to prevent a full 179-item chart from exceeding the budget; the page remains the detailed authority.

### Freeze

1. Command verifies confirmed premise plus at least one successful result.
2. `FREEZE_REQUESTED` opens the human gate.
3. Human confirmation dispatches `FREEZE_STARTED` and posts `{ premise, results }`.
4. Live mode persists through `fuda`; mock mode writes the local in-process store.
5. Success stores the returned URL visibly and returns compact `{ url }` to the agent.
6. `/ck/[id]` separately fetches the frozen payload and renders it read-only.

### Evidence page check

1. Server fetch renders canonical facts.
2. Human or `check_here` supplies restrictions per call.
3. Island visibly enters pending state and invokes the item/place endpoint for the current subject.
4. Result renders in-page and returns compactly; restrictions disappear on navigation/reload.

## API Contracts

Canonical types reproduce the frozen shapes in `docs/build-brief.md`. Important discriminants:

- `Verdict = 'no_conflict' | 'conflict' | 'ask_one_question' | 'cannot_verify'`
- `CoverageState = 'covered' | 'silent' | 'unknown'`
- `PlaceChartState = 'ruled' | 'published_not_machine_readable' | 'none_found'`
- `KnownGateError = { error: { code: string; message: string; missing?: string } }`

No UI component consumes unchecked `unknown` JSON. Route clients parse essential discriminants and arrays before dispatching success.

## Components And Responsibilities

### RulingRoom

Implements: `prd.md > Epics 1–7`.

Owns reducer/state refs, assembles manual and agent commands, renders premise/ledger/views, and mounts `RulingRoomTools`.

### HumanGate

Implements: `prd.md > Stories 1.2, 1.3, 4.3`.

Owns visible human consent, focus, confirmation/cancellation, and promise resolution. Never callable as an agent tool.

### VerdictCard and PlaceLedger

Implements: `prd.md > Epics 2–4`.

Render every evidence and accessibility invariant. Reused by live, label, Agent-adjacent, and frozen surfaces to prevent semantic drift.

### API adapter

Implements: `prd.md > Epics 2, 3, 5, 6`.

Chooses live or fixtures, preserves statuses, guards response shapes, times out, and avoids premise logging.

### WebMCP registrars

Implements: `prd.md > Epic 7`.

Own exact tool sets, schemas, annotations, lifecycle, visible execution ordering, and compact returns.

### Evaluation runner

Implements: `prd.md > Epic 8`.

Exercises command behavior and reports only measured outcomes. It does not fabricate browser-agent success.

## Environment Configuration

```dotenv
# Development defaults to mock mode when no API base exists.
KNOWNGATE_MOCK=1

# Live server-side base, for example https://example/api/knowngate/v0
KNOWNGATE_API_BASE=
```

No variable is prefixed `NEXT_PUBLIC_`; browser code calls the same-origin API boundary.

## AI Usage

Codex is used to convert the supplied brief into build artifacts, implement the Next.js/WebMCP product, generate fixtures from authorized contract examples, write tests/evaluations, and tighten documentation. All product claims, API behavior, and evaluation numbers must be verified against the running project or live API before publication.

The KnownGate application itself does not call a generative model. Agent intelligence remains in the browser client; KnownGate provides deterministic tools and evidence-backed rulings.

## Error Strategy

### Correctable domain/tool errors

Return documented `{ error: { code, message, missing? } }` objects. Messages state the next valid action. These errors also enter the visible activity ledger.

### Evidence outcomes

`cannot_verify`, `published_not_machine_readable`, and `none_found` are rendered product outcomes. They are never thrown as transport errors.

### Operational errors

Timeouts, unreachable API, invalid JSON, and unexpected response shapes render retryable operational messages. Existing successful entries remain unchanged.

### Route errors

Invalid dynamic IDs yield `notFound()` or a clear route-level not-found screen. They do not mount WebMCP tools.

## Security And Trust Boundaries

- Treat operator caveats and external evidence text as untrusted display/tool content.
- Render text through React, never raw HTML.
- Never place restrictions in URLs.
- Validate freeze IDs and all route params.
- Limit ingredient input and freeze payload size before proxying.
- Do not add `Origin-Agent-Cluster: ?0`; preserve top-level origin isolation.
- No iframe contains judged WebMCP code.
- Same-origin handlers restrict methods and content types and forward only known payload fields.

## Risks And Verification

### Risk 1: `requestUserInteraction` behavior differs across runtimes

Verification:

- Isolate the integration behind `HumanGate`.
- Test native interaction in ChatGPT desktop early.
- Verify unsupported fallback returns `awaiting_human_confirmation` and blocks checks.

### Risk 2: WebMCP API/types change or registration fails

Verification:

- Keep minimal local type declarations aligned to the actual methods used.
- Feature-detect and fail silently for ordinary website use.
- Inspect exact tool sets in Chrome DevTools and ChatGPT Site tools.
- Abort and navigate between pages, confirming old tools disappear.

### Risk 3: tool output exceeds hard budget

Verification:

- Unit-test every fixture through compact serializers.
- Measure UTF-8 byte length, not only character count.
- Keep detailed evidence visible in-page and return links in compact payloads.

### Risk 4: live API divergence from captured contract

Verification:

- Run contract guards against representative live responses before UI integration.
- Preserve unknown optional fields while rejecting missing discriminants.
- Capture only authorized fixtures and document their dates.

### Risk 5: freeze persistence differs locally and on Vercel

Verification:

- Treat durable freeze as a live-API capability.
- Test live create/read roundtrip on the deployed URL.
- Keep local mock scope explicit and include a canonical frozen fixture.

### Risk 6: restrictions leak into persistence or telemetry

Verification:

- Search source for storage APIs and logging around premise payloads.
- Reload and confirm the premise disappears.
- Inspect network and deployed logs for request-body logging.

### Risk 7: Next.js client/server boundary mistakes

Verification:

- Keep API/env modules server-only.
- Run production builds frequently.
- Confirm dynamic route params are awaited and client props are serializable.

## Verification Matrix

### Automated

- TypeScript/Next production build.
- ESLint.
- Reducer invariant tests.
- Fixture and live-contract guard tests.
- Tool schema/name/description/output budget tests.
- Correctable error and recovery tests.
- Accessibility smoke tests where browser tooling is available.

### Manual browser

- Plain unsupported browser: complete premise, item/place, toggle, and freeze flow.
- Chrome WebMCP panel: inspect and invoke all page-specific tools.
- Route transition: confirm `toolchange`/tool list updates and old registrations disappear.
- Dark/light themes and hatch contrast.
- Keyboard-only premise and freeze confirmation.
- Responsive checks at narrow, medium, and wide widths.

### Judging surface

- ChatGPT desktop in-app browser: complete definition-of-done path.
- Verify Site tools contains five, then two, then zero tools on the appropriate pages.
- Confirm every invocation visibly mutates the interface.
- Record real evaluation numbers only after these runs.

## Demo And Submission Flow

The implementation order keeps the demo path continuously viable:

1. Load the ruling room and show Page as Authority framing.
2. Discover five tools.
3. Propose and visibly confirm peanut/sesame premise.
4. Check conflict product.
5. Check ruled venue and surface amber question.
6. Demonstrate honest failure/recovery.
7. Toggle the same state to Agent JSON.
8. Human-confirm and open frozen record.
9. Briefly show label-page tools and evaluation proof.

README and video use the same sequence so product, code, and submission tell one coherent story.

## Implementation Milestones

This heading is the anchor for `checklist.md`.

1. **Contracts and fixtures:** types, guards, live/mock adapter, deterministic fixture corpus.
2. **Ruling-room state:** reducer, commands, premise gate, manual plain-web workflow.
3. **Evidence UI:** terminal-ledger design system and four verdict renderers.
4. **Ruling-room WebMCP:** exact five tools, visible mutation, compact outputs, lifecycle.
5. **Evidence routes:** label and venue pages plus exact two-tool registrar.
6. **Frozen records:** live/mock create/read and tool-free immutable page.
7. **Evaluations and hardening:** scenarios, AX output, budgets, errors, accessibility, browser testing.
8. **Submission surface:** README judged sections, metadata, production verification, Vercel and ChatGPT tests.
