import type { Metadata } from "next";
import { LandingPage } from "@/components/kg/landing";
import { loadLandingExamples } from "@/lib/kg/landing-data";

export const metadata: Metadata = {
  title: "KnownGate · every answer, with its source",
  description:
    "Tell us what can't be in it, or how much is too much. We check the label, the menu and the kitchen.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const examples = await loadLandingExamples();
  return <LandingPage examples={examples} />;
}
