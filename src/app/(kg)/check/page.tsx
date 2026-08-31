import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckWorkspace } from "@/components/kg/check-workspace";

export const metadata: Metadata = {
  title: "Check — KnownGate",
  description: "Check a product or venue against a premise. Human or agent.",
};

export default function CheckPage() {
  return (
    <Suspense fallback={<div className="kg-section">Loading workspace…</div>}>
      <CheckWorkspace />
    </Suspense>
  );
}
