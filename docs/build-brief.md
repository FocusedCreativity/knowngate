# KnownGate — Build Brief

You are building **KnownGate**, a web app entered in the OpenAI WebMCP Challenge
(deadline: 3 Sep 2026, 22:00 CEST). This brief is self-contained: everything you
need is in here. Where it says FROZEN, do not redesign — build exactly as
specified. Where it says YOUR CALL, use your judgment.

## 1. What KnownGate is

**A verification layer for agents.** Tagline: *every answer, with its source.*

A household states its food restrictions (allergies). An AI agent — running in
the user's browser via WebMCP — brings food subjects to the page: a packaged
product, a restaurant, a menu item, a list of ingredients. The page **rules** on
each subject against the restrictions and returns one of exactly four verdicts,
each carrying the evidence it rests on and the date that evidence was read:

| Verdict | Meaning |
|---|---|
| `no_conflict` | Composition AND preparation are both covered by evidence. Green. |
| `conflict` | The evidence names the restriction. Red. |
| `ask_one_question` | Ingredients are clear but preparation is silent. Amber. The API returns the literal question to ask at the counter, written out. |
| `cannot_verify` | Nothing published, nobody to ask. Rendered as a **hatch pattern, never a color alone**. |

### Doctrine (FROZEN — these are product law, render them and never violate them)
- **Unknown counts as no.** Absence of evidence is never a yes.
- **A clear needs two things covered: what's in it, and how it's prepared.**
  One without the other is a question, not a yes.
- **Restrictions are never stored.** They arrive with the question and leave
  with the answer. No accounts, no profiles, no server-side premise.
- **KnownGate never searches, recommends, or ranks.** The agent brings
  candidates; the gate rules on them. Eligibility, not ranking.
- **Every verdict shows its source and read date.** Operator caveats (e.g.
  "we cannot guarantee absence…") are quoted verbatim with capture date and
  are *why* items are amber — reported, never resolved.
- The human — never the agent — confirms or changes the restrictions, decides
  ambers, and sends frozen records.
- Footer on every page: "A finding, not a promise. Not allergen advice."

### The reusable pattern (name it in the README exactly like this)
**Page as Authority**: *agent proposes → page rules → human owns the premise.*
The agent has no tool that can alter a confirmed premise, override a verdict,
or send a record. Document this in the README as a reusable WebMCP design
pattern with a diagram. This README section is a judged deliverable.

## 2. The screens

1. **The ruling room** (`/`) — the main surface. A ledger:
   - The **premise line** at top: who's eating, what they avoid. An agent can
     propose it; a human must confirm it in-page (see `propose_premise`).
     Until confirmed, no checks run.
   - Below: verdicts land live as the agent calls tools — row per subject,
     verdict chip, source + read date, the written question on ambers.
   - A **Human / Agent toggle** that flips the whole page between the rendered
     ledger and the raw structured JSON the agent sees. Same state, two
     readings. This is a judged feature.
2. **Label pages** (`/label/[gtin]`, `/venue/[slug]`) — one page per packaged
   product / venue. Human-readable label (composition, preparation statement,
   source, dates) + this page registers its own two tools (§4). Statically
   generated from the API/fixtures. Every verdict in the ruling room links to
   its label page.
3. **Frozen check** (`/ck/[id]`) — a dated, read-only snapshot. The premise is
   printed ABOVE the verdicts ("checked against: peanut · sesame — these came
   from the household, not from us"). Banner: "Frozen <date> — this page does
   not update." No tools registered on this page.

## 3. Design (FROZEN register, YOUR CALL on details)

Terminal-ledger register, light-first, both themes:
- Fonts (Google Fonts): **Anybody** (condensed, heavy — masthead/verdicts at
  scale), **Familjen Grotesk** (body), **Azeret Mono** (every piece of
  evidence: sources, dates, tool names, IDs).
- Light ground `#F4F5F4`, ink `#15181A`, petrol accent `#1F4A57` for chrome.
  The ONLY other saturated colors are the three verdicts: green `#20714A`,
  amber `#9A6A0B`, red `#A43B2F`. `cannot_verify` = diagonal hatch, no fill
  color. Dark theme: same system on `#0B0D0D`.
- Fluid full-width, one layout at every width. No fixed mobile canvas.
- Reference sites for feel: vercel.com, val.town, linear.app. Mono carries the
  proof; the verdict itself is set large and still before the evidence rows.

## 4. WebMCP implementation (FROZEN — this is the judged core)

Use the native API. No polyfill needed for the judged surfaces.

```js
await document.modelContext.registerTool({ name, description, inputSchema,
  annotations, async execute(input, client) {...} }, { signal });
```

Rules:
- Feature-detect: `typeof document.modelContext?.registerTool === "function"`.
  Silent no-op when absent — the site must work as a plain website.
- Register with an `AbortController`; abort on route change/unmount.
- ChatGPT's in-app browser (the judging surface) supports tools ONLY from
  top-level page JS — no iframes, no declarative forms. Return plain
  JSON-serializable objects.
- Budgets (hard limits): tool name ≤30 chars, tool description ≤500, param
  descriptions ≤150, tool output ≤1.5KB. Compact verdict payloads; link to the
  label page for full evidence.
- Descriptions: verb-led, positive framing, never "don't use this for…".
- **Every tool's execute must visibly mutate page state** — the verdict row
  must appear/update on screen as part of execution, because agents plan from
  the interface and the human must see what the agent did.

### Tools on the ruling room (exactly these five)

1. `propose_premise` — write, human-gated.
   Input: `{ restrictions: [{ key, note? }], diners?: string, location?: string }`
   where `key` ∈ `milk|egg|fish|shellfish|tree_nut|peanut|wheat|soy|sesame`
   (FDA-9) or `{ key: "other", note }`.
   Execute: render the proposed premise in the page, then
   `await client.requestUserInteraction(...)` to have the HUMAN confirm or edit
   it in-page. Return the confirmed premise. If the runtime doesn't support
   requestUserInteraction, fall back to an in-page confirm that blocks checks
   until tapped, and return `{ status: "awaiting_human_confirmation" }`.
2. `check_item` — core verb. Input: `{ subject: { kind: "upc"|"product_query"|
   "menu_item"|"ingredients", value: string, venue?: string } }`. Calls
   API `/check/item` with the *confirmed* premise + subject; renders the verdict
   row; returns the compact verdict (§5 shape).
3. `check_place` — core verb. Input: `{ venue: string, location?: string }`.
   Calls `/check/place`; renders the full menu ledger; returns counts per
   verdict + up to 5 notable items + the operator caveat.
4. `get_board` — `annotations: { readOnlyHint: true }`. No input. Returns the
   confirmed premise + all verdicts currently on the board, compact.
5. `freeze_check` — write, human-gated (same confirmation mechanism). No input.
   Calls `/freeze`; returns `{ url }` of the frozen page.

Errors from all tools: `{ error: { code, message, missing?: string } }` with
messages that tell the agent exactly what to fix (e.g. "premise not confirmed —
call propose_premise first").

### Tools on every label/venue page (exactly these two)
- `get_label_facts` — readOnly. Returns this page's composition, preparation
  statement, source, read date.
- `check_here` — input `{ restrictions: [...] }` (same shape as above; label
  pages take restrictions per-call, no premise flow). Rules THIS page's subject;
  renders the verdict on the page; returns it.

### Deliberately NOT tools (enforce by omission)
Changing a confirmed premise · overriding a verdict · deciding an amber ·
sending a frozen record. The README's pattern section explains why.

## 5. API contract (FROZEN — the API is BUILT and these shapes are its real,
## tested responses. Build fixtures to exactly these shapes.)

The API is live in the private fuda backend at
`{KNOWNGATE_API_BASE}/api/knowngate/v0` (base URL supplied later via env; it
is public, CORS-open `*`, no auth). Ship a mock layer: `lib/api.ts` reads
`KNOWNGATE_API_BASE`; when `KNOWNGATE_MOCK=1` (default in dev) serve
`fixtures/*.json` in these exact shapes.

Errors from every endpoint: `{ "error": { "code", "message", "missing"? } }`
with 4xx/5xx status. Messages are agent-correctable, e.g.
`restrictions must be a non-empty array of { key } objects (FDA-9 keys)`.

`POST /check/item` — real captured response:
```jsonc
// request: kind ∈ upc | product_query | menu_item | ingredients
// menu_item additionally needs subject.venue (chain or venue name).
// ingredients: value is the free-text ingredient list itself.
{ "restrictions": [{ "key": "peanut" }, { "key": "sesame" }],
  "subject": { "kind": "upc", "value": "0000822910553" } }
// response (real):
{ "verdict": "conflict",   // no_conflict | conflict | ask_one_question | cannot_verify
  "subject": { "kind": "upc", "value": "0000822910553",
               "name": "Bill Knapp's® Blueberry Toaster Tops" },
  "coverage": { "composition": "covered", "preparation": "covered" },
  "conflicts": [ { "restriction": "peanut",
                   "evidence": "Contains: Peanuts and their derivates" } ],
  "unverified": [],        // [{ restriction, reason }] when cannot_verify
  "question": null,        // string when ask_one_question — pre-written for the counter
  "source": { "name": "retailer product data (Kroger API)",
              "url": null, "read_date": "2026-08-29" },
  "caveat": null,          // { text, captured } — operator sentence, verbatim
  "label_url": "/label/0000822910553" }
```
An amber (chart-ruled) item really returns:
`"question": "Is the chow fun prepared with, or on shared equipment with, anything containing peanut or sesame?"`
with `coverage.preparation: "silent"`.

`POST /check/place` — real captured response:
```jsonc
// request
{ "restrictions": [ { "key": "peanut" }, { "key": "sesame" } ],
  "venue": { "name": "Panda Express", "location": "Denver" } }  // location optional
// response (real):
{ "venue": { "name": "Panda Express", "chain": "Panda Express", "city": "los_angeles" },
  "chart": "ruled",  // ruled | published_not_machine_readable | none_found
  "verdict_counts": { "no_conflict": 0, "conflict": 36,
                      "ask_one_question": 143, "cannot_verify": 0 },
  "notable": [ /* up to 5 full /check/item shapes, best verdicts first */ ],
  "caveat": null,
  "source": { "name": "Panda Express published allergen chart",
              "url": "https://www.pandaexpress.com/nutritioninformation",
              "read_date": "2026-08-26" } }
```
`chart: "published_not_machine_readable"` is a REAL state (e.g. Chipotle): the
operator publishes an allergen page, we hold the verbatim caveat + source +
date, but no per-dish table can be ruled — render it honestly, with the caveat
(Chipotle's actual sentence comes back in `caveat.text`). `none_found` = no
published chart at all.

`POST /freeze` — request `{ "premise": {...}, "results": [...] }` (≤200KB) →
`201 { "ck_id": "ck_29b6e359cae50ab40d24", "url": "/ck/ck_…", "frozen_at": "…Z" }`
`GET /freeze/{ck_id}` → `{ "ck_id", "payload": { premise, results }, "frozen_at" }`
(ck ids match `^ck_[a-z0-9]{16,32}$`).

`GET /label/{gtin}` →
```jsonc
{ "gtin": "0000822910553", "name": "…", "brand": "…", "statement_read": true,
  "findings": [ { "allergen_token": "peanuts", "status": "present",
                  "evidence_kind": "retailer_declaration",
                  "matched_text": "Contains: Peanuts and their derivates" } ],
  "source": { "name": "…", "url": null, "read_date": "…" } }
```
`allergen_token` ∈ milk, egg, fish, crustacean_shellfish, tree_nuts, peanuts,
wheat, soy, sesame. `status` ∈ present | absent_declared | indeterminate
(indeterminate = may-contain / shared-facility text — blocks a clear, never a
contains).

### What the live build established (bake these into the UI)

- **Restriction keys**: FDA-9 tokens plus aliases (`peanut|peanuts`,
  `tree_nut|tree_nuts`, `shellfish`, `dairy|milk`, `egg|eggs`, `soy|soya`…).
  Any other key is accepted but comes back honestly unruleable
  (`cannot_verify`, reason "outside the FDA-9 vocabulary…"). So the premise
  UI offers the nine FDA-9 chips + free-text marked "cannot be ruled yet".
- **Packaged goods are the deep end**: ~240K products carry per-allergen
  retailer declarations; ~2M more resolve by UPC with brand-level evidence.
  UPC checks are the reliable path; `product_query` is a convenience match —
  when it misses, the API says "try the UPC from the package".
- **Venue truth today**: one national chain (Panda Express, 179 dishes) rules
  end-to-end; several chains return `published_not_machine_readable` with
  verbatim caveats (Chipotle, Starbucks); everything else is `none_found`.
  126K venues across 49 US metros resolve by name (prefix match; city keys
  look like `denver`, `los_angeles`). The UI must present this gradient as
  the product's honesty, not hide it — hatch is a first-class verdict.
- `ingredients` checks are fully client-shaped: paste any ingredient list,
  ruled on the spot, source = "the ingredient list you provided".

## 6. Evals + AX (judged deliverable)

- `evals/` in the repo: a scenario runner that exercises each tool with valid,
  invalid, and out-of-order inputs (e.g. check before premise confirmed) and
  records pass/fail + recovery. Output a small table the README embeds.
- An `/ax` page (or README section) showing real measured numbers only:
  tool-choice accuracy, completion rate, recovery rate, median calls/task.
  NEVER invent numbers; if unmeasured, show "not yet measured".

## 7. Testing

- Chrome 149+: enable `chrome://flags/#enable-webmcp-testing` (+
  `#devtools-webmcp-support`); DevTools → Application → WebMCP panel lists and
  invokes registered tools. Develop against this.
- ChatGPT desktop app in-app browser: the judging surface. Verify every tool
  there; a "Site tools" button in the address bar shows what the page exposes.
- WebMCP requires HTTPS + top-level, origin-isolated documents. Do not set
  `Origin-Agent-Cluster: ?0`.

## 8. Stack, repo, deploy

- Next.js (App Router, TypeScript) on Vercel. Label/venue/frozen pages static
  or ISR; the ruling room is a client page.
- Keep the MIT LICENSE visible in About. Commit in small, descriptive steps —
  the commit history is judged evidence that this was built during the
  submission window.
- README must contain: what KnownGate is (use §1), the Page-as-Authority
  pattern with diagram, tool reference, API contract summary, how to run
  (mock mode works with zero secrets), how to test WebMCP in both browsers,
  eval results, and the four-point challenge description (why WebMCP fits /
  better UX / what humans+agents do together that was impossible / how
  implemented).

## 9. Non-goals (do not build)
No meal planning, no restaurant search/discovery, no accounts/auth, no stored
household profiles, no recommendations, no nutrition scoring, no chat UI on the
page. KnownGate rules; it does not choose.

## 10. Definition of done
A judge opens the live URL in the ChatGPT desktop browser, their agent proposes
a premise, the human confirms it in-page, the agent checks a product and a
restaurant, verdicts land visibly with sources and dates, one amber shows a
written counter-question, freeze produces a working `ck_` URL, the Human/Agent
toggle flips the ledger to raw payloads — and the whole thing also works as a
plain readable website with no agent at all.
