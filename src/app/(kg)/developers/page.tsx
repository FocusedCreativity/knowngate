import type { Metadata } from "next";
import Link from "next/link";
import { LiveToken } from "@/components/kg/live-token";
import { DataTable } from "@/components/kg/data-table";
import { MustNotOmit } from "@/components/kg/primitives";
import { getQuestionLibrary } from "@/lib/kg/questions-data";

export const metadata: Metadata = {
  title: "Developers — KnownGate",
  description: "Don't let your agent guess. MCP, REST, free key, evidence standard v1.0.",
};

export default async function DevelopersPage() {
  const { count: qCount } = await getQuestionLibrary();
  return (
    <>
      <header className="kg-hero">
        <p className="kg-eyebrow">FOR DEVELOPERS</p>
        <h1>Don&apos;t let your agent guess.</h1>
        <p className="lead">
          Every food answer your product gives is a sentence your company said. It will sound exactly as
          confident when it is wrong. This page covers why that is a claims problem rather than a data
          problem, what one call returns, what happens when nothing can be verified, how to render a verdict
          without losing it, and what you can audit before you rely on any of it.
        </p>
        <div className="kg-chips">
          <span className="kg-chip">MCP + REST</span>
          <span className="kg-chip">
            free key · <LiveToken label="N" /> checks/month
          </span>
          <span className="kg-chip">evidence standard v1.0</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 16 }}>
          <Link className="kg-btn" href="/signup">
            Get a free key
          </Link>
          <Link className="kg-btn quiet" href="/login">
            Sign in
          </Link>
          <span style={{ fontSize: 14, color: "var(--kg-ink2)" }}>
            Email only, there is no password to choose. <LiveToken label="N" /> checks a month included.
          </span>
        </div>
      </header>

      <div className="kg-photo">
        <div className="kg-photo-ph">IMAGE · PHOTOGRAPH · A KITCHEN PASS</div>
      </div>

      <section className="kg-section argument">
        <h2>This is a claims problem, not a data problem.</h2>
        <p className="sub">
          Most teams arrive comparing food databases on breadth and price per row. That comparison answers the
          wrong question, because rows do not tell you whether the evidence behind them was good enough to
          answer with.
        </p>
        <div className="kg-grid-3">
          <article className="kg-tile">
            <p className="kg-eyebrow">THE ASSUMPTION</p>
            <strong>“I need better data.”</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              Every provider in this category sells rows, and the floor is a free government dataset. Buying
              more rows moves the ceiling on coverage. It does not move the authorship of the sentence.
            </p>
          </article>
          <article className="kg-tile">
            <p className="kg-eyebrow">WHAT ACTUALLY SHIPS</p>
            <strong>A boolean, wrapped in prose.</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              A flag comes back with no provenance and no date. Your model writes a fluent sentence around it.
              That sentence is now yours, and there is nothing behind it to point at.
            </p>
          </article>
          <article className="kg-tile">
            <p className="kg-eyebrow">WHAT A VERDICT CHANGES</p>
            <strong>You quote a finding.</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              The answer arrives with the source it rests on and the date that source was read. You are
              passing on a determination rather than making a claim of your own.
            </p>
          </article>
        </div>
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>Insurers have started writing AI out of standard cover.</strong>
          <p>
            Exclusions are appearing across general liability, errors and omissions, and directors and officers
            lines. What gets re-admitted is exposure with a named, documented control behind it. We are not
            offering you an undertaking, and there is none on any tier. We are offering you something you can
            name.
          </p>
        </div>
      </section>

      <section className="kg-section">
        <h2>Quickstart</h2>
        <p className="sub">
          Hosted MCP server, WebMCP, or REST, same engine. An agent with no browser integrates in five lines.
          Restrictions and thresholds travel with every call; the gate is stateless.
        </p>
        <pre className="kg-code">{`// MCP, the key travels in the server config
{ "mcpServers": { "knowngate": {
  "url": "https://mcp.knowngate.com/v1",
  "headers": { "Authorization": "Bearer kg_live_…" }
} } }

// or REST, absence and threshold in one call
curl https://api.knowngate.com/v1/check_item \\
  -H "Authorization: Bearer kg_live_…" \\
  -d '{"subject":{"upc":"0 78742 11934 6"},
  "restrictions":["peanut","sesame"],
  "thresholds":[{"nutrient":"sodium","max":600,
  "unit":"mg","basis":"per_serving"}]}'

// no key yet? knowngate.com/signup, free, {N} checks/month`}</pre>
      </section>

      <section className="kg-section">
        <h2>The tools</h2>
        <p className="sub">
          Three checks and one door in. Everything else on the page is WebMCP, listed in the tools dialog.
        </p>
        <DataTable
          headers={["Tool", "Takes", "Returns"]}
          rows={[
            {
              cells: [
                "check_item",
                "a UPC, or a dish name plus a venue id, with restrictions, thresholds, or both",
                "one verdict with evidence, source and date",
              ],
            },
            {
              cells: [
                "check_venue",
                "a venue id, or a menu payload from another MCP",
                "a verdict per item, plus venue coverage on both axes",
              ],
            },
            {
              cells: [
                "check_plan",
                "up to 25 subjects in one call, a recipe, a basket, a week",
                "one verdict per item, one call",
              ],
            },
            {
              cells: [
                "register",
                "an agent name and a contact email",
                "a free-tier key in the response body. Agent self-signup, no browser and no confirmation click.",
              ],
            },
          ]}
        />
      </section>

      <section className="kg-section">
        <h2>The verdict object</h2>
        <p className="sub">
          Fields, never prose. Nothing is written by a model at request time, your UI renders these. The
          thresholds input is optional; send it, and numeric limits are ruled alongside the absence premise in
          the same call.
        </p>
        <pre className="kg-code">{`// REQUEST, restrictions travel with every call
{
  "subject": { "upc": "0 78742 11934 6" },
  "restrictions": ["peanut", "sesame"],
  "thresholds": [ // optional, the numeric premise
    { "nutrient": "sodium", "max": 600, "unit": "mg", "basis": "per_serving" }
  ]
}

// RESPONSE, fields, never prose
{
  "verdict": "conflict_found", // one of four, never free text
  "allergen_hits": [],
  "threshold_hits": [
    { "nutrient": "sodium", "found": 890, "unit": "mg", "basis": "per_serving", "max": 600 }
  ],
  "axes": { "composition": "covered", "preparation": "covered" },
  "source": { "kind": "nutrition_panel", "read_at": "2026-08-14" },
  "question": null,
  "summary_line": "1 ruled · 0 no conflict · 1 conflict",
  "must_not_omit": [],
  "certificate_url": null // set only after save_record
}`}</pre>
        <MustNotOmit items={[]} />
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>These names are canon. Do not vary them.</strong>
          <p>
            Axis values are covered and not_covered. The save call is save_record and the field it populates is
            certificate_url. Question codes are the {qCount} defined in the question
            library. A threshold is ruled on the panel alone, the preparation axis does not apply to a numeric
            premise.
          </p>
        </div>
      </section>

      <section className="kg-section argument">
        <h2>Two of the four answers are not answers.</h2>
        <p className="sub">
          Ask one question and couldn&apos;t verify are what make the other two worth anything. A checker that
          clears everything is indistinguishable from no checker at all, and your users will work that out
          faster than you would like.
        </p>
        <div className="kg-grid-3">
          <article className="kg-tile paper">
            <span className="dot ask" aria-hidden />
            <strong>ask one question</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              One axis is covered and the other is reachable. You get the literal question to put to a kitchen
              or read off a pack, plus the rule for what counts as a sufficient answer, so a half answer is
              detectable in your own code.
            </p>
          </article>
          <article className="kg-tile paper">
            <span className="dot held" aria-hidden />
            <strong>couldn&apos;t verify</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              The gap cannot be closed by any question that exists. A deli soup has no panel and never will.
              This is a finding, not an error state, and it needs somewhere to go in your interface.
            </p>
          </article>
          <article className="kg-tile paper">
            <span className="dot shut" aria-hidden />
            <strong>fail closed, by construction</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              Unknown counts as no. It is not a setting, a confidence threshold or a strictness slider, because
              a checker whose rigour can be tuned has none. There is no flag that makes this more permissive.
            </p>
          </article>
        </div>
        <div className="kg-callout" style={{ marginTop: 20 }}>
          <strong>We publish the share we decline, and we do not work to bring it down.</strong>
          <p>
            The easy way to improve that number is to clear things on thinner evidence, which would make the
            figure look better and every verdict worth less. If it ever drops sharply without coverage rising,
            something is wrong and you should tell us.
          </p>
        </div>
      </section>

      <section className="kg-section">
        <h2>How to render this correctly</h2>
        <p className="sub">
          Not style guidance. A summary is where a verdict is most likely to be lost, and these are the ways it
          gets lost.
        </p>
        <DataTable
          headers={["Rule", "Why"]}
          colWidths={[280, null]}
          rows={[
            {
              cells: [
                "Pass verdicts through unchanged",
                "A model summarising four verdicts tends to collapse them into two. The casualty is always \u201ccouldn\u2019t verify\u201d.",
              ],
            },
            {
              cells: [
                "Never render any verdict as \u201csafe\u201d",
                "The word is not used anywhere in this system and is not a valid rendering of any of the four.",
              ],
            },
            {
              cells: [
                "Never drop must_not_omit items",
                "If your summary does not mention them, it is wrong. These are the items a person needs to act on.",
              ],
            },
            {
              cells: [
                "Always show the date",
                "A verdict is a statement about a date. Undated, it is worth nothing.",
              ],
            },
            {
              cells: [
                "Render summary_line verbatim where you can",
                "It is canonical, and it is counts rather than judgement.",
              ],
            },
          ]}
        />
        <div className="kg-callout dark" style={{ marginTop: 18 }}>
          <strong>Prefer the rendered card to the string.</strong>
          <p>
            Where your surface supports it, render the returned component rather than handing the model text to
            reword. That removes paraphrase drift entirely, summary_line is the fallback for surfaces that
            cannot.
          </p>
        </div>
      </section>

      <section className="kg-section">
        <h2>Limits and tiers</h2>
        <p className="sub">
          Free and unrestricted through 21 Sep 2026 while the WebMCP Challenge runs. A free key is required for
          direct API and MCP access. Paid tiers open 22 Sep.
        </p>
        <DataTable
          headers={["Tier", "Limit", "Availability", "What you get"]}
          colWidths={[170, 190, 150, null]}
          rows={[
            {
              cells: [
                "Open \u00b7 free",
                { node: <><LiveToken label="N" /> / month · unrestricted until 21 Sep</> },
                { status: "live now", tone: "live" },
                "All four verdicts with sources and dates. Free key required for direct access. Attribution required.",
              ],
            },
            {
              cells: [
                "Indie \u00b7 $29",
                "10,000 / month",
                { status: "opens 22 Sep", tone: "soon" },
                "Commercial use.",
              ],
            },
            {
              cells: [
                "Build \u00b7 $99",
                "50,000 / month",
                { status: "opens 22 Sep", tone: "soon" },
                "Uptime SLA, 30-day audit log.",
              ],
            },
            {
              cells: [
                "Team \u00b7 $399",
                "250,000 / month",
                { status: "opens 22 Sep", tone: "soon" },
                "Full SLA, 12-month audit log, the Checked by KnownGate mark.",
              ],
            },
            {
              cells: [
                "Verified \u00b7 $1,500",
                "high volume",
                { status: "waitlist", tone: "waitlist" },
                "Evidence-gap reporting, priority, multiple products.",
              ],
            },
            {
              cells: [
                "Assured \u00b7 $6,000",
                "high volume",
                { status: "waitlist", tone: "waitlist" },
                "Evidence-gap escalation with commitments, named incident response, jurisdiction scoping.",
              ],
            },
          ]}
        />
      </section>

      <section className="kg-section paper argument">
        <h2>Audit us before you rely on us.</h2>
        <p className="sub">
          Everything that governs a verdict is published, including the parts that do not flatter us. You should
          read them before you put this in front of a user.
        </p>
        <div className="kg-grid-3">
          <article className="kg-tile">
            <strong>Evidence standard v1.0</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              What counts as proof for each kind of premise, which source kinds can produce a clear, and what
              never counts. Versioned and dated.
            </p>
          </article>
          <article className="kg-tile">
            <strong>The question library</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              Every Q-PREP and Q-SERV code, its template, and the rule for what counts as a sufficient answer.
            </p>
          </article>
          <article className="kg-tile">
            <strong>Live refusal telemetry</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              The share we decline, updated daily, with the named cause of every refusal. Zero is a true number
              and the page is built to show it.
            </p>
          </article>
        </div>
        <div className="kg-callout dark" style={{ marginTop: 20 }}>
          <strong>
            In August we found 63,601 rows in our own corpus reading “may contain” as
            “contains”.
          </strong>
          <p>
            We fixed the reading, re-derived every affected row, and published the correction on the refusals
            page. We would rather you heard it from us, and it is a reasonable thing to hold us to.
          </p>
        </div>

        <h2 style={{ marginTop: 40 }}>What we do not offer yet</h2>
        <DataTable
          headers={["Not yet", "What that means"]}
          colWidths={[280, null]}
          rows={[
            {
              cells: [
                "No guarantee, on any tier",
                "You get verdicts with their sources and dates. You do not get an undertaking from us, and nothing here should be presented to your users as one.",
              ],
            },
            {
              cells: [
                "No SDKs",
                "MCP and REST only. Client libraries when there is enough surface to warrant them.",
              ],
            },
            {
              cells: [
                "No uptime history",
                "We launched on 30 August 2026. There is nothing to show yet, so we show nothing.",
              ],
            },
            {
              cells: [
                "No numeric premise outside beta",
                "Thresholds are live in beta against 305,000 rulable panels. Treat the coverage as growing rather than complete.",
              ],
            },
          ]}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
          <Link className="kg-btn" href="/signup">
            Get a free key
          </Link>
          <Link className="kg-btn quiet" href="/standard">
            Evidence standard v1.0
          </Link>
          <Link className="kg-btn quiet" href="/refusals">
            Report an error
          </Link>
        </div>
      </section>

      <section className="kg-close">
        <h2>Route the answer. Don’t generate it.</h2>
        <p>
          One call returns a determination with its source and its date, for what must be absent and for what
          must stay under a number. When nothing can be verified it says so, and that refusal is the reason the
          clears are worth anything. The rules are published, the refusal rate is published, and our own
          mistakes are published. Nothing here is promised that does not already exist.
        </p>
      </section>
    </>
  );
}
