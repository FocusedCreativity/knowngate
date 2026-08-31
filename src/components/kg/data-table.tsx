import type { ReactNode } from "react";

type Cell =
  | string
  | { token: string }
  | { held: true; label?: string }
  | { node: ReactNode }
  | { status: string; tone: "live" | "soon" | "waitlist" };

type Row = { cells: Cell[]; ceiling?: string };

export function DataTable({
  headers,
  rows,
  colWidths,
}: {
  headers: string[];
  rows: Row[];
  /** Fixed content widths in px, per the frame; a null entry lets the column flex. */
  colWidths?: (number | null)[];
}) {
  return (
    <div className="kg-table-wrap">
      <table className="kg-table">
        {colWidths ? (
          <colgroup>
            {headers.map((h, i) => (
              <col key={h} style={colWidths[i] ? { width: colWidths[i]! + 14 } : undefined} />
            ))}
          </colgroup>
        ) : null}
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.cells.map((c, j) => (
                <td key={j}>
                  {renderCell(c)}
                  {j === r.cells.length - 1 && r.ceiling ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span
                        className="dot"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background:
                            r.ceiling.includes("conflict") && !r.ceiling.includes("no")
                              ? "var(--kg-shut)"
                              : r.ceiling.includes("ask")
                                ? "var(--kg-ask)"
                                : r.ceiling.includes("couldn")
                                  ? "var(--kg-held)"
                                  : "var(--kg-clear)",
                        }}
                        aria-hidden
                      />
                      {r.ceiling}
                    </span>
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="kg-card-list">
        {rows.map((r, i) => (
          <div key={i} className="kg-stack-card">
            <div className="row-head">
              <span
                className="dot"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--kg-lime-deep)",
                  display: "inline-block",
                }}
                aria-hidden
              />
              {renderCell(r.cells[0])}
            </div>
            {r.cells.slice(1).map((c, j) => (
              <div key={j} className="field">
                <span className="field-label">{headers[j + 1]}</span>
                <div className="field-value">
                  {renderCell(c)}
                  {j === r.cells.length - 2 && r.ceiling ? ` · ${r.ceiling}` : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderCell(c: Cell) {
  if (typeof c === "string") return c;
  if ("node" in c) return c.node;
  if ("status" in c) {
    return (
      <span className={`kg-status ${c.tone}`}>
        <span className="dot" aria-hidden />
        {c.status}
      </span>
    );
  }
  if ("held" in c) {
    return (
      <span className="kg-held-state" title="Structural refusal">
        {c.label ?? "not covered by any source"}
      </span>
    );
  }
  return (
    <span className={`kg-live-token${c.token.includes("CORPUS") ? " corpus" : ""}`}>[{c.token}]</span>
  );
}

export function Orient({
  cards,
  note,
}: {
  cards: { title: string; body: string }[];
  note: string;
}) {
  return (
    <section className="kg-orient">
      <p className="kg-eyebrow">WHO THIS IS FOR</p>
      <div className="kg-orient-grid">
        {cards.map((c) => (
          <article key={c.title} className="kg-orient-card">
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </article>
        ))}
      </div>
      <p className="kg-orient-note">{note}</p>
    </section>
  );
}
