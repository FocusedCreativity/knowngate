"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { knownGateClient } from "@/lib/knowngate/client";
import { compactBoard, compactItem, compactPlace } from "@/lib/knowngate/compact";
import type { ItemResult, LabelResult, PlaceResult, Restriction } from "@/lib/knowngate/contracts";
import { IngredientPanel, NutritionPanelTable, PackShot } from "./label-panels";
import { SaveModal } from "./save-modal";
import { usePremiseFlow } from "@/lib/kg/use-premise-flow";
import { PARSE_MAX_CHARS, RESTRICTION_CHIPS } from "@/lib/kg/premise-parse";
import { parseCheckItemRequest, parseCheckPlaceRequest, parsePremise } from "@/lib/knowngate/validation";
import { rulingRoomSchemas } from "@/lib/webmcp/schemas";
import { useWebMcpTools, type RegisteredTool } from "@/lib/webmcp/use-webmcp-tools";
import { getWorkspace } from "@/lib/kg/fixtures";
import {
  compositionDetail,
  describeThresholdHit,
  preparationDetail,
  formatReadDate,
  mapNotable,
  mapPlaceCounts,
  summarizeItem,
  summarizeThresholdHit,
  thresholdBreached,
  toDesignVerdict,
} from "@/lib/kg/live-map";
import { MustNotOmit, QuestionBlock, SourceLine, SummaryLine, VerdictCard } from "@/components/kg/primitives";
import type { DesignVerdict } from "@/lib/kg/types";
import { LANDING_RESULT_KEY } from "@/lib/kg/landing-handoff";

const AGENT_TOOLS = [
  { name: "check_item", takes: "one dish or product" },
  { name: "check_venue", takes: "a whole menu" },
  { name: "check_plan", takes: "a set of things, a recipe, a basket" },
] as const;

type LoadState = "idle" | "loading" | "ready" | "error";

function chipToKey(chip: string): Restriction["key"] {
  if (chip === "tree nuts") return "tree_nut";
  return chip as Restriction["key"];
}

export function CheckWorkspace() {
  const sp = useSearchParams();
  const mode = sp.get("mode") === "agent" ? "agent" : "human";
  const step = Math.min(4, Math.max(1, Number(sp.get("step") || "4")));
  const data = getWorkspace();
  const [railOpen, setRailOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(step < 4);
  const [load, setLoad] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<ItemResult | null>(null);
  const [place, setPlace] = useState<PlaceResult | null>(null);
  // Held with the url it was fetched for, so a label is only ever shown beside
  // the result that asked for it and no reset is needed when the subject
  // changes.
  const [label, setLabel] = useState<{ url: string; data: LabelResult } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ url: string; on: string } | null>(null);
  /**
   * What the agent has done on this screen, in order. Driving arrives either
   * through the tools or through the DOM; the rail is meant to show the steps
   * either way, so both write here.
   */
  const [agentLog, setAgentLog] = useState<{ name: string; detail: string }[]>([]);

  const AGENT_STEP_LABELS = {
    premise_set: { name: "premise set", detail: "rules read from the agent's words" },
    subject_set: { name: "subject loaded", detail: "what the agent asked us to check" },
    check_started: { name: "check run", detail: "ruled against the live evidence" },
  } as const;

  /**
   * The agent's own copy of the flow the landing uses. Same hook, same calls,
   * same engine; the only difference is that the result comes back into the
   * agent workspace, and every step it takes is logged to the rail.
   */
  const agentFlow = usePremiseFlow({
    mode: "agent",
    onStep: (event) => setAgentLog((prev) => [...prev, AGENT_STEP_LABELS[event]]),
  });

  const premise = data.premise;
  const human = data.human;
  const agent = data.agent;
  const agentRestrictions = (premise.agent_restrictions ?? ["milk"]) as string[];

  // What the person actually asked for travels in the URL. The fixture is the
  // fallback for arriving here cold, never an override of a real premise.
  const urlRestrictions = (sp.get("restrictions") ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  const humanRestrictions = urlRestrictions.length ? urlRestrictions : premise.restrictions;
  const urlMax = Number(sp.get("sodium"));
  const hasUrlMax = Number.isFinite(urlMax) && urlMax > 0;
  /**
   * A URL that states a premise states all of it. Falling back to the fixture's
   * 600mg for someone who only named an allergen would check them against a
   * number they never gave.
   */
  const hasUrlPremise = urlRestrictions.length > 0 || hasUrlMax;
  const thresholdMax = hasUrlMax ? urlMax : premise.threshold.max;
  const checkThreshold = hasUrlPremise ? hasUrlMax : true;
  const urlSubject = sp.get("subject")?.trim() || null;
  /** A dish needs the venue it is served at; it is the only subject that can carry a question. */
  const urlVenue = sp.get("venue")?.trim() || null;
  const subjectDigits = urlSubject ? urlSubject.replace(/\D/g, "") : "";
  const subjectIsUpc = subjectDigits.length >= 8 && subjectDigits.length <= 14;

  const humanPremiseLine = hasUrlPremise
    ? [...humanRestrictions, checkThreshold ? `sodium under ${thresholdMax} mg per serving` : null]
        .filter(Boolean)
        .join(" · ")
    : premise.line;
  const bannerLine = mode === "agent" ? (premise.agent_line ?? "milk") : humanPremiseLine;
  // Who set it. In agent mode the premise arrives from the agent, whether it
  // typed into the field or wrote through a tool.
  const bannerMeta =
    mode === "human"
      ? premise.human_meta
      : agentLog.length
        ? "Set by your agent"
        : premise.agent_meta;
  const railLine =
    mode === "human"
      ? [...humanRestrictions, checkThreshold ? `sodium under ${thresholdMax} mg` : null]
          .filter(Boolean)
          .join(", ")
      : agentRestrictions.join(", ");
  const railSub = mode === "human" ? human.rail_summary : agent.rail_summary;
  /** Identifies the check this URL asks for, so a settled one is not run twice. */
  const requestKey = [
    mode,
    humanRestrictions.join(","),
    agentRestrictions.join(","),
    thresholdMax,
    urlSubject ?? "",
    urlVenue ?? "",
  ].join("|");
  const settledKey = useRef<string | null>(null);

  const rulingInProgress = mode === "agent" && step === 3;
  const humanRuling = mode === "human" && step === 3;
  /** 137:1833: agent selected, nothing sent. Nothing is set and nothing is loaded. */
  const agentIdle = mode === "agent" && step < 3;
  /** save_record has not happened while the gate is still running. */
  const shownActivity = agent.activity.filter(
    (a) => !(rulingInProgress && a.name === "save_record"),
  );
  /** Each restriction is one thing to rule, and the threshold is one more. */
  const thingsRuled = humanRestrictions.length + 1;
  const showHumanResult = mode === "human" && step >= 4;
  const showAgentResult = mode === "agent" && step === 4;
  /** A named subject is an item wherever it was driven from. */
  const resultIsItem = !!urlSubject || (!!item && !place);
  const showItemResult = (showHumanResult || showAgentResult) && resultIsItem;
  const showPlaceResult = showAgentResult && !resultIsItem;

  const tools: RegisteredTool[] = [
    {
      name: "propose_premise",
      description: "Propose a household premise for visible human confirmation.",
      inputSchema: rulingRoomSchemas.propose_premise,
      async execute(input) {
        try {
          const premise = parsePremise(input);
          return { status: "awaiting_human_confirmation", premise };
        } catch (e) {
          return {
            error: {
              code: "invalid_premise",
              message: e instanceof Error ? e.message : "Invalid premise",
            },
          };
        }
      },
    },
    {
      name: "check_item",
      description: "Rule one food subject against the confirmed household premise.",
      inputSchema: rulingRoomSchemas.check_item,
      async execute(input) {
        try {
          const restrictions: Restriction[] = humanRestrictions.map((key) => ({
            key: chipToKey(key),
          }));
          const req = parseCheckItemRequest({ ...(input as object), restrictions });
          const result = await knownGateClient.checkItem(req);
          setItem(result);
          setPlace(null);
          setLoad("ready");
          return compactItem(result);
        } catch (e) {
          return {
            error: {
              code: "check_failed",
              message: e instanceof Error ? e.message : "Check failed",
            },
          };
        }
      },
    },
    {
      name: "check_place",
      description: "Rule a venue against the confirmed household premise.",
      inputSchema: rulingRoomSchemas.check_place,
      async execute(input) {
        try {
          const restrictions: Restriction[] = agentRestrictions.map((key) => ({
            key: chipToKey(key),
          }));
          const v = input as { venue?: string; location?: string };
          const req = parseCheckPlaceRequest({
            restrictions,
            venue: { name: v.venue ?? agent.venue.name, ...(v.location ? { location: v.location } : {}) },
          });
          const result = await knownGateClient.checkPlace(req);
          setPlace(result);
          setItem(null);
          setLoad("ready");
          return compactPlace(result);
        } catch (e) {
          return {
            error: {
              code: "check_failed",
              message: e instanceof Error ? e.message : "Check failed",
            },
          };
        }
      },
    },
    {
      name: "get_board",
      description: "Read the confirmed premise and visible evidence ledger.",
      inputSchema: rulingRoomSchemas.empty,
      annotations: { readOnlyHint: true },
      async execute() {
        const restrictions =
          mode === "agent"
            ? agentRestrictions.map((key) => ({ key: chipToKey(key) }))
            : humanRestrictions.map((key) => ({ key: chipToKey(key) }));
        return compactBoard(
          { restrictions },
          [...(item ? [item] : []), ...(place ? [place] : [])],
        );
      },
    },
    {
      name: "freeze_check",
      description: "Request visible human confirmation to freeze the current evidence ledger.",
      inputSchema: rulingRoomSchemas.empty,
      async execute() {
        return { status: "awaiting_human_confirmation" };
      },
    },
  ];
  useWebMcpTools(tools);

  // The panels are drawn from the label, not from the check: one fetch of the
  // url the result already carries returns the photo, the ingredient statement
  // and the typed panel. Keyed to the result so a slow fetch can never paint
  // one product's label beside another product's verdict.
  const labelUrl = item?.label_url ?? null;
  const shownLabel = label && label.url === labelUrl ? label.data : null;
  useEffect(() => {
    if (!labelUrl) return;
    let cancelled = false;
    knownGateClient
      .getLabel(labelUrl)
      .then((data) => {
        if (!cancelled) setLabel({ url: labelUrl, data });
      })
      .catch(() => {
        // A missing label costs the panels their content, nothing more. The
        // verdict stands on the check, which has already returned.
      });
    return () => {
      cancelled = true;
    };
  }, [labelUrl]);

  useEffect(() => {
    if (!(showHumanResult || showAgentResult || rulingInProgress)) return;
    // The handoff from the landing clears itself once read. Without this, the
    // next run of this effect finds an empty store and checks all over again,
    // which is the flash the result was handed over to avoid.
    if (settledKey.current === requestKey) return;
    let cancelled = false;

    async function run() {
      try {
        // The landing already ran this check and handed the result over. Read
        // it before anything announces loading, so arriving from the hero
        // shows the verdict rather than flashing a spinner at a result we
        // are already holding.
        const handedOver = sp.get("from") === "landing" || sp.get("from") === "agent";
        if (handedOver) {
          const raw = sessionStorage.getItem(LANDING_RESULT_KEY);
          if (raw) {
            sessionStorage.removeItem(LANDING_RESULT_KEY);
            const result = JSON.parse(raw) as ItemResult;
            if (!cancelled) {
              settledKey.current = requestKey;
              setItem(result);
              setPlace(null);
              setError(null);
              setLoad("ready");
            }
            return;
          }
        }

        if (cancelled) return;
        setLoad("loading");
        setError(null);

        // A named subject is an item check whoever drove it. Only a bare venue
        // premise goes down the place path.
        if (mode === "human" || urlSubject) {
          const restrictions: Restriction[] = (mode === "agent" && !urlRestrictions.length
            ? agentRestrictions
            : humanRestrictions
          ).map((key) => ({
            key: key as Restriction["key"],
          }));
          const result = await knownGateClient.checkItem({
            restrictions,
            subject: urlSubject
              ? subjectIsUpc
                ? { kind: "upc", value: subjectDigits.padStart(14, "0").slice(-14) }
                : urlVenue
                  ? { kind: "menu_item", value: urlSubject, venue: urlVenue }
                  : { kind: "product_query", value: urlSubject }
              : {
                  kind: "upc",
                  value: human.subject.upc_display ?? human.subject.upc,
                  name: human.subject.name,
                },
            ...(checkThreshold
              ? {
                  thresholds: [
                    {
                      nutrient: premise.threshold.nutrient,
                      max: thresholdMax,
                      unit: premise.threshold.unit,
                      basis: "per_serving",
                    },
                  ],
                }
              : {}),
          });
          if (!cancelled) {
            settledKey.current = requestKey;
            setItem(result);
            setPlace(null);
            setLoad("ready");
          }
          return;
        }

        const restrictions: Restriction[] = agentRestrictions.map((key) => ({
          key: key as Restriction["key"],
        }));
        const result = await knownGateClient.checkPlace({
          restrictions,
          venue: { name: agent.venue.name },
        });
        if (!cancelled) {
          settledKey.current = requestKey;
          setPlace(result);
          setItem(null);
          setLoad("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setLoad("error");
          setError(e instanceof Error ? e.message : "Check failed");
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [mode, step, showHumanResult, showAgentResult, rulingInProgress, sp, requestKey]);

  /**
   * The only thing on this page that writes anything down, which is why it is
   * a person's press and never a tool call. It freezes exactly what is on
   * screen and hands back the dated page for it.
   */
  async function saveRecord() {
    const results = item ? [item] : place ? [place] : [];
    if (!results.length) return;
    setSaving(true);
    setSaveError(null);
    try {
      const frozen = await knownGateClient.freeze({
        premise: {
          restrictions: (mode === "agent" ? agentRestrictions : humanRestrictions).map((key) => ({
            key: key as Restriction["key"],
          })),
        },
        results,
      });
      // Confirm rather than navigate. The record is a real page because being
      // handed to someone is its whole purpose, but arriving there the instant
      // you press Save throws you out of your own session.
      setSaving(false);
      setSaved({
        url: new URL(`/ck/${frozen.ck_id}`, window.location.origin).toString(),
        on: formatReadDate(frozen.frozen_at.slice(0, 10)),
      });
    } catch (e) {
      setSaving(false);
      setSaveError(e instanceof Error ? e.message : "The record could not be saved.");
    }
  }

  /**
   * Only ask_one_question can carry a question. couldnt_verify means no
   * question that exists would close the gap, so a question shown beside one
   * would contradict the verdict above it, whatever the payload happens to
   * include.
   */
  const askQuestion = (() => {
    if (!item || toDesignVerdict(item.verdict) !== "ask_one_question") return null;
    const q = item.question;
    if (!q) return null;
    if (typeof q === "string") return { code: "", text: q, what_counts: undefined };
    return { code: q.code, text: q.text, what_counts: q.what_counts };
  })();

  const designVerdict: DesignVerdict | null = item ? toDesignVerdict(item.verdict) : null;
  /**
   * What was actually checked. The API returns name: null for a query it could
   * not resolve, and falling through to the fixture put a real verdict beside
   * a product the person never named.
   */
  const checkedSubject = item
    ? (item.subject.name ?? item.subject.value)
    : human.subject.name;
  const placeCounts = place ? mapPlaceCounts(place) : agent.counts;
  const notable = place ? mapNotable(place) : agent.notable;
  const itemTotal =
    placeCounts.no_conflict_found +
    placeCounts.ask_one_question +
    placeCounts.conflict_found +
    placeCounts.couldnt_verify;

  /**
   * What is left after the items already listed. Reporting the full counts
   * here would count the six shown twice, which is how it read as "84 more
   * items ruled" on a menu of 84.
   */
  const shown = notable.reduce(
    (acc, n) => {
      const key = toDesignVerdict(n.verdict) as keyof typeof acc;
      if (key in acc) acc[key] += 1;
      return acc;
    },
    { no_conflict_found: 0, ask_one_question: 0, conflict_found: 0, couldnt_verify: 0 },
  );
  const remainder = {
    no_conflict_found: Math.max(0, placeCounts.no_conflict_found - shown.no_conflict_found),
    ask_one_question: Math.max(0, placeCounts.ask_one_question - shown.ask_one_question),
    conflict_found: Math.max(0, placeCounts.conflict_found - shown.conflict_found),
    couldnt_verify: Math.max(0, placeCounts.couldnt_verify - shown.couldnt_verify),
  };

  const sodiumHit = item?.threshold_hits?.find((h) => h.nutrient === "sodium");
  const thresholdDetail = sodiumHit ? describeThresholdHit(sodiumHit) : human.threshold.detail;
  const thresholdState = sodiumHit && thresholdBreached(sodiumHit) ? "not_covered" : "covered";
  // No limit in the premise means no limit panel. Showing one anyway put a
  // 600 mg line under a check that only ever asked about peanuts.
  const showThreshold = item ? !!sodiumHit : true;

  // Both panels read the payload through the shared helpers, so a frozen
  // record and the live workspace can never describe the same result
  // differently.
  const compositionLine = item ? compositionDetail(item) : human.axes.composition.detail;
  const preparationLine = item ? preparationDetail(item) : human.axes.preparation.detail;

  const conflictNames = item?.conflicts.map((c) => c.restriction) ?? [];
  const humanSummary = item
    ? [
        summarizeItem(item),
        sodiumHit ? summarizeThresholdHit(sodiumHit) : null,
      ]
        .filter(Boolean)
        .join(" ")
    : human.summary;

  const chips = item
    ? [
        ...conflictNames,
        item.source?.name ?? "label",
        item.source ? `read ${formatReadDate(item.source.read_date)}` : null,
      ].filter(Boolean) as string[]
    : human.chips;

  return (
    <>
      <div className="kg-premise-banner">
        <span className="tag">CHECKED AGAINST</span>
        <span className="text">{bannerLine}</span>
        <span className="meta">{bannerMeta}</span>
        <button type="button" className="kg-btn quiet" style={{ padding: "6px 12px", fontSize: 13 }}>
          Change
        </button>
      </div>

      <button type="button" className="kg-rail-summary" onClick={() => setRailOpen((v) => !v)}>
        <div className="body">
          <strong>{railLine}</strong>
          <span>{railSub}</span>
        </div>
        <span aria-hidden>{railOpen ? "▴" : "▾"}</span>
      </button>

      <div className="kg-workspace">
        <aside className="kg-workspace-rail" style={railOpen ? { display: "block" } : undefined}>
          {mode === "human" ? (
            <>
              <p className="sec-label">RESTRICTIONS</p>
              <div className="kg-chip-row">
                {[
                  "milk",
                  "egg",
                  "fish",
                  "shellfish",
                  "tree nuts",
                  "peanut",
                  "wheat",
                  "soy",
                  "sesame",
                  "+ other",
                ].map((c) => {
                  const on = humanRestrictions.some(
                    (r) => c.includes(r) || r.includes(c.replace("tree nuts", "tree_nut")),
                  );
                  return (
                    <span key={c} className={`chip${on ? " on" : ""}`}>
                      {c}
                    </span>
                  );
                })}
              </div>
              <p style={{ fontSize: 12, color: "var(--kg-ink2)", margin: "0 0 16px" }}>
                Tap any chip to change it and the check re-runs.
              </p>
            </>
          ) : agentIdle ? null : (
            /* 166:123 and 167:44: what the agent set, not a picker to choose from. */
            <>
              <p className="sec-label">PREMISE</p>
              <div className="kg-chip-row">
                {agentRestrictions.map((r) => (
                  <span key={r} className="chip on">
                    {r.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "var(--kg-ink2)", margin: "0 0 16px" }}>
                Set by your agent. You can correct any of it.
              </p>
            </>
          )}
          {mode === "human" ? (
            <>
              {checkThreshold ? (
                <>
                  <p className="sec-label">KEEP UNDER</p>
                  <p style={{ fontSize: 14, margin: "0 0 20px" }}>
                    Keep <strong>sodium</strong> under <strong>{thresholdMax} mg</strong> per serving
                  </p>
                </>
              ) : null}
              <p className="sec-label">WHAT YOU CHECKED</p>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "var(--kg-paper-2)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                >
                  PACK
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{checkedSubject}</div>
                  <div style={{ fontSize: 12, color: "var(--kg-ink2)" }}>
                    {item
                      ? item.subject.kind === "upc"
                        ? `scanned · UPC ${item.subject.value}`
                        : "as you named it"
                      : human.subject.scanned_line}
                  </div>
                </div>
              </div>
              <button type="button" className="kg-btn quiet block">
                + Add another item
              </button>
            </>
          ) : (
            agentIdle ? (
            <>
              <div className="kg-agent-idle-head">
                <strong>Your agent checks.</strong>
                <p>
                  Ask your agent what you want to eat and who it is for. It can call the tools, or drive
                  these same fields in its browser. Either way the state lands here.
                </p>
              </div>

              {/*
                One form, both fields, per 137:1833. The dark button reads the
                premise into rules on its first press and runs the check on the
                next, which is exactly the two presses the directions publish:
                it carries #kg-check-button until the rules are read, then
                #kg-confirm-button.
              */}
              <form
                className="kg-agent-rail-form"
                onSubmit={agentFlow.stage === "compose" ? agentFlow.onRead : agentFlow.onCheck}
              >
                <p className="sec-label">PREMISE</p>
                <div className="kg-agent-rail-field">
                  <input
                    id="kg-premise-input"
                    name="premise"
                    className="kg-input"
                    value={agentFlow.text}
                    onChange={(e) => agentFlow.setText(e.target.value)}
                    maxLength={PARSE_MAX_CHARS}
                    aria-label="What your family cannot eat, or a number to stay under"
                    placeholder="e.g. milk allergy, and keep sodium under 200 mg"
                  />
                  <p className="hint">Your agent sets this, by tool or by typing here. You can correct any of it.</p>
                </div>

                {agentFlow.parsed?.restrictions.length || agentFlow.parsed?.thresholds.length ? (
                  <div className="kg-chip-row kg-agent-rail-chips">
                    {agentFlow.parsed.restrictions.map((r) => (
                      <span key={r} className="chip on">
                        {r.replace(/_/g, " ")}
                        <button
                          type="button"
                          aria-label={`Remove ${r}`}
                          onClick={() => agentFlow.dropRestriction(r)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {agentFlow.parsed.thresholds.map((t) => (
                      <span key={t.nutrient} className="chip on">
                        {t.nutrient} under {t.max}
                        {t.unit}
                        <button
                          type="button"
                          aria-label={`Remove the ${t.nutrient} rule`}
                          onClick={() => agentFlow.dropThreshold(t.nutrient)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* The parser is a convenience; when it is unreachable the
                    agent picks the rules instead of being stranded. */}
                {agentFlow.parserDown ? (
                  <div className="kg-chip-row kg-agent-rail-chips">
                    {RESTRICTION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className={`chip${agentFlow.manual.includes(chip) ? " on" : ""}`}
                        aria-pressed={agentFlow.manual.includes(chip)}
                        onClick={() => agentFlow.toggleManual(chip)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                ) : null}

                {agentFlow.parsed?.needs_number.map((need) => (
                  <label className="kg-confirm-amount" key={need.nutrient}>
                    <span>{need.nutrient} under</span>
                    <input
                      inputMode="numeric"
                      value={agentFlow.amounts[need.nutrient] ?? ""}
                      onChange={(e) =>
                        agentFlow.setAmounts((a) => ({ ...a, [need.nutrient]: e.target.value }))
                      }
                      aria-label={`Maximum ${need.nutrient} per serving`}
                    />
                    <span>{need.nutrient === "sodium" ? "mg" : "g"} per serving</span>
                  </label>
                ))}

                <p className="sec-label">SUBJECT</p>
                <div className="kg-agent-rail-field">
                  <input
                    id="kg-subject-input"
                    name="subject"
                    className="kg-input"
                    value={agentFlow.subject}
                    onChange={(e) => agentFlow.setSubject(e.target.value)}
                    aria-label="What to check"
                    placeholder="e.g. Kroger 99% Fat Free Chicken Broth"
                  />
                </div>

                <button
                  type="submit"
                  id={agentFlow.stage === "compose" ? "kg-check-button" : "kg-confirm-button"}
                  className="kg-btn dark kg-agent-rail-go"
                  disabled={agentFlow.busy}
                  aria-label={agentFlow.stage === "compose" ? "Read these words into rules" : "Run the check"}
                >
                  {agentFlow.busy
                    ? agentFlow.stage === "compose"
                      ? "Reading…"
                      : "Checking…"
                    : "Check"}
                </button>
                {agentFlow.error ? <p className="kg-landing-error">{agentFlow.error}</p> : null}
              </form>

              {/* The steps as they happen. This is the same list whether the
                  agent wrote through a tool or typed into the fields, because
                  both report through the flow. */}
              {agentLog.length ? (
                <>
                  <p className="sec-label">AGENT ACTIVITY</p>
                  <div className="kg-activity">
                    {agentLog.map((a, i) => (
                      <div key={`${a.name}-${i}`} className="kg-activity-item">
                        <div className="name">
                          <span className="dot" aria-hidden />
                          {a.name}
                        </div>
                        <div className="detail">{a.detail}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              <p className="sec-label">TOOLS EXPOSED TO YOUR AGENT</p>
              <div className="kg-activity">
                {AGENT_TOOLS.map((t) => (
                  <div key={t.name} className="kg-activity-item">
                    <div className="name">
                      <span className="dot" aria-hidden />
                      {t.name}
                    </div>
                    <div className="detail">{t.takes}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="sec-label">SUBJECT</p>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "var(--kg-paper-2)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                >
                  VENUE
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{agent.venue.name}</div>
                  <div style={{ fontSize: 12, color: "var(--kg-ink2)" }}>
                    {place
                      ? `${itemTotal} menu items · ${place.source?.name ?? "published allergen chart"}`
                      : agent.venue.line}
                  </div>
                </div>
              </div>
              <p className="sec-label">AGENT ACTIVITY</p>
              <div className="kg-activity">
                {shownActivity.map((a) => (
                  <div key={a.name} className="kg-activity-item">
                    <div className="name">
                      <span className="dot" aria-hidden />
                      {a.name}
                      {a.status === "not called" ? (
                        <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--kg-ink3)" }}>
                          not called
                        </span>
                      ) : null}
                      {rulingInProgress && a.name === "check_venue" ? (
                        <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--kg-ask)" }}>
                          running
                        </span>
                      ) : null}
                    </div>
                    <div className="detail">
                      {a.name === "check_venue"
                        ? rulingInProgress
                          ? `${place ? itemTotal : agent.venue.item_count} items on the published chart`
                          : `${place ? itemTotal : agent.venue.item_count} items ruled`
                        : a.detail}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ))}
          <p style={{ fontSize: 12, color: "var(--kg-ink2)", marginTop: 20 }}>
            Nothing stored, unless you save a record to share.
          </p>
        </aside>

        <div className="kg-workspace-main">
          {mode === "agent" && (step === 3 || step === 4) ? (
            <div style={{ marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => setActivityOpen((v) => !v)}
                style={{
                  width: "100%",
                  border: "1px solid var(--kg-line)",
                  borderRadius: "var(--kg-r)",
                  background: "#fff",
                  padding: 16,
                  textAlign: "left",
                  display: "block",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    color: "var(--kg-ink3)",
                    marginBottom: activityOpen ? 12 : 0,
                  }}
                >
                  <span>AGENT ACTIVITY · {shownActivity.length} CALLS</span>
                  <span aria-hidden>{activityOpen || rulingInProgress ? "▴" : "▾"}</span>
                </div>
                {(activityOpen || rulingInProgress) && (
                  <div className="kg-activity">
                    {shownActivity.map((a) => (
                      <div key={a.name} className="kg-activity-item">
                        <div className="name">
                          <span className="dot" aria-hidden />
                          {a.name}
                          {a.status === "not called" ? (
                            <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--kg-ink3)" }}>
                              not called
                            </span>
                          ) : null}
                        </div>
                        <div className="detail">{a.detail}</div>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </div>
          ) : null}

          {mode === "agent" && step === 3 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <h2 style={{ fontSize: 28, margin: "0 0 16px" }}>
                Ruling {place?.verdict_counts ? itemTotal : agent.venue.item_count} items against{" "}
                {agentRestrictions.join(", ")}
              </h2>
              <div
                style={{
                  height: 6,
                  width: 280,
                  margin: "0 auto 16px",
                  background: "var(--kg-paper-2)",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: load === "ready" ? "100%" : "64%",
                    height: "100%",
                    background: "var(--kg-ink)",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <p style={{ color: "var(--kg-ink2)", maxWidth: 480, margin: "0 auto" }}>
                Your agent is driving this. You are watching it happen, and the premise above is what it said
                you asked for.
              </p>
            </div>
          ) : null}

          {load === "error" && (showHumanResult || showAgentResult) ? (
            <div className="kg-callout" style={{ marginBottom: 20 }}>
              <strong>Check failed.</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {humanRuling ? (
            <div className="kg-ruling-progress">
              <strong>
                Ruling 1 product against {thingsRuled} thing{thingsRuled === 1 ? "" : "s"}
              </strong>
              <div className="kg-axes" style={{ marginTop: 14 }}>
                <div className="kg-axis covered">
                  <span className="axis-label">
                    <span className="dot" aria-hidden />
                    composition
                  </span>
                  <p>
                    {thingsRuled} of {thingsRuled}
                  </p>
                </div>
                <div className="kg-axis covered">
                  <span className="axis-label">
                    <span className="dot" aria-hidden />
                    preparation
                  </span>
                  <p>
                    {humanRestrictions.length} of {thingsRuled}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {showItemResult ? (
            <div id="kg-result" role="region" aria-label="Check result" data-settled={load === "ready"} data-state={load}>
              {load === "loading" ? (
                <p style={{ color: "var(--kg-ink2)" }}>Ruling against the live evidence…</p>
              ) : null}
              <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                <PackShot src={shownLabel?.image_url ?? null} alt={checkedSubject} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <VerdictCard
                    verdict={designVerdict ?? (human.verdict as DesignVerdict)}
                    subject={checkedSubject}
                    chips={chips}
                  />
                </div>
              </div>
              <SummaryLine text={humanSummary} />
              <MustNotOmit items={item?.must_not_omit ?? human.must_not_omit ?? []} />
              <p className="sec-label" style={{ marginTop: 24 }}>
                THE EVIDENCE
              </p>
              <div className="kg-axes" style={{ marginTop: 12 }}>
                <div className={`kg-axis ${item?.coverage.composition === "covered" ? "covered" : "not_covered"}`}>
                  <div className="axis-label">
                    <span className="dot" aria-hidden />
                    Composition, {item?.coverage.composition === "covered" ? "covered" : "not covered"}
                  </div>
                  <IngredientPanel label={shownLabel} />
                  <p style={{ margin: "10px 0 0", fontSize: 13 }}>
                    {compositionLine}
                  </p>
                </div>
                <div className={`kg-axis ${item?.coverage.preparation === "covered" ? "covered" : "not_covered"}`}>
                  <div className="axis-label">
                    <span className="dot" aria-hidden />
                    Preparation, {item?.coverage.preparation === "covered" ? "covered" : "not covered"}
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: 13 }}>
                    {preparationLine}
                  </p>
                </div>
                {showThreshold ? (
                <div className={`kg-axis ${thresholdState}`}>
                  <div className="axis-label">
                    <span className="dot" aria-hidden />
                    Threshold, {sodiumHit?.nutrient ?? human.threshold.nutrient}
                  </div>
                  <NutritionPanelTable
                    nutrition={shownLabel?.nutrition ?? null}
                    highlight={sodiumHit?.nutrient ?? null}
                  />
                  <p style={{ margin: "10px 0 0", fontSize: 13 }}>{thresholdDetail}</p>
                </div>
                ) : null}
              </div>
              <SourceLine
                kind="label"
                name={item?.source?.name ?? human.source.name}
                read_at={
                  item?.source ? formatReadDate(item.source.read_date) : human.source.read_at
                }
              />
              {askQuestion ? (
                <div className="kg-question-wrap">
                  <p className="kg-eyebrow">ONE QUESTION CLOSES THIS</p>
                  <QuestionBlock
                    code={askQuestion.code}
                    text={askQuestion.text}
                    what_counts={askQuestion.what_counts}
                  />
                  <p className="kg-question-note">
                    Ask it, then record what you were told. An unanswered question never becomes a clear, and
                    nothing here changes until a real answer comes back.
                  </p>
                </div>
              ) : null}
              <div className="kg-action-row">
                <button type="button" className="kg-btn dark" onClick={saveRecord} disabled={saving}>
                  {saving ? "Saving…" : "Save this record to share"}
                </button>
                <Link className="kg-action-quiet" href="/">
                  Check something else
                </Link>
              </div>
              {saveError ? (
                <p className="kg-landing-error" style={{ marginTop: 12 }}>
                  {saveError} Nothing was saved, and the check above is unchanged.
                </p>
              ) : null}
              <div className="kg-callout" style={{ marginTop: 16 }}>
                <strong>Saving is the only thing that writes anything down.</strong>
                <p>
                  Until you press it, this check exists only on your screen. Save it and you get a dated link
                  anyone can re-check, that is the one exception to nothing stored.
                </p>
              </div>
            </div>
          ) : null}

          {showPlaceResult ? (
            <div id="kg-result" role="region" aria-label="Check result" data-settled={load === "ready"} data-state={load}>
              {load === "loading" ? (
                <p style={{ color: "var(--kg-ink2)" }}>Ruling the venue against the live chart…</p>
              ) : null}
              <MustNotOmit items={place?.must_not_omit ?? agent.must_not_omit ?? []} />
              <div className="kg-chip-row" style={{ marginBottom: 20 }}>
                <span className="chip on">{placeCounts.no_conflict_found} clear</span>
                <span className="chip">{placeCounts.ask_one_question} ask</span>
                <span className="chip">{placeCounts.conflict_found} conflict</span>
                <span className="chip">{placeCounts.couldnt_verify} couldn&apos;t verify</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {notable.map((n) => (
                  <article
                    key={n.name}
                    style={{
                      border: "1px solid var(--kg-line)",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background:
                            n.verdict === "no_conflict_found"
                              ? "var(--kg-clear)"
                              : n.verdict === "conflict_found"
                                ? "var(--kg-shut)"
                                : n.verdict === "ask_one_question"
                                  ? "var(--kg-ask)"
                                  : "var(--kg-held)",
                        }}
                        aria-hidden
                      />
                      <strong>{n.name}</strong>
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 14 }}>{n.line}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--kg-ink2)" }}>{n.source}</p>
                  </article>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "var(--kg-ink2)", marginTop: 12 }}>
                {itemTotal > notable.length
                  ? `${itemTotal - notable.length} more items ruled. ${remainder.conflict_found} conflict found, ${remainder.ask_one_question} ask one question.`
                  : agent.more_line}
              </p>
              <div className="kg-action-row">
                <button type="button" className="kg-btn dark" onClick={saveRecord} disabled={saving}>
                  {saving ? "Saving…" : "Save this record to share"}
                </button>
                <Link className="kg-action-quiet" href="/check?mode=agent&step=1">
                  Change the premise
                </Link>
              </div>
              <div className="kg-callout" style={{ marginTop: 16 }}>
                <strong>The agent ruled nothing. It asked, and it is showing you what came back.</strong>
                <p>
                  It cannot raise a verdict, answer a question on your behalf, or save this without you.{" "}
                  {placeCounts.conflict_found} items conflict, and it is not allowed to round any of that
                  into &ldquo;mostly fine&rdquo;.
                </p>
              </div>
            </div>
          ) : null}

          {agentIdle ? (
            <div className="kg-agent-waiting">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kg/living-loop.svg" alt="" width={56} height={56} />
              <strong>Nothing ruled yet</strong>
              <p>Ask your agent what you want to eat and who it is for.</p>
              <p>Or switch to &ldquo;I&rsquo;m checking myself&rdquo; and do it by hand.</p>
              <div className="kg-callout">
                <strong>Two modes, one engine, one set of controls.</strong>
                <p>
                  A tool-calling agent writes the premise and subject directly. A browser-driving agent,
                  like ChatGPT operating this page, types into the same fields and presses the same
                  button. Either way the rail records each step, and the person can correct any of it.
                </p>
              </div>
            </div>
          ) : null}

          {step < 4 && mode === "human" ? <EmptyLanding step={step} /> : null}
        </div>
      </div>
      {saved ? (
        <SaveModal url={saved.url} savedOn={saved.on} onClose={() => setSaved(null)} />
      ) : null}
    </>
  );
}

function EmptyLanding({ step, agent }: { step: number; agent?: boolean }) {
  const data = getWorkspace();
  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "40px 0" }}>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--kg-ink2)", marginBottom: 12 }}>
        Free · no account to check · nothing stored unless you save a record
      </p>
      <h1 style={{ textAlign: "center", fontSize: "clamp(2rem,4vw,3rem)", margin: "0 0 12px" }}>
        “It&apos;s fine.” Says who?
      </h1>
      <p style={{ textAlign: "center", color: "var(--kg-ink2)", marginBottom: 24 }}>
        Tell us what can&apos;t be in it, or how much is too much. We check the label, the menu and the kitchen,
        and we say so when nobody knows.
      </p>
      <div
        style={{
          border: "1px solid var(--kg-line)",
          borderRadius: 14,
          padding: 18,
          background: "#fff",
        }}
      >
        <p className="sec-label">Can&apos;t be in it</p>
        <div className="kg-chip-row">
          {["milk", "egg", "fish", "shellfish", "tree nuts", "peanut", "wheat", "soy", "sesame", "+ other"].map(
            (c) => (
              <span
                key={c}
                className={`chip${step >= 2 && data.premise.restrictions.some((r) => c.includes(r)) ? " on" : ""}`}
              >
                {c}
              </span>
            ),
          )}
        </div>
        <p className="sec-label" style={{ marginTop: 16 }}>
          How much is too much
        </p>
        <p style={{ fontSize: 14 }}>
          Keep <strong>sodium</strong> under <strong>600 mg</strong> per serving
        </p>
        {agent ? (
          <p style={{ fontSize: 13, color: "var(--kg-ink2)", marginTop: 16 }}>
            Work mode. Waiting for your agent to call set_restrictions and load_subject.
          </p>
        ) : (
          <p style={{ fontSize: 13, color: "var(--kg-ink2)", marginTop: 16 }}>
            {step === 1 ? "Nothing entered yet." : "Premise set. Enter a subject to check."}
          </p>
        )}
      </div>
    </div>
  );
}
