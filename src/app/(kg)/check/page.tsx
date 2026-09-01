import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckWorkspace } from "@/components/kg/check-workspace";

export const metadata: Metadata = {
  title: "Check a product or menu · KnownGate",
  description:
    "Check a product, a barcode or a menu against your own premise. Four verdicts, each with the source it came from and the date that source was read.",
  alternates: { canonical: "/check" },
};

export default function CheckPage() {
  return (
    <Suspense fallback={<div className="kg-section">Loading workspace…</div>}>
      <CheckWorkspace />
    </Suspense>
  );
}
