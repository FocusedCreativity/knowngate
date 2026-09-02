knowngate · challenge brief
One entry, five days,
ruled on the evidence.
Everything established on 30 August: the OpenAI WebMCP Challenge rules, what WebMCP actually is, how it is being used in the wild, and where KnownGate stands. Built for real — live for all of the USA, not a demo.

Deadline
Wed 3 Sep · 22:00 CEST
Time left
4 days
Prize pool
$35,000 · 10 winners
Field
4,087 entrants
Judging
4–21 Sep · out ~23 Sep
The challenge
webmcp.devpost.com
The brief, in the sponsor's own words: build a WebMCP-powered web app that "becomes meaningfully better when people and their agents can use it together." Registration and submission both close at the same moment — Wednesday 3 September, 22:00 our time (1:00 pm Pacific). Register on Devpost before building another line.

What a submission must contain
Working live URL
Testable in ChatGPT's desktop in-app browser (WebMCP on by default) or Chrome 149+ with chrome://flags/#enable-webmcp-testing. Any host — Vercel, Cloudflare, Netlify, Render, ChatGPT Sites. Auth is allowed if credentials go on the form.
Public open-source repository
All source needed for the project to function, plus a license visible in the repo's About section. GitHub, GitLab, or Bitbucket.
Demo video, under 3 minutes
Public on YouTube, with audio covering what was built and how WebMCP is used. No third-party trademarks or copyrighted music — mind how any chain's branding appears on screen.
Text description, four points
Why the use case fits WebMCP · how it improves the experience · what people and agents can do together that was difficult or impossible before · how WebMCP was implemented.
Pre-existing work, documented apart
Existing projects are judged only on what was added with WebMCP during the submission window — with timestamped commit history separating old from new. This suits us: the evidence layer existed; the WebMCP product is new this week.
Fine print that changes behavior
Judges may score from the video, text, and images alone — testing is optional for them. The 3-minute video must carry the whole argument by itself; the live URL is the proof, not the pitch. The project must function exactly as depicted in the video.

Fine print to comply with
All materials in English · one prize per project · submission must be solely our own work (IP warranty) · judges get free access until judging ends (21 Sep) · no changes to the submission after the deadline, though the live product may keep evolving · Netlify credit requests close 1 Sep if wanted.

Repo consequence
Settled: the check API lives in the private KnownGate backend — private, production, where the evidence and ruling logic already are. The public repo is the KnownGate app: the pages, the registered tools, the eval harness, the pattern write-up — consuming the KnownGate API the way any project consumes a data service. To satisfy "functional from the repo," it ships the documented API contract plus a fixture corpus so it runs standalone without backend credentials; judges use the live URL.
Judging — pass/fail on theme fit, then four equal criteria
WebMCP leverage
25%
"Thoroughly and skillfully… genuine effort and a working, non-trivial implementation." Read by the person who invented the pattern — see the judge list. Fluency signals: requestUserInteraction(), readOnlyHint, toolchange, tools that visibly mutate the page.

Execution
25%
"A complete, coherent product experience — not just a technical proof of concept." Our known weak flank: the idea is liked, the previous execution was not.

Potential impact
25%
"A credible, specific case for solving a real problem for a real audience." KnownGate's strongest card — allergy households, sourced verdicts, unknown counts as no.

Creativity & ambition
25%
"Does the project differ from existing concepts?" The gallery will be full of shopping carts and to-do lists — see the field survey below. A verification gate is not in it.

The judges — what each one needs to see
Seven architects of different layers of the same ecosystem, not seven customers. Each is judging to learn something their own layer needs. KnownGate's doctrine already answers most of them — the build only has to make each answer visible.

Judge	Their WIIFY	What KnownGate shows them
Alex Nahas
MCP-B / the protocol	Validate WebMCP; discover what the standard needs next.	A named, reusable pattern in the README: the page as authority — agent proposes, page rules, human owns the premise via requestUserInteraction(). A pattern he can carry into the spec.
Justin Rushing
OpenAI browser agents	Websites that make browser agents deterministic.	The guess-vs-gate demo: same agent, same question, WebMCP off vs on — an unsourced guess becomes a ruled, sourced verdict. With telemetry.
Sarah Drasner
Chrome, AI + web	Agentic web without damaging human UX.	One shared state, two readers: the ledger is human-legible and agent-callable, verdicts land visibly as tools execute. The Human/Agent toggle makes it explicit.
Ilya Grigorik
Shopify, agentic commerce	Agents that survive state, policy, and humans — requires_escalation as a first-class outcome.	Our amber verdict is his escalation state: the agent halts, the question is written out for a human to carry to the counter, context preserved, check resumable.
Jude Gao
Vercel / Next.js, evals	Evidence, not AI theatre — measured agent behavior.	An eval we can uniquely run: bare-agent answers vs gated answers scored against golden-set ground truth we already hold. Real hallucination numbers, not vibes.
Sean Roberts
Netlify, Agent Experience	Prove AX is a measurable discipline — including recovery.	Failure as a feature: couldn't-verify is a designed outcome, and the amber→question→human→re-check loop is recovery on camera. A small AX panel quantifies it.
Andrew Galloni
Cloudflare, agentic internet	Evidence for readable→discoverable→callable→payable as an infrastructure shift.	A new callable primitive: verification. The label corpus makes a slice of the physical world callable; the gate is a category, not an app.
The tie-breaker + the one-line answer
Ties resolve on WebMCP Leverage first. So the submission must make one answer instant: why could this not exist without WebMCP? Because a server API can't stop an agent from freestyling a safety answer — only a page the agent is standing on can define the sole way it may answer, while the human watches it happen. The constraint binds at the point of answering.
WebMCP, as it actually is
spec + implementations
A W3C Web Machine Learning Community Group draft, authored mainly by Microsoft and Google engineers. The page — not a server — registers tools; an in-browser agent discovers and calls them while the human watches the same screen. The current entry point is document.modelContext (navigator.modelContext was deprecated in Chrome 150).

// The whole API, in practice:
await document.modelContext.registerTool({
  name: "check_item_for_household",   // ≤30 chars, verb-led
  description: "…",                    // ≤500 chars, positive framing
  inputSchema: { /* JSON Schema, plain object */ },
  annotations: { readOnlyHint: true },  // read/write split is formalized
  async execute(input, client) {
    // mutate visible page state — agents plan from the interface
    await client.requestUserInteraction(() => confirmInPage());
    return { content: [{ type: "text", text: "…" }] };  // ≤1.5K output
  }
}, { signal: controller.signal });      // abort() unregisters
Also in the spec: a toolchange event when the tool set changes, untrustedContentHint for tools returning user-generated content, and a tools permissions-policy (HTTPS only, top-level, origin-isolated). provideContext() and unregisterTool() were removed — anything teaching them is stale.

Runtime	Status	What differs
ChatGPT desktop browser	default on	The judging surface. Subset: top-level page JS only — no iframes, no declarative form tools. Plain JSON returns. Every invocation gets a safety review; a "Site tools" button shows the page's tools. Needs GPT-5.6 Sol/Terra.
Chrome 149–156	origin trial	Both imperative and declarative (HTML-form) authoring. DevTools has a WebMCP panel (Application tab) to inspect and invoke tools — the development workbench. Requires origin isolation.
Edge	behind flag	Experimental since ~June; Microsoft co-authors the spec.
Firefox / Safari	none	In the CG discussions; no commitment.
Tooling worth using: use-webmcp-tool (GoogleChromeLabs) — a zero-dependency React hook with mount/unmount lifecycle and graceful no-op when unsupported; the closest thing to official. The @mcp-b/* packages (by judge Alex Nahas's WebMCP-org) polyfill document.modelContext and add extension-bridged extras. No documented cap on tool count or schema complexity in any implementation.

The field, surveyed
~115 repos + official demos
What everyone else builds, and the patterns the official guidance blesses. The norm is 3–6 tools per page, snake_case verb_noun names, a read/write split marked with readOnlyHint, registration tied to an AbortController, and feature-detection that degrades silently when the API is absent.

Pattern	Examples in the wild	Reading
Shopping cart / catalog	Chrome's pizza builder, community shoe store (filter_by_brand, add_to_cart), Rails bookmarks, task managers	The default entry. Expect dozens in the gallery — the rules' own snippet is search_products.
Docs / read-only lookup	OpenAI's own docs site, several searchDocs/readDocsPage sites	Useful, trivial to judge as thin.
Forms & booking	Chrome's bistro (declarative), flight search, Air Bird	The page validates what the agent submits — germ of the gate idea, unclaimed.
Games / novelty	WebMCP Maze, Blackjack with three agents	Leverage showcases, no impact story.
Agent proposes, page rules	Excalidraw's validate_mermaid gate, Scholar Sidekick citation checks, bistro validation	Our pattern, embryonic in the wild. Nobody has made verification itself the product.
Strong, per the guidance
Multiple schema-validated tools spanning read and write · effects visible in the page as they happen ("agents rely on the interface to plan next steps") · confirmation on consequential actions · honest errors the model can self-correct from · a real product around it.

Trivial, per the guidance
One wrapper tool around an existing API call · a chat widget bolted onto a static page · tools whose effects the human never sees · negative-framed descriptions ("don't use this for…").

Criticism to pre-empt
The public worries about WebMCP are dark patterns (sites steering agents) and prompt injection through tool output. A product whose entire posture is sourced verdicts, premise owned by the human, unknown counts as no answers both by design — worth one line in the description.

Character budgets
Chrome's security guidance is concrete: tool names ≤30 chars, tool descriptions ≤500, parameter descriptions ≤150, tool output ≤1.5K. Verdict payloads must be designed to fit.

KnownGate
live for all of the USA
The verification layer an agent passes a food decision through before a restricted household acts on it. Restrictions in, subject in, sourced verdict out. The premise is never stored: it arrives with the question and leaves with the answer. A clear needs two things covered — composition and preparation; one without the other is a written-out question, not a yes.

No conflict found
Components and preparation both covered by evidence.
Ask one question
Ingredients clear; preparation silent. The question is written out, ready for the counter.
Conflict found
The evidence names the restriction.
Couldn't verify
Nothing published, nobody to ask. Unknown counts as no. Always hatch, never a colour alone.
The substrate is the last week of KnownGate's US work, untouched and read-only: FDC ingredient statements joined by UPC with multi-record agreement, retailer product evidence, chain allergen charts and venue/menu pools across the ops metros, US recipe resolution, all ruled in the FDA-9 vocabulary. Packaged goods and recipes are national on day one; venues are national in mechanism — any published chart can be read — and graded in depth, which the product states rather than hides.

Four frames for what it becomes owner decides
1 · The planning board
ruled out: that is a planner, not a gate
A surface where the agent plans dinner, fills a cart, drafts the menu, and each item gets ruled as it lands. Ruled out by the owner: planning is the planner's job. If KnownGate grows a board it becomes a planner again. KnownGate stays the gate — the planning happens elsewhere, and what's planned is brought to the gate.

2 · The household page
recommended build
The household owns a page, and agents come to it — the family's own, and other people's. Grandma's agent asks "what can I cook for this family?" and gets sourced verdicts without ever seeing the restrictions themselves. Any agent's plan — including a planner's — passes through the gate for admission: candidates in, rulings out, eligibility not ranking. The conversation Mum "doesn't really get," her agent gets perfectly. Impossible before agents, pure verification, zero overlap with a planner.

3 · The operator side
roadmap, not build
A venue publishes a preparation statement and becomes green-eligible for every household that checks it — clearing "costs an operator nothing but the writing." Two-sided, ambitious, and the answer to shaping the open standard. Five days is not enough to do it honestly.

4 · The handoff artifacts
rides along free
What the check produces even when it can't clear: the written counter question a human carries into the physical world, and the frozen dated page (premise printed above the verdicts) passed to the school, the sitter, the grandmother. Agent work becoming something humans hand each other.

The human/agent split is the design
Agent-side tools: propose the diners and restrictions, submit candidates, run the check, read verdicts back, request a frozen page. Human-side, deliberately not tools: confirming the premise, changing it, sending the record — enforced with requestUserInteraction(), so the consent moment is a spec feature, not a hack. The tool count falls out of this split; it is not a headline.
The tool contract
v0 · the page as authority
Five tools on the ruling room, two on every label page. The split is the pattern: the agent proposes and checks; the page rules; the human confirms the premise, decides the ambers, and sends the record. All names ≤30 chars, descriptions ≤500, outputs designed under the 1.5K budget — verdicts stay compact and link down to a label page for full evidence.

Tool	Kind	In	Out
propose_premise	write · human-gated	restrictions[] (FDA-9 keys + free text), diners?, location?	Pauses on requestUserInteraction() — the human confirms or edits in the page. Returns the confirmed premise as the page now displays it. Never stored server-side.
check_item	core verb	subject: UPC / product name / menu item @ venue / ingredient list or recipe text	One verdict — no_conflict · conflict · ask_one_question · cannot_verify — with source, read date, coverage {composition, preparation}, conflicts[], and the written question when amber. Lands visibly on the ledger.
check_place	core verb	venue name/address or chain + location	Rules the whole published menu/chart: counts per verdict, notable items, the operator's caveat verbatim with capture date. Full ledger renders on the page.
get_board	readOnlyHint	—	Current premise + all verdicts on the board, compact. The agent plans its next move from the same state the human sees.
freeze_check	write · human-gated	—	Human confirms in-page; returns the dated read-only ck_… URL with the premise printed above the verdicts.
Every label page registers
get_label_facts (readOnly — composition, preparation statement, source, dates) and check_here (this page's subject against restrictions passed in the call). An agent landing anywhere in the corpus can rule without the ruling room.

Deliberately not tools
Changing a confirmed premise · overriding a verdict · deciding an amber · sending the frozen record. Enforced, not promised — the agent has no tool that can do any of them.

Contract invariants
Every verdict carries its source and read date · unknown counts as no · a clear requires composition and preparation · errors name what was missing so the agent can self-correct · untrustedContentHint on anything quoting operator text.

Lifecycle
Registered with an AbortController, feature-detected, silent no-op where document.modelContext is absent — the page works as a plain site for every human without an agent.

Open before building
decisions + first moves
Registered on Devpost ✓
Done 30 Aug.
Demo settled: the ruling room
Agent brings candidates with its own intelligence; the gate rules with sources; the human owns the premise and decides the ambers. Labels ship as the distribution layer underneath (every verdict links to one), never the demo. Boards stay with the planner; household-as-destination shelved.
Customer layers written in, not pivoted to
Households check free (demo) · practitioners issue premises (credibility) · manufacturers/operators pay to close evidence gaps and be green to agents (revenue) · schools/caterers rule menus against many households (expansion).
Name and document the pattern
The page-as-authority pattern (agent proposes · page rules · human owns the premise) written up in the README as a reusable WebMCP design pattern — the protocol contribution.
Build the eval, not just the app
Bare agent vs gated agent on questions with golden-set ground truth; small AX panel (tool-choice, completion, recovery); one graceful failure in the video. Numbers must come from real runs.
Name the public repo and license
Public repo = the KnownGate app (pages, tools, evals, fixtures); check API = new routes in the private KnownGate backend. License visible in About. Spelling on record: KnownGate. Coverage at launch: all ~50 ops metros for eat-out and order-in, national for packaged goods and recipes.
Tool contract drafted ✓
v0 above: five ruling-room tools, two per label page, the non-tools enforced. Schemas finalize in the repo.
Decide the coverage sentence
How the live product states the venue-depth gradient honestly, everywhere in the USA, from day one.
