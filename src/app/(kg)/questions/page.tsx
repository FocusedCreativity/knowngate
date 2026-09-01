import type { Metadata } from "next";
import { LiveToken } from "@/components/kg/live-token";
import { QuestionsTable } from "@/components/kg/primitives";
import { DataTable, Orient } from "@/components/kg/data-table";
import { getQuestionLibrary } from "@/lib/kg/questions-data";

export const metadata: Metadata = {
  title: "Question library · KnownGate",
  description:
    "The question library: every preparation and serving question KnownGate can ask, published in full, with what counts as an answer to each.",
  alternates: { canonical: "/questions" },
};

export default async function QuestionsPage() {
  const { questions: all, count: qCount } = await getQuestionLibrary();
  const prep = all.filter((q) => q.family === "preparation");
  const serv = all.filter((q) => q.family === "serving");

  return (
    <>
      <header className="kg-hero">
        <p className="kg-eyebrow">QUESTION LIBRARY</p>
        <h1>Every question, published.</h1>
        <p className="lead">
          A question is only useful if a person can say it out loud and recognise a real answer. These are all
          of them: the kitchen questions that close a gap about what is in the food, and the pack questions
          that close a gap about a number.
        </p>
        <div className="kg-chips">
          <span className="kg-chip">{qCount} questions</span>
          <span className="kg-chip">v1.0</span>
          <span className="kg-chip">last change 30 Aug 2026</span>
        </div>
      </header>

      <Orient
        cards={[
          {
            title: "You were given a question to ask",
            body: "Find your code below. It tells you the exact words to use and what a real answer sounds like, so you can tell a proper answer from a shrug.",
          },
          {
            title: "A dietitian or allergist",
            body: "These are the questions we will put in front of your patients. Read them before you rely on a record one of them brings you.",
          },
          {
            title: "A developer",
            body: "The codes are stable and versioned. You can key your own interface off them, and the sufficient-answer rule is machine readable.",
          },
        ]}
        note="Every question the gate can ask is here. There are no others, and none of them are generated at the time you are asked."
      />

      <div className="kg-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kg/photo-question.webp" alt="" width={1200} height={300} decoding="async" />
      </div>

      <section className="kg-section">
        <h2>Keyed to the gap, not to the dish</h2>
        <p className="sub">
          This is why seventeen askable items collapse to three questions. Two dishes missing the same
          evidence get the same question, and one answer resolves both.
        </p>
        <div className="kg-grid-3">
          <article className="kg-tile">
            <div style={{ fontWeight: 600 }}>Q-PREP-07</div>
            <p className="lbl" style={{ marginTop: 8 }}>
              covers <LiveToken label="CORPUS" /> dishes at <LiveToken label="CORPUS_VENUE" />
            </p>
          </article>
          <article className="kg-tile">
            <div style={{ fontWeight: 600 }}>Q-PREP-14</div>
            <p className="lbl" style={{ marginTop: 8 }}>
              covers <LiveToken label="CORPUS" />
            </p>
          </article>
          <article className="kg-tile">
            <div style={{ fontWeight: 600 }}>Q-PREP-11</div>
            <p className="lbl" style={{ marginTop: 8 }}>
              covers <LiveToken label="CORPUS" />
            </p>
          </article>
        </div>
      </section>

      <section className="kg-section">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>The library</h2>
          <LiveToken label="LIVE" />
        </div>
        <p className="sub">
          Rendered from the question-library endpoint at build time. The rows are data, never typed into
          this page.
        </p>
        <QuestionsTable questions={prep} />
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--kg-ink2)" }}>
          + more in both families. Every code, its template, its slots and its sufficient-answer rule are in
          the machine-readable version.
        </p>
      </section>

      <section className="kg-section">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Q-SERV, the numeric family</h2>
          <LiveToken label="LIVE" />
        </div>
        <p className="sub">
          A number has one source, the panel. So only three things can be missing: the panel itself, its
          date, or its serving size. These are the questions that close those gaps.
        </p>
        <QuestionsTable questions={serv} />
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>A numeric question never asks the kitchen to estimate.</strong>
          <p>
            “Roughly how much salt is in it?” is not in this library and never will be. Either a panel exists
            and is read, or the item cannot clear a threshold. An estimate dressed as a measurement is the
            failure this standard exists to prevent.
          </p>
        </div>
      </section>

      <section className="kg-section">
        <h2>What a question is not</h2>
        <DataTable
          headers={["Not this", "Because"]}
          rows={[
            {
              cells: [
                "“Is this safe for my son?”",
                "Nobody can answer that, and the word is not used anywhere in this system.",
              ],
            },
            {
              cells: [
                "“Please provide allergen documentation.”",
                "A person has to say this out loud to a waiter on a Saturday night.",
              ],
            },
            {
              cells: [
                "A question with no sufficient-answer rule",
                "Then a shrug counts, and the question was decorative.",
              ],
            },
            {
              cells: [
                "A question the gate could answer itself",
                "If evidence exists we read it. Questions are only for gaps.",
              ],
            },
          ]}
        />
        <div className="kg-callout" style={{ marginTop: 24 }}>
          <strong>An unanswered question never becomes a clear.</strong>
          <p>
            A question is a route to evidence, not a substitute for it. If nobody answers, the item stays
            where it was, and the record names it.
          </p>
        </div>
      </section>
    </>
  );
}
