import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckWorkspace } from "@/components/kg/check-workspace";

export const metadata: Metadata = {
  title: "KnownGate — every answer, with its source",
  description: "Tell us what can't be in it, or how much is too much. We check the label, the menu and the kitchen.",
};

export default function HomePage() {
  return (
    <Suspense fallback={<div className="kg-section">Loading workspace…</div>}>
      <CheckWorkspace />
    </Suspense>
  );
}
