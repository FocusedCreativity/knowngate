import type { Metadata } from "next";
import { DataTable, Orient } from "@/components/kg/data-table";
import { KNOWNGATE_DEFINITION } from "@/lib/kg/entity";
import { CHANGELOG, CHANGE_POLICY, SOURCE_CEILINGS } from "@/lib/kg/evidence-standard";

export const metadata: Metadata = {
  title: "The evidence standard · KnownGate",
  description:
    "The evidence standard v1.0: what counts as proof, the four verdicts, and the rules KnownGate checks against. Published in full so the reasoning can be checked rather than trusted.",
  alternates: { canonical: "/standard" },
};

export default function StandardPage() {
  return (
    <>
      <header className="kg-hero">
        <p className="kg-eyebrow">EVIDENCE STANDARD</p>
        <h1>What counts as proof.</h1>
        {/* Opens on the canonical definition, in the same words as every
            other surface, before the page narrows to this document. */}
        <p className="lead">
          {KNOWNGATE_DEFINITION} This is the standard it checks against: what must not be in the food,
          and what must stay under a number. Published in full, so you can check our reasoning instead
          of trusting it. Version 1.0, effective 30 August 2026.
        </p>
        <div className="kg-chips">
          <span className="kg-chip">v1.0</span>
          <span className="kg-chip">published 30 Aug 2026</span>
          <span className="kg-chip">next review 28 Feb 2027</span>
        </div>
      </header>

      <Orient
        cards={[
          {
            title: "A developer, before integrating",
            body: "Read the source-kinds table and the four-verdict rules. That is what your product will be passing on to a user, and it is the part you will be held to.",
          },
          {
            title: "A risk or procurement reader",
            body: "This is the control document. It is versioned, dated, and changes in public. Nothing in it is negotiable per customer.",
          },
          {
            title: "Anyone building something similar",
            body: "Take it. A standard others build against is worth more to us than a database others cannot see.",
          },
        ]}
        note="This document says what counts as proof and what does not. It makes no claim about any particular food, and it promises nothing about outcomes."
      />

      <div className="kg-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kg/photo-label.webp" alt="" width={1200} height={300} decoding="async" />
      </div>

      <section className="kg-section">
        <h2>Two kinds of check</h2>
        <p className="sub">
          What you ask decides what counts as proof. The check is the same; the evidence it needs is not.
        </p>
        <DataTable
          headers={["Premise", "What it asserts", "What must be covered"]}
          rows={[
            {
              cells: [
                "Absence",
                "This must not be present. The nine major allergens, plus anything more specific you name; \u201ccashew\u201d is recorded as cashew, not blurred into \u201ctree nut\u201d.",
                "Both halves must be covered: what is in it (the ingredient list) and how it is made (shared equipment, surfaces, practice). The list alone never produces a clear.",
              ],
            },
            {
              cells: [
                "Threshold",
                "This must stay under a number, per serving. Sodium, added sugar, saturated fat, potassium, protein floors.",
                "The nutrition panel alone, cited and dated, with its serving size stated. How it is made does not apply here; a number does not rub off a shared board.",
              ],
            },
          ]}
        />
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>The both-halves rule applies to allergens only.</strong>
          <p>
            Numbers work differently. Nothing picks up sodium from a shared board. A number stands or falls
            on one source, the panel: whether it exists, is current, and states its serving.
          </p>
        </div>
      </section>

      <section className="kg-section">
        <h2>Source kinds, and the highest verdict each can reach</h2>
        <p className="sub">
          Who wrote the evidence decides how far it can take you, not whether it happens to be right. A
          correct reading of a PDF is still our reading, not theirs.
        </p>
        {/* Rendered from the published profile, so this table and
            /standard/v1.json can never state different ceilings. */}
        <DataTable
          headers={["Source", "What it is", "Ceiling"]}
          rows={SOURCE_CEILINGS.map((r) => ({
            cells: [r.source, r.what_it_is, r.ceiling.replace(/_/g, " ").replace("couldnt", "couldn\u2019t")],
          }))}
        />
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>A claim can create a conflict. It can never create a clear.</strong>
          <p>
            Unverified presence is a flag; unverified absence is not a pass. One sentence about pesto changes
            the answer. Three reassuring ones do not.
          </p>
        </div>
      </section>

      <section className="kg-section">
        <h2>The four verdicts, and when each is issued</h2>
        <div className="kg-grid-4">
          <article className="kg-tile">
            <span className="dot clear" aria-hidden />
            <div style={{ fontWeight: 700, marginBottom: 8 }}>no conflict found</div>
            <p className="lbl">
              Both what is in it and how it is made were covered by a source that can say so, and nothing you
              named was found.
            </p>
          </article>
          <article className="kg-tile">
            <span className="dot shut" aria-hidden />
            <div style={{ fontWeight: 700, marginBottom: 8 }}>conflict found</div>
            <p className="lbl">A restriction is present on any source, including a claim. Presence is enough.</p>
          </article>
          <article className="kg-tile">
            <span className="dot ask" aria-hidden />
            <div style={{ fontWeight: 700, marginBottom: 8 }}>ask one question</div>
            <p className="lbl">
              One half is covered. The other can be closed by a single question, and we tell you exactly what
              to ask.
            </p>
          </article>
          <article className="kg-tile">
            <span className="dot held" aria-hidden />
            <div style={{ fontWeight: 700, marginBottom: 8 }}>couldn&rsquo;t verify</div>
            <p className="lbl">The gap cannot be closed by any question available. Stated plainly, never softened.</p>
          </article>
        </div>
      </section>

      <section className="kg-section">
        <h2>Dating and supersession</h2>
        <p className="sub">Every verdict names the source it rested on and the date that source was read.</p>
        <DataTable
          headers={["Rule", "Detail"]}
          rows={[
            { cells: ["Verdicts are dated", "A verdict is a statement about a date, not a standing fact."] },
            { cells: ["Statements supersede", "A new venue statement replaces the old one from its effective date forward."] },
            { cells: ["No retro-clearing", "Verdicts issued under a superseded statement keep their original date. They are not re-cleared and not re-failed."] },
            { cells: ["Premise changes invalidate", "Changing the restriction set voids every verdict under the previous premise. Nothing carries over."] },
          ]}
        />
      </section>

      <section className="kg-section">
        <h2>What never counts</h2>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            "A collective term that hides the source, “natural flavoring”, “spices”, “natural colors”.",
            "Silence in prose. A menu that does not mention nuts is evidence of nothing.",
            "A marketing claim, “non-dairy”, “plant-based”, “allergy friendly”.",
            "An unanswered question, however likely the answer.",
            "Any payment. Publishing evidence is free and a paying publisher gets the same ruling as anyone else.",
            "A front-of-pack claim standing in for the panel. “Low sodium” on the label is a claim, not a measurement.",
            "A panel with no stated serving basis. Per 100g and per serving are different answers to the same question.",
          ].map((t) => (
            <li key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span className="dot clear" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--kg-ink)", marginTop: 8, flexShrink: 0 }} aria-hidden />
              <span style={{ color: "var(--kg-ink2)", fontSize: 15 }}>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="kg-section">
        <h2>Changing this standard</h2>
        <p className="sub">
          Versioned, dated, and public. A standard you write policy against has to promise its own
          stability, so here is what a change can and cannot do to a verdict you already hold.
        </p>
        <DataTable
          headers={["Rule", "Detail"]}
          rows={[
            { cells: ["Versioning", CHANGE_POLICY.versioning] },
            { cells: ["What breaks", CHANGE_POLICY.breaking_change] },
            { cells: ["What does not", CHANGE_POLICY.non_breaking_change] },
            { cells: ["Announcement", CHANGE_POLICY.announcement] },
            { cells: ["Verdicts already issued", CHANGE_POLICY.effect_on_existing_verdicts] },
          ]}
        />
        <h3 style={{ fontSize: 17, margin: "28px 0 10px" }}>Versions</h3>
        <DataTable
          headers={["Version", "Date", "Change"]}
          rows={CHANGELOG.map((c) => ({ cells: [`v${c.version}`, c.date, c.change] }))}
        />
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>The machine-readable profile.</strong>
          <p>
            The same rules as a document you can build against, at{" "}
            <a href="/standard/v1.json">/standard/v1.json</a>: the verdicts, the source ceilings, the
            invariants, and this change policy. The table above is rendered from it, so the page and the
            profile cannot disagree. Take it and build on it. A standard others build against is worth
            more to us than a database others cannot see.
          </p>
        </div>
      </section>
    </>
  );
}
