"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { knownGateClient } from "@/lib/knowngate/client";
import { compactBoard, compactItem, compactPlace } from "@/lib/knowngate/compact";
import type { ItemResult, PlaceResult, Restriction } from "@/lib/knowngate/contracts";
import { parseCheckItemRequest, parseCheckPlaceRequest, parsePremise } from "@/lib/knowngate/validation";
import { rulingRoomSchemas } from "@/lib/webmcp/schemas";
import { useWebMcpTools, type RegisteredTool } from "@/lib/webmcp/use-webmcp-tools";
import { getWorkspace } from "@/lib/kg/fixtures";
import {
  formatReadDate,
  mapNotable,
  mapPlaceCounts,
  summarizeItem,
  toDesignVerdict,
} from "@/lib/kg/live-map";
import { SourceLine, SummaryLine, VerdictCard } from "@/components/kg/primitives";
import type { DesignVerdict } from "@/lib/kg/types";
import { LANDING_RESULT_KEY } from "@/lib/kg/landing-handoff";

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

  const premise = data.premise;
  const human = data.human;
  const agent = data.agent;
  const agentRestrictions = (premise.agent_restrictions ?? ["milk"]) as string[];
  const humanRestrictions = premise.restrictions;

  const bannerLine = mode === "agent" ? (premise.agent_line ?? "milk") : premise.line;
  const bannerMeta = mode === "human" ? premise.human_meta : premise.agent_meta;
  const railLine =
    mode === "human"
      ? `${humanRestrictions.join(", ")}, sodium under ${premise.threshold.max} mg`
      : agentRestrictions.join(", ");
  const railSub = mode === "human" ? human.rail_summary : agent.rail_summary;
  const rulingInProgress = mode === "agent" && step === 3;
  const showHumanResult = mode === "human" && step >= 4;
  const showAgentResult = mode === "agent" && step === 4;

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

  useEffect(() => {
    if (!(showHumanResult || showAgentResult || rulingInProgress)) return;
    let cancelled = false;
    setLoad("loading");
    setError(null);

    async function run() {
      try {
        if (mode === "human" && sp.get("from") === "landing") {
          const raw = sessionStorage.getItem(LANDING_RESULT_KEY);
          if (raw) {
            sessionStorage.removeItem(LANDING_RESULT_KEY);
            const result = JSON.parse(raw) as ItemResult;
            if (!cancelled) {
              setItem(result);
              setPlace(null);
              setLoad("ready");
            }
            return;
          }
        }

        if (mode === "human") {
          const restrictions: Restriction[] = humanRestrictions.map((key) => ({
            key: key as Restriction["key"],
          }));
          const result = await knownGateClient.checkItem({
            restrictions,
            subject: {
              kind: "upc",
              value: human.subject.upc_display ?? human.subject.upc,
              name: human.subject.name,
            },
            thresholds: [
              {
                nutrient: premise.threshold.nutrient,
                max: premise.threshold.max,
                unit: premise.threshold.unit,
                basis: "per_serving",
              },
            ],
          });
          if (!cancelled) {
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
  }, [mode, step, showHumanResult, showAgentResult, rulingInProgress, sp]);

  const designVerdict: DesignVerdict | null = item ? toDesignVerdict(item.verdict) : null;
  const placeCounts = place ? mapPlaceCounts(place) : agent.counts;
  const notable = place ? mapNotable(place) : agent.notable;
  const itemTotal =
    placeCounts.no_conflict_found +
    placeCounts.ask_one_question +
    placeCounts.conflict_found +
    placeCounts.couldnt_verify;

  const sodiumHit = item?.threshold_hits?.find((h) => h.nutrient === "sodium");
  const thresholdDetail =
    sodiumHit && sodiumHit.found !== null
      ? `${sodiumHit.found} ${sodiumHit.unit} per serving, under the ${premise.threshold.max} mg limit.`
      : human.threshold.detail;

  const conflictNames = item?.conflicts.map((c) => c.restriction) ?? [];
  const humanSummary = item
    ? [
        summarizeItem(item),
        sodiumHit || human.threshold
          ? "The sodium limit is met."
          : null,
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
          <p className="sec-label">RESTRICTIONS</p>
          <div className="kg-chip-row">
            {["milk", "egg", "fish", "shellfish", "tree nuts", "peanut", "wheat", "soy", "sesame", "+ other"].map(
              (c) => {
                const activeKeys = mode === "agent" ? agentRestrictions : humanRestrictions;
                const on = activeKeys.some((r) => c.includes(r) || r.includes(c.replace("tree nuts", "tree_nut")));
                return (
                  <span key={c} className={`chip${on ? " on" : ""}`}>
                    {c}
                  </span>
                );
              },
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--kg-ink2)", margin: "0 0 16px" }}>
            Tap any chip to change it and the check re-runs.
          </p>
          {mode === "human" ? (
            <>
              <p className="sec-label">KEEP UNDER</p>
              <p style={{ fontSize: 14, margin: "0 0 20px" }}>
                Keep <strong>sodium</strong> under <strong>{premise.threshold.max} mg</strong> per serving
              </p>
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
                  <div style={{ fontWeight: 600 }}>{human.subject.short}</div>
                  <div style={{ fontSize: 12, color: "var(--kg-ink2)" }}>{human.subject.scanned_line}</div>
                </div>
              </div>
              <button type="button" className="kg-btn quiet block">
                + Add another item
              </button>
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
                    {place ? `${itemTotal} menu items · ${place.venue.city ?? "chart"}` : agent.venue.line}
                  </div>
                </div>
              </div>
              <p className="sec-label">AGENT ACTIVITY</p>
              <div className="kg-activity">
                {agent.activity.map((a) => (
                  <div key={a.name} className="kg-activity-item">
                    <div className="name">
                      <span className="dot" aria-hidden />
                      {a.name === "check_venue" ? "check_place" : a.name}
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
                      {a.name === "check_venue" && place
                        ? `${itemTotal} items ruled · milk premise`
                        : a.detail}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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
                  <span>AGENT ACTIVITY · {agent.activity.length} CALLS</span>
                  <span aria-hidden>{activityOpen || rulingInProgress ? "▴" : "▾"}</span>
                </div>
                {(activityOpen || rulingInProgress) && (
                  <div className="kg-activity">
                    {agent.activity.map((a) => (
                      <div key={a.name} className="kg-activity-item">
                        <div className="name">
                          <span className="dot" aria-hidden />
                          {a.name === "check_venue" ? "check_place" : a.name}
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
                {agentRestrictions.length} thing{agentRestrictions.length === 1 ? "" : "s"}
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

          {showHumanResult ? (
            <div>
              {load === "loading" ? (
                <p style={{ color: "var(--kg-ink2)" }}>Ruling against the live evidence…</p>
              ) : null}
              <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 180,
                    height: 150,
                    background: "var(--kg-paper-2)",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  PACK SHOT
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <VerdictCard
                    verdict={designVerdict ?? (human.verdict as DesignVerdict)}
                    subject={item?.subject.name ?? human.subject.name}
                    chips={chips}
                  />
                </div>
              </div>
              <SummaryLine text={humanSummary} />
              <p className="sec-label" style={{ marginTop: 24 }}>
                THE EVIDENCE
              </p>
              <div className="kg-axes" style={{ marginTop: 12 }}>
                <div className={`kg-axis ${item?.coverage.composition === "covered" ? "covered" : "not_covered"}`}>
                  <div className="axis-label">
                    <span className="dot" aria-hidden />
                    Composition, {item?.coverage.composition === "covered" ? "covered" : "not covered"}
                  </div>
                  <div
                    style={{
                      height: 110,
                      background: "var(--kg-paper-2)",
                      borderRadius: 8,
                      margin: "10px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    INGREDIENT PANEL
                  </div>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    {item?.conflicts[0]?.evidence ?? human.axes.composition.detail}
                  </p>
                </div>
                <div className={`kg-axis ${item?.coverage.preparation === "covered" ? "covered" : "not_covered"}`}>
                  <div className="axis-label">
                    <span className="dot" aria-hidden />
                    Preparation, {item?.coverage.preparation === "covered" ? "covered" : "not covered"}
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: 13 }}>{human.axes.preparation.detail}</p>
                </div>
                <div className="kg-axis covered">
                  <div className="axis-label">
                    <span className="dot" aria-hidden />
                    Threshold, sodium
                  </div>
                  <div
                    style={{
                      height: 72,
                      background: "var(--kg-paper-2)",
                      borderRadius: 8,
                      margin: "10px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    NUTRITION PANEL
                  </div>
                  <p style={{ margin: 0, fontSize: 13 }}>{thresholdDetail}</p>
                </div>
              </div>
              <SourceLine
                kind="label"
                name={item?.source?.name ?? human.source.name}
                read_at={
                  item?.source ? formatReadDate(item.source.read_date) : human.source.read_at
                }
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
                <button type="button" className="kg-btn">
                  Save this record to share
                </button>
                <button type="button" className="kg-btn quiet">
                  Check something else
                </button>
              </div>
              <div className="kg-callout" style={{ marginTop: 16 }}>
                <strong>Saving is the only thing that writes anything down.</strong>
                <p>
                  Until you press it, this check exists only on your screen. Save it and you get a dated link
                  anyone can re-check, that is the one exception to nothing stored.
                </p>
              </div>
            </div>
          ) : null}

          {showAgentResult ? (
            <div>
              {load === "loading" ? (
                <p style={{ color: "var(--kg-ink2)" }}>Ruling the venue against the live chart…</p>
              ) : null}
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
                  ? `${itemTotal - notable.length} more items ruled. ${placeCounts.no_conflict_found} no conflict found, ${placeCounts.ask_one_question} ask one question, ${placeCounts.conflict_found} conflict found, ${placeCounts.couldnt_verify} couldn't verify.`
                  : agent.more_line}
              </p>
              <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
                <button type="button" className="kg-btn">
                  Save this record to share
                </button>
                <button type="button" className="kg-btn quiet">
                  Change the premise
                </button>
              </div>
              <div className="kg-callout" style={{ marginTop: 16 }}>
                <strong>The agent ruled nothing. It asked, and it is showing you what came back.</strong>
                <p>
                  It cannot raise a verdict, answer a question on your behalf, or save this without you.
                </p>
              </div>
            </div>
          ) : null}

          {step < 4 && mode === "human" ? <EmptyLanding step={step} /> : null}
          {mode === "agent" && step < 3 ? <EmptyLanding step={step} agent /> : null}
        </div>
      </div>
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
            Agent mode. Waiting for your agent to call set_restrictions and load_subject.
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
