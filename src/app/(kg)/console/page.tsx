import Link from "next/link";

export default function ConsolePage() {
  return (
    <div className="kg-console">
      <p className="kg-eyebrow">DEVELOPER HOME</p>
      <h1>Your keys, and what they have asked</h1>
      <p className="lead">
        Keys are for agents and backends. A person on this site never needs one to run a check. Sign in when
        key management ships. Until then, this page stays empty on purpose.
      </p>

      <section className="kg-console-section">
        <h2>API KEYS</h2>
        <div className="kg-empty-keys">
          <p style={{ margin: "0 0 16px" }}>
            No keys yet. The keys backend is not live. When it is, keys you create will appear here, never as
            sample values on this route.
          </p>
          <button type="button" className="kg-btn" disabled>
            Create a key
          </button>
        </div>
      </section>

      <section className="kg-console-section">
        <h2>ATTRIBUTION · WHAT YOUR KEYS HAVE BEEN ASKED</h2>
        <div className="kg-callout">
          <strong>Public subjects only.</strong>
          <p>
            No premise, no restriction set, no household fact is attached to any of it. The subjects were
            public before you asked about them, which is why this can be shown to you and handed to an
            operator later.
          </p>
        </div>
        <div className="kg-empty-keys" style={{ marginTop: 14, textAlign: "left" }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--kg-ink2)" }}>
            Nothing to show until keys exist and have been used.
          </p>
        </div>
      </section>

      <p style={{ fontSize: 13, color: "var(--kg-ink2)" }}>
        <Link href="/developers">Developer docs</Link>
        {" · "}
        <Link href="/signup">Account types</Link>
      </p>
    </div>
  );
}
