import type { Metadata } from "next";
import { LiveToken } from "@/components/kg/live-token";
import { MustNotOmit } from "@/components/kg/primitives";

export const metadata: Metadata = {
  title: "Agents — KnownGate",
  description: "The machine front door. WebMCP, MCP, and REST — same engine, same verdicts.",
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

      <section className="kg-section">
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
            <p className="lbl" style={{ marginTop: 14 }}>
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

      <section className="kg-section">
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

      <section className="kg-section">
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
              d: "The gap cannot be closed by any question available. Stated plainly, never softened.",
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
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>
            An advisory line is a declared possibility. It cannot produce no_conflict_found for the allergen
            it names.
          </strong>
        </div>
      </section>
    </>
  );
}
