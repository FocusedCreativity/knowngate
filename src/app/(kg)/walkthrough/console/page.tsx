import type { Metadata } from "next";
import WalkthroughConsoleClient from "./console-client";

export const metadata: Metadata = {
  title: "Console walkthrough — KnownGate",
  description: "Fixture key states for design review. Not for public crawl.",
  robots: { index: false, follow: false },
};

export default function WalkthroughConsolePage() {
  return <WalkthroughConsoleClient />;
}
