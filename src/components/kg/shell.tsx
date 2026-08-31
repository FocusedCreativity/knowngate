"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/kg/types";
import { TOOL_MANIFEST } from "@/lib/webmcp/manifest";
import { LiveToken } from "./live-token";

const TOOL_COUNT = TOOL_MANIFEST.length;

type Mode = "human" | "agent";

function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link className="kg-mark" href={href}>
      <img src="/kg/living-loop.svg" alt="" width={26} height={26} />
      <span className="kg-mark-text">
        <strong>KnownGate</strong>
        <span>every answer, with its source</span>
      </span>
    </Link>
  );
}

function ModeSwitch({
  mode,
  onChange,
  humanLabel = "Human",
  agentLabel = "Agent",
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  humanLabel?: string;
  agentLabel?: string;
}) {
  return (
    <div className="kg-mode" role="group" aria-label="Checker mode">
      <button type="button" aria-pressed={mode === "human"} onClick={() => onChange("human")}>
        {humanLabel}
      </button>
      <button type="button" aria-pressed={mode === "agent"} onClick={() => onChange("agent")}>
        {agentLabel}
      </button>
    </div>
  );
}

export function KgHeader({
  modeHref,
}: {
  /** When set, mode switch navigates here with ?mode= */
  modeHref?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const mode = (searchParams.get("mode") === "agent" ? "agent" : "human") as Mode;
  const resolvedModeHref =
    modeHref ??
    (pathname.startsWith("/walkthrough/check")
      ? "/walkthrough/check"
      : pathname === "/check" || pathname === "/"
        ? "/check"
        : undefined);

  function setMode(next: Mode) {
    const q = new URLSearchParams(searchParams.toString());
    q.set("mode", next);
    if (resolvedModeHref) {
      if (!q.has("step")) q.set("step", "4");
      router.push(`${resolvedModeHref}?${q.toString()}`);
      return;
    }
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }

  return (
    <>
      <header className="kg-header">
        <div className="kg-header-inner">
          <Brand />
          <div className="kg-header-rule" aria-hidden />
          <nav className="kg-nav" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="kg-header-actions">
            <div className="kg-tools-pill">
              <span className="kg-live-dot" aria-hidden />
              <span>WebMCP</span>
              <span className="kg-token-inline">{TOOL_COUNT} tools</span>
            </div>
            <ModeSwitch mode={mode} onChange={setMode} />
            <span className="kg-header-divider" aria-hidden />
            <Link className="kg-signin" href="/login">
              Sign in
            </Link>
          </div>
          <button
            type="button"
            className="kg-burger"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={`kg-menu-panel${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="kg-header-inner">
          <Brand />
          <div className="kg-header-rule" aria-hidden />
          <button type="button" className="kg-burger" aria-label="Close menu" onClick={() => setOpen(false)}>
            <span style={{ transform: "rotate(45deg) translate(4px,4px)" }} />
            <span style={{ opacity: 0 }} />
            <span style={{ transform: "rotate(-45deg) translate(4px,-4px)" }} />
          </button>
        </div>
        <div className="kg-menu-who">
          <div className="kg-label">WHO IS CHECKING</div>
          <div className="kg-menu-mode">
            <button type="button" aria-pressed={mode === "human"} onClick={() => setMode("human")}>
              I&apos;m checking myself
            </button>
            <button type="button" aria-pressed={mode === "agent"} onClick={() => setMode("agent")}>
              My agent is checking
            </button>
          </div>
          <p>
            The form on the left is for a person. Switch to agent and the controls go away, because your
            agent fills them.
          </p>
        </div>
        <div className="kg-menu-links">
          <Link className="kg-menu-link" href="/check" onClick={() => setOpen(false)}>
            <div>
              <strong>Check something</strong>
              <span>the workspace, no account needed</span>
            </div>
            <span className="chev" aria-hidden>
              ›
            </span>
          </Link>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} className="kg-menu-link" href={l.href} onClick={() => setOpen(false)}>
              <div>
                <strong>{l.label}</strong>
                <span>{l.short}</span>
              </div>
              <span className="chev" aria-hidden>
                ›
              </span>
            </Link>
          ))}
        </div>
        <div className="kg-menu-foot">
          <div className="kg-tools-pill">
            <span className="kg-live-dot" aria-hidden />
            <span>WebMCP · {TOOL_COUNT} tools</span>
            <LiveToken label="LIVE" />
          </div>
          <Link className="kg-btn" href="/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
          <p>Nothing on this site needs an account to check. Sign in is for saved records and keys.</p>
        </div>
      </div>
    </>
  );
}

export function KgFooter() {
  return (
    <footer className="kg-footer">
      <div className="kg-footer-grid">
        <div className="kg-footer-brand">
          <Brand />
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
          <span>Nothing stored, unless you save a record to share. No account to check.</span>
        </div>
        <nav>
          <Link href="/standard">Terms</Link>
          <Link href="/standard">Privacy</Link>
          <Link href="/refusals">Report an error</Link>
          <span>© 2026 fuda</span>
        </nav>
      </div>
    </footer>
  );
}

export function KgShell({
  children,
  modeHref,
}: {
  children: React.ReactNode;
  modeHref?: string;
}) {
  return (
    <div className="kg-root">
      <KgHeader modeHref={modeHref} />
      <main className="kg-main">{children}</main>
      <KgFooter />
    </div>
  );
}
