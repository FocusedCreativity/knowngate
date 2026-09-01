import type { Metadata } from "next";
import Link from "next/link";

import { FREE_TIER_CHECKS } from "@/lib/kg/types";

import { LiveToken } from "@/components/kg/live-token";
import { MustNotOmit } from "@/components/kg/primitives";

export const metadata: Metadata = {
  title: "Agents · KnownGate",
  description:
    "The machine front door for AI agents: WebMCP on the page, MCP over streamable HTTP, and REST. Same engine, same verdicts, same sources and dates.",
  alternates: { canonical: "/agents" },
};

export default function AgentsPage() {
  return (
    <>
      <header className="kg-hero">
        <h1>KnownGate answers one question: does this food conflict with this premise?</h1>
        <p className="lead">
          A premise has two parts and you may send either, or both, in the same call.
        </p>
        <div className="kg-grid-2" style={{ marginTop: 24 }}>
          <article className="kg-tile">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span className="dot clear" style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--kg-lime)" }} aria-hidden />
              <strong style={{ fontSize: 18 }}>restrictions</strong>
            </div>
            <p className="lbl">
              What must not be present. The FDA-9 keys, plus any other name you send. In-group specifics are
              recorded, never silently widened.
            </p>
            <pre className="kg-code kg-code-light" style={{ marginTop: 14 }}>{`"restrictions": [
  "peanut",
  "sesame"
]`}</pre>
          </article>
          <article className="kg-tile">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span className="dot clear" style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--kg-lime)" }} aria-hidden />
              <strong style={{ fontSize: 18 }}>thresholds</strong>
            </div>
            <p className="lbl">
              What must stay under, or over, a number. Stated per serving, with the unit and the basis
              explicit.
            </p>
            <pre className="kg-code kg-code-light" style={{ marginTop: 14 }}>{`"thresholds": [
  { "nutrient": "added_sugar",
    "max": 2, "unit": "g",
    "basis": "per_serving" }
]`}</pre>
          </article>
        </div>
      </header>

      <section className="kg-section tight">
        <h2>Three ways in. None of them is the preferred one.</h2>
        <p className="sub">
          Pick by where your agent already lives. The engine, the verdicts and the evidence rules are identical
          across all three.
        </p>
        <div className="kg-grid-3">
          <article className="kg-tile">
            <h3 style={{ margin: "0 0 10px", fontSize: 22 }}>WebMCP</h3>
            <p className="lbl">
              If you are rendering this page, the tools are already in your model context. Nothing to install
              and no key.
            </p>
            <pre className="kg-code kg-code-light" style={{ marginTop: 14 }}>{`get_premise
set_restrictions
load_subject
check_item
check_venue
check_plan
get_result
answer_question
save_record`}</pre>
            <p className="lbl" style={{ marginTop: 14 }}>
              Use when: a person is watching, and you want them to see the premise before the answer.
            </p>
          </article>
          <article className="kg-tile">
            <h3 style={{ margin: "0 0 10px", fontSize: 22 }}>MCP</h3>
            <p className="lbl">
              A hosted server. Five lines of config and your agent never opens a browser.
            </p>
            <pre className="kg-code kg-code-light" style={{ marginTop: 14 }}>{`mcp.knowngate.com

check_item
check_venue
check_plan
register`}</pre>
            <p className="kg-lede-lime" style={{ marginTop: 14 }}>
              A free key is required; your agent creates one with the register tool, without leaving MCP.
            </p>
            <p className="lbl" style={{ marginTop: 10 }}>
              Use when: your agent runs tool-only, in Claude Desktop, Cursor or any MCP client.
            </p>
          </article>
          <article className="kg-tile">
            <h3 style={{ margin: "0 0 10px", fontSize: 22 }}>REST</h3>
            <p className="lbl">Two check endpoints and the public stats feed.</p>
            <pre className="kg-code kg-code-light" style={{ marginTop: 14 }}>{`POST /v0/check_item
POST /v0/check_venue
POST /v0/check_plan
GET /v0/stats
POST /v0/keys`}</pre>
            <p className="lbl" style={{ marginTop: 14 }}>
              Use when: you are not on MCP, or you are calling from a server you control.
            </p>
          </article>
        </div>
      </section>

      <section className="kg-section tight">
        <h2>One worked call.</h2>
        <p className="sub">
          A real product against a real premise. One conflict and one refusal come back in the same response,
          each with the source it rests on and the date that source was read.
        </p>
        <div className="kg-grid-2">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="kg-eyebrow">REQUEST</span>
              <LiveToken label="LIVE" />
            </div>
            <pre className="kg-code">{`POST /v0/check_item
Authorization: Bearer kg_live_••••

{
  "subject": { "upc": "0 51500 25551 8" },
  "restrictions": [],
  "thresholds": [
    { "nutrient": "added_sugar", "max": 2,
      "unit": "g", "basis": "per_serving" },
    { "nutrient": "trans_fat", "max": 0,
      "unit": "g", "basis": "per_serving" }
  ]
}`}</pre>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="kg-eyebrow">RESPONSE</span>
              <LiveToken label="LIVE" />
            </div>
            <pre className="kg-code">{`{
  "subject": "Jif Creamy Peanut Butter",
  "verdict": "conflict_found",
  "threshold_hits": [
    { "nutrient": "added_sugar", "found": 3,
      "max": 2, "unit": "g",
      "basis": "per_serving",
      "verdict": "conflict_found" },
    { "nutrient": "trans_fat", "found": null,
      "max": 0, "unit": "g",
      "verdict": "couldnt_verify",
      "reason": "panel_declares_zero_under_rounding" }
  ],
  "source": { "kind": "nutrition_panel",
    "read_at": "2026-08-14" },
  "summary_line": "1 ruled · 0 no conflict · 1 conflict",
  "must_not_omit": [ "trans_fat, couldn’t verify" ]
}`}</pre>
            <MustNotOmit items={["trans_fat, couldn't verify"]} />
          </div>
        </div>
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>Read the trans-fat line carefully, because it is the whole product.</strong>
          <p>
            The panel declares zero. US rounding rules permit anything below half a gram per serving to be
            declared as zero, so a panel reading zero does not establish that the value is zero. The gate will
            not clear a threshold of zero against a figure that cannot distinguish zero from almost zero. It
            says couldn&apos;t verify and tells you why.
          </p>
        </div>
      </section>

      <section className="kg-section tight">
        <h2>How to read a verdict.</h2>
        <p className="sub">Four values, and only four. They are never free text, and two of them are not answers.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            {
              v: "no_conflict_found",
              d: "Everything the premise asked about was covered by a source at ceiling, and nothing conflicted.",
              c: "clear",
            },
            {
              v: "conflict_found",
              d: "A restriction is present, or a threshold is exceeded. Named, sourced and dated.",
              c: "shut",
            },
            {
              v: "ask_one_question",
              d: "One thing is missing and can be closed. The question and its sufficient-answer rule are in the response.",
              c: "ask",
            },
            {
              v: "couldnt_verify",
              d: "The gap cannot be closed by any question that exists. This is a finding. Give it somewhere to go in your interface.",
              c: "held",
            },
          ].map((row) => (
            <div key={row.v} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span className={`dot ${row.c}`} style={{ width: 11, height: 11, borderRadius: "50%", background: `var(--kg-${row.c === "clear" ? "clear" : row.c === "shut" ? "shut" : row.c === "ask" ? "ask" : "held"})`, marginTop: 6, flexShrink: 0 }} aria-hidden />
              <code style={{ fontWeight: 600, minWidth: 180 }}>{row.v}</code>
              <span style={{ color: "var(--kg-ink2)" }}>{row.d}</span>
            </div>
          ))}
        </div>
        <div className="kg-grid-3" style={{ marginTop: 24 }}>
          <div className="kg-callout">
            <strong>Unknown counts as no.</strong>
            <p>
              Fail closed is the construction, not a setting. There is no flag that makes this more
              permissive.
            </p>
          </div>
          <div className="kg-callout">
            <strong>May contain blocks a clear.</strong>
            <p>
              An advisory line is a declared possibility. It cannot produce no_conflict_found for the
              allergen it names.
            </p>
          </div>
          <div className="kg-callout">
            <strong>KnownGate never says &ldquo;safe&rdquo;.</strong>
            <p>
              The word is not a valid rendering of any of the four values. Do not introduce it in your own
              copy.
            </p>
          </div>
        </div>
      </section>

      <section className="kg-section paper tight">
        <h2>Get a key.</h2>
        <p className="sub">
          If your agent can make an HTTP request it can sign itself up. There is no confirmation click in the
          way, because a verification wall is the human login wearing a costume.
        </p>
        <div className="kg-signup-split">
          <article className="kg-key-card">
            <p className="kg-eyebrow">FOR AGENTS</p>
            <h3>Sign yourself up. No browser needed.</h3>
            <p className="lbl">
              The email is for contact and recovery. It is not a wall you have to clear before the key works.
            </p>
            <div className="kg-grid-2" style={{ marginTop: 4 }}>
              <div>
                <span className="kg-eyebrow">REQUEST</span>
                <pre className="kg-code kg-code-light" style={{ marginTop: 8 }}>{`POST /v0/keys

{
  "agent_name": "cardia-meal-agent",
  "contact_email": "team@cardia.app"
}`}</pre>
              </div>
              <div>
                <span className="kg-eyebrow">RESPONSE</span>
                <pre className="kg-code" style={{ marginTop: 8 }}>{`201 Created

{
  "key": "kg_live_••••",
  "tier": "open",
  "included_per_month": ${FREE_TIER_CHECKS},
  "created_by": "agent"
}`}</pre>
              </div>
            </div>
            <p className="kg-lede-lime">
              On MCP already? Call the register tool and skip the HTTP entirely.
            </p>
            <p className="lbl">
              One key per email, rate limited per IP, and every key starts on the free tier. Upgrades are
              where a human and a payment method come in.
            </p>
          </article>
          <article className="kg-key-card">
            <p className="kg-eyebrow">FOR HUMANS</p>
            <h3>Prefer a dashboard?</h3>
            <p className="lbl">
              Create and manage keys, see usage by tool and by premise type, and revoke anything you no longer
              want live.
            </p>
            <Link className="kg-btn" href="/developers" style={{ width: "100%" }}>
              Go to /developers
            </Link>
            <p className="lbl">
              If your agent made a key first, sign in with the same email and it will be waiting for you. The
              agent signs up, the human claims the account afterwards.
            </p>
          </article>
        </div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
          Nothing on knowngate.com itself needs a key. The workspace, the record pages and the published
          standard are all open.
        </p>
      </section>

      <section className="kg-section tight">
        <div className="kg-grid-3" style={{ alignItems: "start" }}>
          <article className="kg-tile paper">
            <div className="kg-tile-stat">
              <LiveToken label="LIVE" size="lg" />
              <span className="lbl">declined</span>
            </div>
            <strong>What we have declined</strong>
            <p className="lbl">
              Pulled from /stats. Zero is a true number and this page is built to show it.
            </p>
            <Link className="kg-tile-link" href="/refusals">
              See the refusal rate
            </Link>
          </article>
          <article className="kg-tile paper">
            <strong>A verdict you can open</strong>
            <p className="lbl">
              Every saved record is a dated page anyone can re-check without an account.
            </p>
            <Link className="kg-tile-link" href="/walkthrough">
              See a sample record
            </Link>
          </article>
          <article className="kg-tile paper">
            <strong>What counts as proof</strong>
            <p className="lbl">
              The evidence standard, versioned and public, including what never counts.
            </p>
            <Link className="kg-tile-link" href="/standard">
              Read the standard
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}
