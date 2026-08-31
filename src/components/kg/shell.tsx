"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

function ToolsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pages = [...new Set(TOOL_MANIFEST.map((t) => t.page))];
  return (
    <div className="kg-scrim" onClick={onClose} role="presentation">
      <div
        className="kg-tools-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kg-tools-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kg-tools-head">
          <div>
            <p className="kg-eyebrow">WEBMCP ON THIS PAGE</p>
            <h2 id="kg-tools-title">
              {TOOL_COUNT} tools an agent can call here
            </h2>
          </div>
          <button type="button" className="kg-tools-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="kg-tools-lede">
          An agent in this browser can drive these directly, with no key and no server round trip. They set
          and read the premise and call the gate; the ruling is the same engine either way.
        </p>
        {pages.map((page) => (
          <div key={page} className="kg-tools-group">
            <p className="kg-eyebrow">{page.replace("-", " ").toUpperCase()}</p>
            <ul>
              {TOOL_MANIFEST.filter((t) => t.page === page).map((t) => (
                <li key={t.name}>
                  <code>{t.name}</code>
                  <span className="takes">{t.takes}</span>
                  <span className={`kg-tools-rw${t.readOnly ? " ro" : ""}`}>
                    {t.readOnly ? "reads" : "writes"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="kg-tools-foot">
          Nothing stored, unless you save a record to share.{" "}
          <Link href="/developers" onClick={onClose}>
            MCP and REST for agents without a browser
          </Link>
        </p>
      </div>
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
  const [tools, setTools] = useState(false);
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
            <button
              type="button"
              className="kg-tools-pill"
              aria-haspopup="dialog"
              aria-expanded={tools}
              onClick={() => setTools(true)}
            >
              <span className="kg-live-dot" aria-hidden />
              <span>WebMCP</span>
              <span className="kg-token-inline">{TOOL_COUNT} tools</span>
            </button>
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

      <ToolsDialog open={tools} onClose={() => setTools(false)} />

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
          <button
            type="button"
            className="kg-tools-pill"
            aria-haspopup="dialog"
            onClick={() => {
              setOpen(false);
              setTools(true);
            }}
          >
            <span className="kg-live-dot" aria-hidden />
            <span>WebMCP · {TOOL_COUNT} tools</span>
            <LiveToken label="LIVE" />
          </button>
          <Link className="kg-btn" href="/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
          <p>Nothing on this site needs an account to check. Sign in is for saved records and keys.</p>
        </div>
      </div>
    </>
  );
}

/** Header only; the footer is a server component rendered by the layout. */
export function KgShell({ modeHref }: { modeHref?: string }) {
  return <KgHeader modeHref={modeHref} />;
}
