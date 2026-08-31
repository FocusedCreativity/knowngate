import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckWorkspace } from "@/components/kg/check-workspace";

export const metadata: Metadata = {
  title: "Check workspace — KnownGate walkthrough",
  robots: { index: false, follow: false },
};

export default function WalkthroughCheckPage() {
  return (
    <Suspense fallback={<div className="kg-section">Loading workspace…</div>}>
      <CheckWorkspace />
    </Suspense>
  );
}
