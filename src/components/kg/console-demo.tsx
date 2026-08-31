"use client";

import Link from "next/link";
import { KeyRow } from "@/components/kg/primitives";
import { getWorkspace } from "@/lib/kg/fixtures";

type KeysState = "none" | "shown_once" | "active";

/** Demo key states — walkthrough only. */
export function ConsoleDemo({ keys }: { keys: KeysState }) {
  const data = getWorkspace().console_keys;

  return (
    <div className="kg-console">
      <p className="kg-eyebrow">DEVELOPER HOME · WALKTHROUGH</p>
      <h1>Your keys, and what they have asked</h1>
      <p className="lead">
        Demonstration states for the key UI. The keys backend does not exist yet. These values are fixtures,
        not live secrets.
      </p>

      <section className="kg-console-section">
        <h2>API KEYS</h2>
        {keys === "none" ? (
          <div className="kg-empty-keys">
            <p style={{ margin: "0 0 16px" }}>
              No keys yet. Create one when an agent needs to call without a person on the page.
            </p>
            <button type="button" className="kg-btn">
              Create a key
            </button>
          </div>
        ) : null}
        {keys === "shown_once" ? (
          <>
            <div className="kg-callout" style={{ marginBottom: 14 }}>
              <strong>Copy it now. We will not show the full key again.</strong>
              <p>Store it where your agent reads secrets. Revoke it from this page if it leaks.</p>
            </div>
            <div className="kg-key-once">{data.shown_once}</div>
            <button type="button" className="kg-btn quiet">
              I&apos;ve copied it
            </button>
          </>
        ) : null}
        {keys === "active" || keys === "shown_once" ? (
          <div style={{ marginTop: keys === "shown_once" ? 28 : 0 }}>
            {data.rows.map((row) => (
              <KeyRow
                key={row.id}
                id={row.id}
                created={row.created}
                lastUsed={row.lastUsed}
                origin={row.origin as "created by agent" | "created here"}
                status={row.status as "active" | "revoked"}
              />
            ))}
            {keys === "active" ? (
              <button type="button" className="kg-btn" style={{ marginTop: 16 }}>
                Create a key
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <p style={{ fontSize: 13, color: "var(--kg-ink2)" }}>
        <Link href="/developers">Developer docs</Link>
        {" · "}
        <Link href="/walkthrough">Back to walkthrough</Link>
      </p>
    </div>
  );
}
