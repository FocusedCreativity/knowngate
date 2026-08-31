import type { Metadata } from "next";
import Link from "next/link";
import { LiveToken } from "@/components/kg/live-token";
import { DataTable } from "@/components/kg/data-table";
import { MustNotOmit } from "@/components/kg/primitives";

export const metadata: Metadata = {
  title: "Developers — KnownGate",
  description: "Don't let your agent guess. MCP, REST, free key, evidence standard v1.0.",
};

export default function DevelopersPage() {
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

      <section className="kg-section">
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
            certificate_url. Question codes are the <LiveToken label="Q_COUNT" /> defined in the question
            library. A threshold is ruled on the panel alone, the preparation axis does not apply to a numeric
            premise.
          </p>
        </div>
      </section>

      <section className="kg-section">
        <h2>Two of the four answers are not answers.</h2>
        <p className="sub">
          Ask one question and couldn&apos;t verify are what make the other two worth anything. A checker that
          clears everything is indistinguishable from no checker at all, and your users will work that out
          faster than you would like.
        </p>
        <div className="kg-grid-3">
          <article className="kg-tile">
            <span className="dot ask" aria-hidden />
            <strong>ask one question</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              One axis is covered and the other is reachable. You get the literal question to put to a kitchen
              or read off a pack, plus the rule for what counts as a sufficient answer, so a half answer is
              detectable in your own code.
            </p>
          </article>
          <article className="kg-tile">
            <span className="dot held" aria-hidden />
            <strong>couldn&apos;t verify</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              The gap cannot be closed by any question that exists. A deli soup has no panel and never will.
              This is a finding, not an error state, and it needs somewhere to go in your interface.
            </p>
          </article>
          <article className="kg-tile">
            <span className="dot held" aria-hidden />
            <strong>fail closed, by construction</strong>
            <p className="lbl" style={{ marginTop: 8 }}>
              Unknown counts as no. It is not a setting, a confidence threshold or a strictness slider, because
              a checker whose rigour can be tuned has none. There is no flag that makes this more permissive.
            </p>
          </article>
        </div>
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>Never drop must_not_omit items</strong>
          <p>
            We publish the share we decline, and we do not work to bring it down. The easy way to improve that
            number is to clear things on thinner evidence, which would make the figure look better and every
            verdict worth less.
          </p>
        </div>
        <p style={{ marginTop: 20, color: "var(--kg-ink2)" }}>
          Free tier: <LiveToken label="N" /> / month · unrestricted until 21 Sep
        </p>
      </section>
    </>
  );
}
