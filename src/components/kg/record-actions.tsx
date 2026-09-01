"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * The record's own actions, per 229:193. Print is the page printed, through
 * the print stylesheet, rather than a second document built to go stale.
 */
export function RecordActions({ rerunHref }: { rerunHref: string }) {
  const [copied, setCopied] = useState(false);

  // Opened from the save modal's Print, this page prints itself, so the paper
  // is the record and not whatever page the button was pressed on.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("print") !== "1") return;
    const id = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(id);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Refused clipboard access leaves the url in the address bar, which is
      // where it already was.
    }
  }

  return (
    <div className="kg-record-actions">
      <button type="button" className="kg-btn" onClick={copy}>
        {copied ? "Link copied" : "Copy link"}
      </button>
      <button type="button" className="kg-btn quiet" onClick={() => window.print()}>
        Print this page
      </button>
      <Link className="kg-btn dark" href={rerunHref}>
        Run this check again
      </Link>
    </div>
  );
}
