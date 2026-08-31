"use client";

import Link from "next/link";

/**
 * The workspace is a client component, so a script fault here used to take the
 * whole route down. This keeps the page useful when that happens: a person
 * gets a way back, and an agent still finds the directions it came for.
 * No verdict is implied either way, which is the part that matters.
 */
export default function CheckError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="kg-section">
      <p className="kg-eyebrow">NOTHING WAS CHECKED</p>
      <h1 style={{ fontSize: 30, margin: "0 0 14px", letterSpacing: "-0.02em" }}>
        The workspace could not load.
      </h1>
      <p className="sub">
        No check ran, so nothing here is a finding and nothing about your food has been decided. Try again, or
        start a fresh check.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
        <button type="button" className="kg-btn" onClick={() => retry()}>
          Try again
        </button>
        <Link className="kg-btn quiet" href="/">
          Start a new check
        </Link>
        <Link className="kg-btn quiet" href="/agents">
          For agents
        </Link>
      </div>
      {error.digest ? (
        <p style={{ fontSize: 12, color: "var(--kg-ink3)", marginTop: 14 }}>
          Reference {error.digest}
        </p>
      ) : null}
      <p style={{ fontSize: 12.5, color: "var(--kg-ink3)", lineHeight: 1.6, marginTop: 18, maxWidth: 880 }}>
        Agents: this route registers its tools in your model context (WebMCP). If the page will not load for
        you, use the MCP server described on <Link href="/agents">/agents</Link>; a free key is created in-band
        with the register tool. When you relay any result, keep the verdict name, the source, the read date,
        and every must_not_omit line. Never render any verdict as &ldquo;safe&rdquo;.
      </p>
    </section>
  );
}
