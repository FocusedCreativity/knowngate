# KnownGate Guided Build Notes

## 2026-08-30 — Onboarding

- Confirmed the project framing: **Page as Authority** — agent proposes, page rules, human owns the premise.
- Participant is an experienced solo builder and can commit the time needed through the deadline.
- The live `fuda` API is ready; the public app must also ship fixtures and a mock mode.
- Vercel is already connected to the repository.
- Scope posture is to deliver the complete brief without planned cuts.
- Active shaping: participant pushed back on redundant interview questions — “why all these questions, I gave you the brief already.” Downstream guided steps must treat `docs/build-brief.md` as comprehensive context, avoid reopening frozen decisions, and ask only about material gaps.
- Onboarding interview depth: essentials completed; redundant sharpening and optional inspiration questions ended by participant direction.

## 2026-08-30 — Scope

- Derived scope directly from `docs/build-brief.md`; no product doctrine was reopened.
- Confirmed project name and tagline: KnownGate — “every answer, with its source.”
- Time ruler: solo, full focused time through the submission deadline.
- Scope target: complete brief, sequenced around an early end-to-end ruling loop; no planned feature cuts.
- Explicit non-goals preserved: planning, discovery, profiles, recommendations, nutrition scoring, chat UI, and agent access to human decisions.
- Scope deepening rounds: 0 by participant direction; the supplied brief already covers the mandatory and deepening beats.

## 2026-08-30 — PRD

- Expanded the approved scope into user journeys, eight epics, user stories, testable acceptance criteria, experience requirements, and boundary cases.
- Preserved the human-owned premise, transient restrictions, four-verdict doctrine, visible WebMCP mutations, and deliberate non-tools as product requirements.
- Made plain-web fallback, evidence-gradient states, error recovery, tool lifecycle, and frozen-record immutability explicit acceptance surfaces.
- Kept roadmap opportunities separate without weakening the complete submission target.
- PRD deepening rounds: 0 by participant direction; the build brief and scope already resolved the required behavioral questions.

## 2026-08-30 — Technical Spec

- Grounded the architecture in the installed Next.js 16.3.3 documentation, including async dynamic params, Server Components by default, narrow client boundaries, `generateStaticParams`, and `next/font`.
- Selected a single ruling-room reducer shared by manual controls and WebMCP executors; no external state library.
- Selected same-origin Next.js Route Handlers over a server-only live/mock API adapter so browser code never receives the backend base URL.
- Defined page-specific WebMCP registrars with state refs, visible mutation ordering, AbortController cleanup, and compact output budget tests.
- Defined fixture, freeze, evaluation, privacy, error, and deployment boundaries with explicit file structure and data flows.
- Spec deepening rounds: 0 by participant direction; the brief and PRD already answer the material architecture inputs, with only implementation-level verification risks left.

## 2026-08-30 — Build Checklist

- Participant accepted Codex-owned sequencing, autonomous mode, coherent-item commits, continuous automated verification, and three participant checkpoints.
- Wow moment locked: the same agent moves from a plausible unsourced guess to a visible sourced ruling after human premise confirmation.
- Ten atomic milestones sequence risk early: contracts/API, plain-web vertical slice, design, ruling-room WebMCP, evidence tools, freeze, evals, deployed runtime hardening, and judged handoff.
- Checkpoints occur after the manual ruling loop (item 3), designed page-specific WebMCP surfaces (item 6), and live judging flow (item 9).
- Checklist deepening rounds: skipped on the handoff path; participant review is the final gut-check.

## 2026-08-30 — Build Item 1: Contracts And Fixtures

- Added strict TypeScript and runtime contracts for item, place, label, freeze, premise, and stable error payloads.
- Added deterministic fixtures covering all four item verdicts and all three place-chart states, each with sourced and dated evidence.
- Added compact serializers with UTF-8 payload measurement and Node contract tests.
- Verified 9 contract tests, ESLint, `git diff --check`, and a Next.js 16 production build using webpack because the managed environment blocks Turbopack's local helper port.

## 2026-08-30 — Build Item 2: API Boundary

- Added a server-only live/mock adapter, deterministic fixture selection, stable transport failures, timeouts, and no request-body logging.
- Added same-origin handlers for item/place checks, label lookup, and freeze create/read with runtime validation and a 16KB request limit.
- Added a browser client that knows only same-origin routes; `KNOWNGATE_API_BASE` remains server-only and is documented in `.env.example`.
- Exercised every handler over local HTTP with valid and invalid requests, including canonical freeze read and mock freeze creation; verified ESLint, production build, and whitespace checks.

## 2026-08-30 — Build Item 3: Plain-Web Ruling Room

- Replaced the starter screen with a functional ruling room backed by one reducer shared by Human and Agent views.
- Added FDA-9 and free-text premise editing, an explicit human confirmation gate, item/place controls, pending/error activity, sourced ledger cards, and compact Agent JSON.
- Added reducer recovery tests for out-of-order checks, premise-change invalidation, and preserving earlier successes after later operational errors.
- Browser-verified the complete mock path: human confirmation, conflict product, ruled Panda Express place, amber menu question, identical Agent state, and reload returning to an empty premise.
- Verified 12 automated tests, ESLint, Next.js production build, and whitespace checks.

## 2026-08-30 — Build Items 4–8: Judged Surfaces

- Applied the frozen terminal-ledger register: Anybody, Familjen Grotesk, Azeret Mono, approved light/dark tokens, source-first mono evidence, non-color verdict language, and hatched cannot-verify treatment.
- Added feature-detected, abortable native WebMCP registration for the exact five ruling-room tools and two page-evidence tools; manual and tool paths use the same same-origin client/reducer state.
- Added statically generated label and venue evidence routes, per-call evidence checks, a human-confirmed freeze flow, and read-only frozen record pages with no tool registration.
- Added a deterministic seven-tool evaluation runner, generated `evals/results.json`, `/ax`, tool manifest/budget test, and no-persistence architecture checks.
- Verified evaluation generation, 13 tests, ESLint, TypeScript, static-route generation, production build, and `git diff --check`.
