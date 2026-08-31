"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type LoginState = "form" | "sent" | "expired" | "signed_in";

function LoginCard({ state }: { state: LoginState }) {
  const [email, setEmail] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
  }

  const tags: Record<LoginState, string> = {
    form: "STATE · FORM",
    sent: "STATE · LINK SENT",
    expired: "STATE · LINK EXPIRED",
    signed_in: "STATE · SIGNED IN",
  };

  return (
    <div className="kg-account-card">
      <span
        style={{
          display: "inline-flex",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          border: "1px solid var(--kg-line)",
          borderRadius: 999,
          padding: "4px 9px",
          marginBottom: 16,
        }}
      >
        {tags[state]}
      </span>
      {state === "form" ? (
        <>
          <h1>Sign in</h1>
          <p className="lead">Magic link only. No password. Nothing happens until you open the email.</p>
          <form onSubmit={submit}>
            <label className="kg-label-field">
              <span>Email</span>
              <input
                className="kg-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <button type="submit" className="kg-btn block">
              Send magic link
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--kg-ink2)" }}>
            No account yet? <Link href="/signup">Get a key</Link>
          </p>
        </>
      ) : null}
      {state === "sent" ? (
        <>
          <h1>Link sent</h1>
          <p className="lead">
            Open the email on this device. The link expires in 15 minutes and works once.
          </p>
          <button type="button" className="kg-btn quiet block">
            Resend link
          </button>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--kg-ink2)" }}>
            <Link href="/login?state=form">Use a different email</Link>
          </p>
        </>
      ) : null}
      {state === "expired" ? (
        <>
          <h1>That link has expired</h1>
          <p className="lead">
            Magic links last 15 minutes and work once. Request a new one with the same email.
          </p>
          <Link className="kg-btn block" href="/login?state=form">
            Request a new link
          </Link>
        </>
      ) : null}
      {state === "signed_in" ? (
        <>
          <h1>You are signed in</h1>
          <p className="lead">
            Saved records and keys live in the developer console. Checks still need no account.
          </p>
          <Link className="kg-btn block" href="/console">
            Open console
          </Link>
          <button type="button" className="kg-btn quiet block" style={{ marginTop: 10 }}>
            Sign out
          </button>
        </>
      ) : null}
    </div>
  );
}

function LoginInner() {
  const sp = useSearchParams();
  const raw = sp.get("state") || "form";
  const all = raw === "all";
  const state = (["form", "sent", "expired", "signed_in"].includes(raw)
    ? raw
    : "form") as LoginState;

  if (all) {
    return (
      <div className="kg-state-grid" style={{ gridTemplateColumns: "1fr", maxWidth: 560, margin: "0 auto" }}>
        {(["form", "sent", "expired", "signed_in"] as LoginState[]).map((s) => (
          <LoginCard key={s} state={s} />
        ))}
      </div>
    );
  }

  return (
    <div className="kg-account-wrap">
      <LoginCard state={state} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="kg-account-wrap" />}>
      <LoginInner />
    </Suspense>
  );
}
