import {
  AxisState,
  DesignVerdict,
  VERDICT_PROSE,
  VERDICT_TITLE,
} from "@/lib/kg/types";

export function VerdictCard({
  verdict,
  axes,
  subject,
  chips,
  children,
}: {
  verdict: DesignVerdict;
  axes?: { composition: AxisState; preparation: AxisState };
  subject?: string;
  chips?: string[];
  children?: React.ReactNode;
}) {
  return (
    <article className="kg-verdict">
      <div className={`kg-verdict-name ${verdict}`}>
        <span className="dot" aria-hidden />
        {VERDICT_TITLE[verdict]}
      </div>
      {subject ? <p className="kg-summary">{subject}</p> : null}
      {chips && chips.length > 0 ? (
        <div className="kg-chip-row">
          {chips.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
      ) : null}
      {axes ? (
        <div className="kg-axes">
          <div className={`kg-axis ${axes.composition}`}>
            <div className="axis-label">
              <span className="dot" aria-hidden />
              Composition, {axes.composition === "covered" ? "covered" : "not covered"}
            </div>
          </div>
          <div className={`kg-axis ${axes.preparation}`}>
            <div className="axis-label">
              <span className="dot" aria-hidden />
              Preparation, {axes.preparation === "covered" ? "covered" : "not covered"}
            </div>
          </div>
        </div>
      ) : null}
      {children}
      <span className="visually-hidden">{VERDICT_PROSE[verdict]}</span>
    </article>
  );
}

export function ThresholdHitRow({
  nutrient,
  found,
  unit,
  basis,
  max,
  min,
  verdict,
  reason,
}: {
  nutrient: string;
  found: number | null;
  unit: string;
  basis: string;
  max?: number;
  min?: number;
  verdict: DesignVerdict;
  reason?: string;
}) {
  return (
    <div className="kg-threshold-row">
      <span data-label="Nutrient">{nutrient}</span>
      <span data-label="Found">{found === null ? "null" : `${found} ${unit}`}</span>
      <span data-label="Basis">{basis}</span>
      <span data-label="Limit">
        {max !== undefined ? `max ${max}` : null}
        {min !== undefined ? `min ${min}` : null} {unit}
      </span>
      <span data-label="Verdict">
        {VERDICT_PROSE[verdict]}
        {reason ? ` · ${reason}` : ""}
      </span>
    </div>
  );
}

export function QuestionBlock({
  code,
  text,
  what_counts,
}: {
  code: string;
  text: string;
  what_counts: string;
}) {
  return (
    <div className="kg-question-block">
      <div className="code">{code}</div>
      <div className="text">{text}</div>
      <div className="what">What counts: {what_counts}</div>
    </div>
  );
}

export function SourceLine({
  kind,
  name,
  read_at,
}: {
  kind: string;
  name?: string;
  read_at: string;
}) {
  return (
    <p className="kg-source">
      {kind}
      {name ? ` · ${name}` : ""} · read on {read_at}
    </p>
  );
}

export function SummaryLine({ text }: { text: string }) {
  return <p className="kg-summary">{text}</p>;
}

export function StatsStrip({
  state,
  counts,
}: {
  state: "zero" | "low_n" | "steady";
  counts?: {
    couldnt_verify: number | "live";
    ask_one_question: number | "live";
    conflict_found: number | "live";
    no_conflict_found: number | "live";
    total?: number;
  };
}) {
  const labels = [
    { key: "couldnt_verify" as const, lbl: "couldn't verify", cls: "held" },
    { key: "ask_one_question" as const, lbl: "ask one question", cls: "ask" },
    { key: "conflict_found" as const, lbl: "conflict found", cls: "shut" },
    { key: "no_conflict_found" as const, lbl: "no conflict found", cls: "clear" },
  ];

  return (
    <div className="kg-stats">
      <span className="state-tag">
        STATE · {state === "zero" ? "ZERO" : state === "low_n" ? "LOW N" : "STEADY"}
      </span>
      {state === "zero" ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <img
            src="/kg/living-loop.svg"
            alt=""
            width={44}
            height={44}
            style={{ margin: "0 auto 12px" }}
          />
          <div className="num" style={{ fontSize: 28, fontWeight: 700 }}>
            0 checks ruled
          </div>
          <p style={{ color: "var(--kg-ink2)", margin: "8px 0 0" }}>
            We launched 30 Aug 2026. Nothing ruled yet, this page fills in as checks happen.
          </p>
        </div>
      ) : (
        <div className="kg-grid-4">
          {labels.map((l) => {
            const v = counts?.[l.key];
            return (
              <div key={l.key} className="kg-tile">
                <span className={`dot ${l.cls}`} aria-hidden />
                <div className="num">
                  {v === "live" || v === undefined ? (
                    <span className="kg-live-token lg">[LIVE]</span>
                  ) : (
                    v
                  )}
                </div>
                <div className="lbl">{l.lbl}</div>
              </div>
            );
          })}
        </div>
      )}
      {state === "low_n" && counts?.total !== undefined ? (
        <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--kg-ink2)" }}>
          {counts.total} checks ruled · no percentages shown below 500
        </p>
      ) : null}
      {state === "steady" ? (
        <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--kg-ink2)" }}>
          Percentages of [LIVE] checks ruled in the last 30 days. Values come from GET /v1/stats;
          nothing on this layer is written by hand.
        </p>
      ) : null}
    </div>
  );
}

export function KeyRow({
  id,
  created,
  lastUsed,
  origin,
  status,
}: {
  id: string;
  created: string;
  lastUsed: string;
  origin: "created by agent" | "created here";
  status: "active" | "revoked";
}) {
  return (
    <div className="kg-key-row">
      <span data-label="Key" style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
        {id}
      </span>
      <span data-label="Created">{created}</span>
      <span data-label="Last used">{lastUsed}</span>
      <span data-label="Origin">
        <span className={`kg-origin${origin === "created here" ? " here" : ""}`}>
          {origin === "created by agent" ? <span className="dot" aria-hidden /> : null}
          {origin}
        </span>
      </span>
      <span data-label="Status">
        <span className="kg-origin">
          <span
            className="dot"
            style={{ background: status === "active" ? "var(--kg-clear)" : "var(--kg-held)" }}
            aria-hidden
          />
          {status}
        </span>
      </span>
      <span>{status === "active" ? "Revoke" : ""}</span>
    </div>
  );
}

export function QuestionsTable({
  questions,
}: {
  questions: {
    code: string;
    family: string;
    question: string;
    what_counts: string;
    context: string;
  }[];
}) {
  return (
    <div className="kg-table-wrap">
      <table className="kg-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Question</th>
            <th>What counts</th>
            <th>Context</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.code}>
              <td>{q.code}</td>
              <td>{q.question}</td>
              <td>{q.what_counts}</td>
              <td>{q.context}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="kg-card-list">
        {questions.map((q) => (
          <div key={q.code} className="kg-stack-card">
            <div className="row-head">
              <span className="dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--kg-lime-deep)" }} aria-hidden />
              {q.code}
            </div>
            <div className="field">
              <span className="field-label">Question</span>
              <div className="field-value">{q.question}</div>
            </div>
            <div className="field">
              <span className="field-label">What counts</span>
              <div className="field-value">{q.what_counts}</div>
            </div>
            <div className="field">
              <span className="field-label">Context</span>
              <div className="field-value">{q.context}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MustNotOmit({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="kg-must-not-omit">
      <strong>must_not_omit</strong>
      <ul>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
