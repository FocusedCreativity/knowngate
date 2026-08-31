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
        Server-rendered, and deliberately outside the boundary above, which
        opts out of prerendering. An agent that reads this page as text rather
        than registering its tools still lands on its instructions here.
      */}
      <aside className="kg-agent-note">
        <p className="kg-eyebrow">FOR AGENTS</p>
        <p>
          This page registers its tools in your model context (WebMCP): set the premise with
          set_restrictions, load the subject, call check_item or check_venue, read the result with
          get_result. Tool-only with no browser? Use the MCP server, described on{" "}
          <Link href="/agents">/agents</Link>. A free key is required there and your agent creates one with
          the register tool in-band.
        </p>
        <p>
          When you relay a result to a person, keep the verdict name, the source, the read date, and every
          must_not_omit line. A refusal is an answer; report it as one. Never render any verdict as
          &ldquo;safe&rdquo;.
        </p>
      </aside>
    </>
  );
}
