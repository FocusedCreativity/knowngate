import type { Metadata } from "next";

import { LegalPage } from "@/components/kg/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy · KnownGate",
  description:
    "Checking stores nothing. We keep a record only if you save one, and we sell nothing about you to anyone.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effective="Effective 1 September 2026 · v0.1"
      lede="The short version: checking stores nothing. We keep a record only if you save one, an email only if you make a developer account, and counts with no content in them. We sell nothing about you to anyone."
      sections={[
        {
          heading: "Checking stores nothing",
          body: "When you check food on knowngate.com we do not create an account, a profile, or a history. What you type exists on your screen and in the single request that answers it, and then it is gone. There is no household record, no list of what your family cannot eat, and no way for us to reconstruct one.",
        },
        {
          heading: "What we keep, and only because you asked",
          body: "A saved record: if you press save, we store that one check, its premise, its verdicts, and its date, as a page reachable by its link. That is the only place a restriction you typed is ever written down, and you created it on purpose to share. Ask us and we delete it. A developer account: an email address, an account name, the hashed form of the API key (we cannot see the key itself), and usage counts per key. Aggregate telemetry: how many checks were ruled per day, per arm, per verdict. Numbers only; never what was checked or by whom.",
        },
        {
          heading: "What we never do",
          body: "We do not sell or share personal information, and we have not done so in the preceding twelve months. We do not run advertising, we do not build profiles of you or your household, and we do not treat anything you type as health data to be kept. There is nothing here for a data broker to buy.",
        },
        {
          heading: "Your rights",
          body: "We build to the California standard (CCPA and CPRA) for everyone, in every state. You can ask what we hold about you, ask us to correct it, or ask us to delete it, and we will not treat you differently for asking. Because we do not sell or share personal information, there is nothing to opt out of, but the request channel exists all the same. Write to privacy@knowngate.com and we answer within the legal deadline, usually much faster, since for most people the honest answer is: we hold nothing.",
        },
        {
          heading: "Cookies and analytics",
          body: "The site works without tracking cookies. We use only what is needed to keep a signed-in developer session working and to count page visits in aggregate. No third-party advertising or cross-site tracking runs on knowngate.com.",
        },
        {
          heading: "Children",
          body: "KnownGate is not directed at children under 13 and we do not knowingly collect personal information from them. A parent checking food for a child types nothing we keep, which is the point.",
        },
        {
          heading: "Changes and contact",
          body: "The current version and its date are always on this page, and meaningful changes are announced before they apply. Questions and requests go to privacy@knowngate.com.",
        },
      ]}
    />
  );
}
