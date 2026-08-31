type Row = { cells: (string | { token: string })[]; ceiling?: string };

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Row[];
}) {
  return (
    <div className="kg-table-wrap">
      <table className="kg-table">
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
                  {typeof c === "string" ? (
                    c
                  ) : (
                    <span className={`kg-live-token${c.token.includes("CORPUS") ? " corpus" : ""}`}>
                      [{c.token}]
                    </span>
                  )}
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
              {typeof r.cells[0] === "string" ? r.cells[0] : `[${r.cells[0].token}]`}
            </div>
            {r.cells.slice(1).map((c, j) => (
              <div key={j} className="field">
                <span className="field-label">{headers[j + 1]}</span>
                <div className="field-value">
                  {typeof c === "string" ? c : <span className="kg-live-token">[{c.token}]</span>}
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
