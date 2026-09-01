"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shown at the moment of saving, per 229:6. Saving used to navigate straight
 * to the record, which threw a person out of the workspace mid-session. The
 * record is a real page at its own URL because being handed to someone is its
 * whole purpose; this is only the confirmation that it now exists.
 */
export function SaveModal({
  url,
  savedOn,
  onClose,
}: {
  url: string;
  savedOn: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused. The link is on screen and
      // selectable, so there is nothing to recover from and nothing to say.
    }
  }

  // The pill shows the link the way a person would read it out; the clipboard
  // and the anchors both carry the absolute url.
  const shown = url.replace(/^https?:\/\//, "");

  return (
    <div className="kg-modal-scrim" role="presentation" onClick={onClose}>
      <div
        className="kg-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kg-save-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="kg-modal-close"
          ref={closeRef}
          onClick={onClose}
          aria-label="Close and stay in this check"
        >
          &times;
        </button>
        <p className="kg-eyebrow">RECORD SAVED</p>
        <h2 id="kg-save-title">This check now has its own page.</h2>
        <p className="kg-modal-lede">
          Saved {savedOn}. The dated link below is the one thing KnownGate stores. Anyone with the
          link sees this ruling exactly as frozen, and can re-run it fresh.
        </p>
        <p className="kg-modal-link">{shown}</p>
        <div className="kg-modal-actions">
          <button type="button" className="kg-btn" onClick={copy}>
            {copied ? "Link copied" : "Copy link"}
          </button>
          <a className="kg-btn dark" href={url} target="_blank" rel="noopener noreferrer">
            Open the record
          </a>
          {/*
            Printing from here has to print the record, not the workspace this
            modal is sitting on. The record page prints itself when opened this
            way, so the paper matches the link.
          */}
          <a
            className="kg-btn quiet"
            href={`${url}?print=1`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Print
          </a>
        </div>
        <p className="kg-modal-note">
          Nothing else about this session was kept. Delete the record any time from the record page.
        </p>
      </div>
    </div>
  );
}
