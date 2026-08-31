"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [sent, setSent] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="kg-account-wrap">
      <div className="kg-account-card">
        <p className="kg-eyebrow">ACCOUNT</p>
        {sent ? (
          <>
            <h1>Check your email</h1>
            <p className="lead">
              We sent a magic link. Open it on this device to finish creating the account. Nothing is stored
              until you confirm.
            </p>
            <Link className="kg-btn quiet block" href="/login?state=form">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1>Get a key. Keep nothing you did not ask to keep.</h1>
            <p className="lead">
              An account is for saved records and API keys. Checks themselves need no account, and
              restrictions are never written down unless a signed-in household chooses to save theirs.
            </p>
            <form onSubmit={submit}>
              <label className="kg-label-field">
                <span>Email</span>
                <input className="kg-input" type="email" required placeholder="you@example.com" />
              </label>
              <p className="kg-eyebrow" style={{ marginTop: 8 }}>
                What are you building for?
              </p>
              <label className="kg-radio">
                <input type="radio" name="kind" value="household" defaultChecked />
                <div>
                  <strong>Household</strong>
                  <span>Save records and optional restriction sets for people you cook for.</span>
                </div>
              </label>
              <label className="kg-radio">
                <input type="radio" name="kind" value="practitioner" />
                <div>
                  <strong>Practitioner</strong>
                  <span>Share dated records with patients or clients. No medical advice in the product.</span>
                </div>
              </label>
              <label className="kg-radio">
                <input type="radio" name="kind" value="brand_operator" />
                <div>
                  <strong>Brand &amp; operator</strong>
                  <span>See what public subjects your keys have been asked about.</span>
                </div>
              </label>
              <label className="kg-radio">
                <input type="radio" name="kind" value="developer" />
                <div>
                  <strong>Developer</strong>
                  <span>Issue keys for agents and backends. Same engine, same verdicts.</span>
                </div>
              </label>
              <div className="kg-note-box">
                Free checks stay free. A key is only required when an agent or backend calls without a person
                on the page.
              </div>
              <button type="submit" className="kg-btn block">
                Send magic link
              </button>
            </form>
            <p style={{ marginTop: 16, fontSize: 13, color: "var(--kg-ink2)" }}>
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
