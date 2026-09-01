import type { Metadata } from "next";

import { LegalPage } from "@/components/kg/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service · KnownGate",
  description:
    "Checking is free and stores nothing unless you save a record. A finding is dated evidence, never a promise.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      effective="Effective 1 September 2026 · v0.1"
      lede="The short version: checking is free and stores nothing unless you save a record. A finding is dated evidence, never a promise. Paid developer plans renew monthly and cancel in one click."
      sections={[
        {
          heading: "What KnownGate is",
          body: (
            <>
              KnownGate checks food claims against evidence: what a label declares, what a venue publishes,
              what a nutrition panel states. Every answer is one of four findings, shown with its source and
              the date that source was read. A finding is a statement about evidence on a date, not a promise
              about food. KnownGate is not medical advice, does not diagnose or treat anything, and never uses
              the word &ldquo;safe&rdquo;. You decide what to do with what we found.
            </>
          ),
        },
        {
          heading: "Checking is free, with no account",
          body: "Anyone can check food on knowngate.com without signing up or paying, and that will not change. We keep nothing you type unless you choose to save a record. A saved record is a dated page you create on purpose, reachable by its link, so you can show a kitchen, a school, or anyone else what was found and when.",
        },
        {
          heading: "Developer accounts and keys",
          body: "Developers and their agents can create a free API key with an email address. You are responsible for what is done with your key, and you may revoke it at any time in the console. Keys exist to identify accounts, not to paywall checking: knowngate.com itself never requires one.",
        },
        {
          heading: "Paid plans renew automatically, and cancelling is one click",
          body: "Paid developer plans open on 22 September 2026 and bill monthly. Before you pay we show you the exact price, what the plan includes, and the date each renewal will bill. Your plan renews automatically each month at that price until you cancel. You can cancel at any time in the console, online, in one step, with no call and no chat with anyone; cancelling is as easy as subscribing was. Cancellation takes effect at the end of the paid period and you keep access until then. If a price changes we tell you in advance, before it applies, and you can cancel first.",
        },
        {
          heading: "Honest limits",
          body: "Sources change. A manufacturer can reformulate, a venue can change its chart, and a verdict keeps the date it was issued rather than pretending to be current forever. We publish what counts as proof, how often we refuse to answer, and our own corrections. We do not guarantee outcomes, and to the extent the law allows, our liability is limited to what you paid us in the twelve months before a claim. Nothing in these terms limits liability where the law does not allow it to be limited.",
        },
        {
          heading: "Using KnownGate honestly",
          body: (
            <>
              If you pass our answers to your own users, pass them whole: the verdict, its source, its date,
              and every line marked as must not omit. Do not soften a refusal into a reassurance, do not
              present a finding as a guarantee, and do not attach the word &ldquo;safe&rdquo; to anything we
              returned.
            </>
          ),
        },
        {
          heading: "Changes and contact",
          body: "We can update these terms; the current version and its date are always on this page, and material changes to a paid plan are notified before they apply. Questions go to legal@knowngate.com.",
        },
      ]}
    />
  );
}
