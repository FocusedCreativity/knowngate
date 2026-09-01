"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * The workspace is a client component, so a script fault here used to take the
 * whole route down. This keeps the page useful when that happens: a person
 * gets a way back, and an agent still finds the directions it came for.
 * No verdict is implied either way, which is the part that matters.
 *
 * It also prints the fault. We cannot see the console of a cloud browser
 * driving this page, so the failure has to carry its own diagnosis: an agent
 * that is told to report the text below turns one failed run into a bug
 * report, which is worth more than ten runs that only say it broke.
 */
export default function CheckError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  // Also to the console, for anyone who can read one.
  useEffect(() => {
    console.error("[knowngate] workspace failed to load:", error);
  }, [error]);

  const firstFrame = error.stack?.split("\n").find((l) => /\s+at\s/.test(l))?.trim() ?? null;
  const report = [
    error.name ? `${error.name}: ${error.message}` : error.message,
    firstFrame,
    error.digest ? `digest ${error.digest}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

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
        {/* retry() re-renders the segment. If the fault is in state that
            survives that, a full reload is the one that actually clears it. */}
        <button
          type="button"
          className="kg-btn quiet"
          onClick={() => window.location.reload()}
        >
          Reload the page
        </button>
        <Link className="kg-btn quiet" href="/">
          Start a new check
        </Link>
        <Link className="kg-btn quiet" href="/agents">
          For agents
        </Link>
      </div>

      {/* The fault itself, in the page, because the console is not reachable
          from here. Selectable so it can be copied verbatim. */}
      <p className="kg-eyebrow" style={{ marginTop: 22 }}>
        WHAT FAILED
      </p>
      <p
        id="kg-error-detail"
        data-error="true"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          lineHeight: 1.6,
          color: "var(--kg-ink2)",
          background: "var(--kg-paper-2)",
          borderRadius: 8,
          padding: "12px 14px",
          maxWidth: 880,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          userSelect: "all",
        }}
      >
        {report || "No error text was available."}
      </p>

      <p style={{ fontSize: 12.5, color: "var(--kg-ink3)", lineHeight: 1.6, marginTop: 18, maxWidth: 880 }}>
        <strong>Agents:</strong> this page failed to load, so nothing was checked. When you report this
        failure, quote the text under WHAT FAILED above, in <code>#kg-error-detail</code>, exactly as printed.
        That text is the fault itself and is what lets it be fixed. Do not retry more than once, do not answer
        the food question from your own knowledge, and never render any verdict as &ldquo;safe&rdquo;. This
        route also registers its tools in your model context (WebMCP); if the page will not load for you, use
        the MCP server described on <Link href="/agents">/agents</Link>, where a free key is created in-band
        with the register tool. When you relay any result, keep the verdict name, the source, the read date,
        and every must_not_omit line.
      </p>
    </section>
  );
}
