import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Design walkthrough — KnownGate",
  description: "Review index for fixture-fed design screens. Not for public crawl.",
  robots: { index: false, follow: false },
};

export default function WalkthroughPage() {
  return (
    <div className="kg-walk">
      <h1>Design walkthrough</h1>
      <p className="lead">
        Fixture-fed screens for review. Canonical public and account routes are linked below. Workspace
        subjects live only here and on <code>/walkthrough/check</code>. This page is noindex, nofollow.
      </p>

      <section>
        <h2>PUBLIC</h2>
        <ul>
          <li>
            <Link href="/standard">
              /standard <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/questions">
              /questions <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/refusals">
              /refusals · layer 1 steady (review default) <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/refusals?layer1=zero">
              /refusals · layer 1 zero <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/refusals?layer1=low_n">
              /refusals · layer 1 low-n <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/agents">
              /agents <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/developers">
              /developers <span>›</span>
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2>WORKSPACE · HUMAN</h2>
        <ul>
          {[1, 2, 3, 4].map((step) => (
            <li key={`h-${step}`}>
              <Link href={`/walkthrough/check?mode=human&step=${step}`}>
                Human · step {step}
                {step === 4 ? " · result" : ""} <span>›</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>WORKSPACE · AGENT</h2>
        <ul>
          {[1, 2, 3, 4].map((step) => (
            <li key={`a-${step}`}>
              <Link href={`/walkthrough/check?mode=agent&step=${step}`}>
                Agent · step {step}
                {step === 3 ? " · ruling" : ""}
                {step === 4 ? " · results" : ""} <span>›</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>ACCOUNT</h2>
        <ul>
          <li>
            <Link href="/signup">
              /signup <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/login?state=form">
              /login · form <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/login?state=sent">
              /login · link sent <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/login?state=expired">
              /login · link expired <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/login?state=signed_in">
              /login · signed in <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/login?state=all">
              /login · all four moments (mobile frame) <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/console?keys=none">
              /console · no keys <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/console?keys=shown_once">
              /console · key shown once <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/console?keys=active">
              /console · active + revoked <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/account">
              /account → /console <span>›</span>
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2>UNTOUCHED LIVE → NOW DESIGN</h2>
        <ul>
          <li>
            <Link href="/">
              / · design workspace (human default) <span>›</span>
            </Link>
          </li>
          <li>
            <Link href="/check?mode=agent&step=4">
              /check · design workspace (agent) <span>›</span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
