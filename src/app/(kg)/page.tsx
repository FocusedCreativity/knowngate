import type { Metadata } from "next";
import { LandingPage } from "@/components/kg/landing";
import { loadLandingExamples } from "@/lib/kg/landing-data";
import { KNOWNGATE_DEFINITION } from "@/lib/kg/entity";

export const metadata: Metadata = {
  title: "KnownGate · every answer, with its source",
  description: KNOWNGATE_DEFINITION,
  openGraph: {
    title: "KnownGate · every answer, with its source",
    description: KNOWNGATE_DEFINITION,
    url: "/",
  },
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const examples = await loadLandingExamples();
  return <LandingPage examples={examples} />;
}
