"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { knownGateClient } from "@/lib/knowngate/client";
import type { ParsedPremise, ParsedThreshold } from "@/lib/kg/premise-parse";
import { chipToKey, parsePremise, subjectFromInput, venueFromInput } from "@/lib/kg/premise-parse";
import { LANDING_RESULT_KEY } from "@/lib/kg/landing-handoff";

export type Stage = "compose" | "confirm";
export type FlowMode = "human" | "agent";

/**
 * Words in, rules confirmed, one check run. The landing and the agent
 * workspace are the same flow wearing different chrome, so they share this
 * rather than each keeping their own copy: two implementations of "what did
 * the person actually ask for" is exactly the drift this product cannot
 * afford. Only `mode` differs, and it decides nothing but who the workspace
 * says was driving.
 */
export function usePremiseFlow({
  mode,
  onStep,
}: {
  mode: FlowMode;
  /** Called as the flow advances, so a workspace can log it as it happens. */
  onStep?: (event: "premise_set" | "subject_set" | "check_started") => void;
}) {
  /**
   * A person types words, sees the rules we read out of them, and only then
   * checks: that confirm step is the promise on the landing. An agent driving
   * the workspace has already stated the subject in the same submit, and the
   * rail shows it the parse as it happens, so making it press twice buys
   * nobody a second look and costs a round trip in the middle of a check.
   */
  const continuesWhenSubjectKnown = mode === "agent";
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("compose");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedPremise | null>(null);
  /** Numbers still owed to us, keyed by nutrient. */
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [subject, setSubject] = useState("");
  const [manual, setManual] = useState<string[]>([]);
  const [parserDown, setParserDown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleManual(chip: string) {
    setManual((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
  }

  function dropRestriction(key: string) {
    setParsed((p) => (p ? { ...p, restrictions: p.restrictions.filter((r) => r !== key) } : p));
  }

  function dropThreshold(nutrient: string) {
    setParsed((p) =>
      p ? { ...p, thresholds: p.thresholds.filter((t) => t.nutrient !== nutrient) } : p,
    );
  }

  async function onRead(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) {
      setError("Tell us what your family cannot eat, or what to keep under a number.");
      return;
    }
    setBusy(true);
    setError(null);
    const outcome = await parsePremise(value);
    setBusy(false);

    if (outcome.status === "invalid") {
      setError(outcome.message);
      return;
    }
    if (outcome.status === "unavailable") {
      // The parser is only a convenience. The check itself never depended on it.
      setParserDown(true);
      setStage("confirm");
      setSubject(value);
      onStep?.("premise_set");
      return;
    }
    setParsed(outcome.premise);
    const nextSubject = subject.trim() || outcome.premise.subject?.value || "";
    setSubject(nextSubject);
    setStage("confirm");
    onStep?.("premise_set");
    if (continuesWhenSubjectKnown && nextSubject) {
      // Straight on to the check, with the rules just read.
      void runCheck(
        nextSubject,
        outcome.premise.restrictions,
        outcome.premise.thresholds,
        amounts,
        outcome.premise.needs_number ?? [],
      );
    }
  }

  /**
   * The check itself, given a subject and the rules to rule it against. Taken
   * as arguments rather than read from state so it can run in the same tick
   * the rules were parsed, before React has committed them.
   */
  async function runCheck(
    subjectValue: string,
    restrictionKeys: string[],
    parsedThresholds: ParsedThreshold[],
    extraAmounts: Record<string, string> = amounts,
    needs: { nutrient: string; said: string }[] = [],
  ) {
    const thresholds: ParsedThreshold[] = [...parsedThresholds];
    // A number typed at the confirm step becomes a rule. One never given stays
    // off the check entirely.
    for (const need of needs) {
      const raw = extraAmounts[need.nutrient];
      const max = Number(raw);
      if (raw && Number.isFinite(max) && max > 0) {
        thresholds.push({
          nutrient: need.nutrient,
          max,
          unit: need.nutrient === "sodium" ? "mg" : "g",
        });
      }
    }
    if (!restrictionKeys.length && !thresholds.length) {
      setError("Add at least one rule: something that cannot be in it, or a number to stay under.");
      return;
    }

    setBusy(true);
    setError(null);
    onStep?.("subject_set");
    onStep?.("check_started");
    // "venue: Krystal" asks about a whole menu. Same premise, same rules, the
    // other call: without this the DOM path could only ever reach one product.
    const venue = venueFromInput(subjectValue);
    const q = new URLSearchParams();
    // Who was driving. The engine and the calls are identical either way; this
    // only decides which workspace the result is shown in.
    q.set("mode", mode);
    q.set("step", "4");
    q.set("from", mode === "agent" ? "agent" : "landing");
    if (restrictionKeys.length) q.set("restrictions", restrictionKeys.join(","));
    try {
      if (venue) {
        const place = await knownGateClient.checkPlace({
          restrictions: restrictionKeys.map((key) => ({ key: chipToKey(key) })),
          venue: { name: venue },
        });
        sessionStorage.setItem(LANDING_RESULT_KEY, JSON.stringify(place));
        q.set("venue", venue);
        router.push(`/check?${q.toString()}`);
        return;
      }
      const result = await knownGateClient.checkItem({
        restrictions: restrictionKeys.map((key) => ({ key: chipToKey(key) })),
        subject: subjectFromInput(subjectValue),
        // Omitted rather than sent empty when the premise carries no number.
        ...(thresholds.length
          ? {
              thresholds: thresholds.map((t) => ({
                nutrient: t.nutrient,
                max: t.max,
                unit: t.unit,
                basis: "per_serving",
              })),
            }
          : {}),
      });
      sessionStorage.setItem(LANDING_RESULT_KEY, JSON.stringify(result));
      q.set("subject", subjectValue);
      const sodium = thresholds.find((t) => t.nutrient === "sodium");
      if (sodium) q.set("sodium", String(sodium.max));
      router.push(`/check?${q.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The check could not be completed.");
      setBusy(false);
    }
  }

  async function onCheck(e: FormEvent) {
    e.preventDefault();
    const subjectValue = subject.trim();
    if (!subjectValue) {
      setError("Add what you want checked: a product name, a barcode, or a dish.");
      return;
    }
    await runCheck(
      subjectValue,
      parserDown ? manual : (parsed?.restrictions ?? []),
      parsed?.thresholds ?? [],
      amounts,
      parsed?.needs_number ?? [],
    );
  }

  function startOver() {
    setStage("compose");
    setParsed(null);
    setParserDown(false);
    setAmounts({});
    setError(null);
  }

  return {
    stage,
    text,
    setText,
    parsed,
    amounts,
    setAmounts,
    subject,
    setSubject,
    manual,
    toggleManual,
    parserDown,
    busy,
    error,
    setError,
    onRead,
    onCheck,
    startOver,
    dropRestriction,
    dropThreshold,
  };
}
