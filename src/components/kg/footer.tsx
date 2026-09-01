import Link from "next/link";

/**
 * Server component, and deliberately outside the shell's Suspense boundary.
 * The header needs useSearchParams, which opts its boundary out of
 * prerendering; when the footer sat inside it, every static page shipped
 * without a footer and without the line saying the word "safe" is not used
 * here. Nothing in the footer is interactive, so nothing needs the client.
 */
export function KgFooter() {
  return (
    <footer className="kg-footer">
      <div className="kg-footer-grid">
        <div className="kg-footer-brand">
          <Link className="kg-mark" href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kg/living-loop-light.svg" alt="" width={26} height={26} />
            <span className="kg-mark-text">
              <strong>KnownGate</strong>
              <span>every answer, with its source</span>
            </span>
          </Link>
          <p>
            A verification layer for food. It rules on what it is handed, shows its sources and their dates,
            and says so plainly when nobody knows.
          </p>
          <span className="kg-footer-std">
            <span className="dot" aria-hidden />
            Evidence standard v1.0
          </span>
        </div>
        <div />
        <div>
          <h4>CHECK</h4>
          <ul>
            <li>
              <Link href="/check">Check something</Link>
            </li>
            <li>
              <Link href="/questions">Question library</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>PUBLISHED</h4>
          <ul>
            <li>
              <Link href="/standard">Evidence standard</Link>
            </li>
            <li>
              <Link href="/refusals">Refusal rate</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>BUILD</h4>
          <ul>
            <li>
              <Link href="/agents">Agents</Link>
            </li>
            <li>
              <Link href="/developers">Developers</Link>
            </li>
            <li>
              <Link href="/developers">WebMCP on this page</Link>
            </li>
            <li>
              <Link href="/signup">Get a key</Link>
            </li>
            <li>
              <Link href="/login">Sign in</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="kg-footer-bottom">
        <div className="kg-footer-law">
          <span>
            Not a guarantee of safety. The word &ldquo;safe&rdquo; is not used anywhere in this system.
          </span>
          <span>No account needed. We keep nothing unless you save a record to share.</span>
        </div>
        <nav>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/refusals">Report an error</Link>
          <span>© 2026 fuda</span>
        </nav>
      </div>
    </footer>
  );
}
