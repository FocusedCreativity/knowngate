import type { Metadata } from "next";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Get a free API key · KnownGate",
  description:
    "Get a free KnownGate API key. No card, no call. Enough checks to build against MCP, WebMCP or REST before you decide.",
  alternates: { canonical: "/signup" },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
