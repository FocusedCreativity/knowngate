import { Suspense } from "react";
import "../kg.css";
import { KgShell } from "@/components/kg/shell";
import { KgFooter } from "@/components/kg/footer";
import { AgentDirections } from "@/components/kg/agent-directions";

export default function KgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kg-root">
      {/*
        Only the header needs the client, and its useSearchParams opts this
        boundary out of prerendering. Keeping the boundary tight means the page
        and the footer still render into the static HTML.
      */}
      <Suspense fallback={<div className="kg-header" aria-hidden />}>
        <KgShell />
      </Suspense>
      <main className="kg-main">{children}</main>
      {/* On every page, not only /check: a searching model lands wherever the
          index sent it and never drives to the workspace. */}
      <AgentDirections />
      <KgFooter />
    </div>
  );
}
