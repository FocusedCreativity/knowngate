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
