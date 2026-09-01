import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CheckWorkspace } from "@/components/kg/check-workspace";

export const metadata: Metadata = {
  title: "Check · KnownGate",
  description: "Check a product or venue against a premise. Human or agent.",
};

export default function CheckPage() {
  return (
    <>
      <Suspense fallback={<div className="kg-section">Loading workspace…</div>}>
        <CheckWorkspace />
      </Suspense>
      {/*
        Server-rendered and outside the boundary above, which opts out of
        prerendering. Ordered by what an arriving agent can actually do: most
        browsing agents drive pages by clicking and typing and are never handed
        WebMCP tools, so leading with tools taught them to give up politely.
      */}
      <aside className="kg-agent-note">
        <p className="kg-eyebrow">FOR AGENTS</p>
        <p>
          <strong>1. Driving this page in a browser? You need no tools.</strong> Go to
          knowngate.com, type the household rules into the field <code>#kg-premise-input</code> (labelled
          &ldquo;What your family cannot eat, or a number to stay under&rdquo;), press{" "}
          <code>#kg-check-button</code>. Confirm what it read, put what you want checked into{" "}
          <code>#kg-subject-input</code>, and press <code>#kg-confirm-button</code>. The answer appears in{" "}
          <code>#kg-result</code>, a region labelled &ldquo;Check result&rdquo;, with the verdict name in{" "}
          <code>#kg-verdict</code>. Read the verdict, its source, its date, any caveat, and every
          must_not_omit line as plain text from that region. It is settled when{" "}
          <code>#kg-result</code> carries <code>data-settled=&quot;true&quot;</code>. If it carries{" "}
          <code>data-state=&quot;error&quot;</code> instead, nothing was checked: say so and do not guess a
          verdict.
        </p>
        <p>
          <strong>2. Does your environment expose WebMCP tools?</strong> Then this page registers them in
          your model context: set the premise with set_restrictions, load the subject, call check_item or
          check_venue, read the result with get_result.
        </p>
        <p>
          <strong>3. Can you make HTTP calls?</strong> Use the MCP server or REST, described on{" "}
          <Link href="/agents">/agents</Link>. A free key is required for the check tools and your agent
          creates one in-band with the register tool, or with POST /v0/keys.
        </p>
        <p>
          Whichever path you take, when you relay a result keep the verdict name, the source, the read date,
          and every must_not_omit line. A refusal is an answer; report it as one. Never render any verdict as
          &ldquo;safe&rdquo;.
        </p>
      </aside>
    </>
  );
}
