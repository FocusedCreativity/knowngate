import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFreeze, getLabel, KnownGateApiError } from "@/lib/knowngate/api";
import type { FrozenCheck, ItemResult, LabelResult, PlaceResult } from "@/lib/knowngate/contracts";
import { questionText } from "@/lib/knowngate/contracts";
import { isFreezeId } from "@/lib/knowngate/validation";
import { formatReadDate, summarizeItem } from "@/lib/kg/live-map";
import { MustNotOmit, SourceLine } from "@/components/kg/primitives";
import { ResultEvidence } from "@/components/kg/result-evidence";
import { RecordActions } from "@/components/kg/record-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved record · KnownGate",
  description: "A frozen check, with its sources and the dates they were read.",
};

async function load(id: string): Promise<{ frozen?: FrozenCheck; missing?: boolean }> {
  try {
    const frozen = await getFreeze(id);
    return frozen ? { frozen } : { missing: true };
  } catch (error) {
    return { missing: error instanceof KnownGateApiError && error.status === 404 };
  }
}

function isItem(result: FrozenCheck["payload"]["results"][number]): result is ItemResult {
  return "verdict" in result;
}

function venueTotal(r: PlaceResult): number {
  const c = r.verdict_counts;
  return c.no_conflict + c.conflict + c.ask_one_question + c.cannot_verify;
}

/**
 * What the chart state means, in words. It used to print the raw state, so a
 * venue we could not find read as "none found" with nothing else on the page,
 * which tells a reader neither what was looked for nor what it means.
 */
function chartLine(r: PlaceResult): string {
  const total = venueTotal(r);
  if (r.chart === "none_found") {
    return "No published allergen chart was found for this venue, so nothing here was ruled. That is not a clear and not a conflict: it means the evidence to answer does not exist where we can read it.";
  }
  if (r.chart === "published_not_machine_readable") {
    return "This venue publishes allergen information, but not in a form that can be read and ruled on. Ask the venue directly.";
  }
  if (!total) {
    return "The chart was read, but it listed no items to rule against.";
  }
  const c = r.verdict_counts;
  return `${total} items ruled against the published chart: ${c.no_conflict} clear, ${c.conflict} conflict found, ${c.ask_one_question} ask one question, ${c.cannot_verify} couldn't verify.`;
}

/**
 * The premise as the banner states it. The frozen payload carries the
 * restrictions; the numeric limits live in the hits the ruling produced, so
 * they are read back from there. Without them a record that turned on a
 * sodium limit would state only the allergens and understate what was ruled.
 */
function premiseLine(frozen: FrozenCheck): string {
  const parts = frozen.payload.premise.restrictions.map((r) => r.note ?? r.key);
  const seen = new Set<string>();
  for (const result of frozen.payload.results) {
    if (!isItem(result)) continue;
    for (const hit of result.threshold_hits ?? []) {
      if (typeof hit.max !== "number" && typeof hit.min !== "number") continue;
      const bound = typeof hit.max === "number" ? `under ${hit.max}` : `at least ${hit.min}`;
      const basis = hit.basis ? ` ${hit.basis.replace(/_/g, " ")}` : "";
      const line = `${hit.nutrient} ${bound} ${hit.unit}${basis}`;
      if (seen.has(line)) continue;
      seen.add(line);
      parts.push(line);
    }
  }
  return parts.length ? parts.join(" · ") : "no restrictions set";
}

export default async function FrozenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isFreezeId(id)) notFound();
  const result = await load(id);
  if (result.missing) notFound();
  if (!result.frozen) return <Unavailable />;
  const frozen = result.frozen;
  const results = frozen.payload.results;

  // The panels come from the label, exactly as they do in the workspace, so a
  // record shows the photograph and the numbers rather than empty frames.
  const labels = await Promise.all(
    results.map(async (r) => {
      if (!isItem(r) || !r.label_url) return null;
      try {
        return (await getLabel(r.label_url.replace(/^\/label\//, ""))) as LabelResult | null;
      } catch {
        return null;
      }
    }),
  );

  const frozenOn = formatReadDate(frozen.frozen_at.slice(0, 10));

  return (
    <div className="kg-record">
      {/*
        The workspace's premise bar, in record dress: no Change button, because
        a frozen record cannot be edited, and the freeze stamp in its place.
      */}
      <div className="kg-subbar is-record">
        <div className="kg-subbar-inner">
          <span className="kg-eyebrow">SAVED RECORD</span>
          <strong>{premiseLine(frozen)}</strong>
          <span className="kg-subbar-right">
            Frozen {frozenOn} · {frozen.ck_id}
          </span>
        </div>
      </div>

      <div className="kg-record-body">
        {results.map((r, i) =>
          isItem(r) ? (
            <ResultEvidence key={i} item={r} label={labels[i]} />
          ) : (
            <section key={i} className="kg-record-place">
              <h2>{r.venue?.name || "This venue"}</h2>
              <p className="kg-summary">{chartLine(r)}</p>
              <MustNotOmit items={r.must_not_omit ?? []} />
              {r.caveat ? (
                <div className="kg-must-not-omit">
                  <ul>
                    <li>
                      <span className="mno-label">MUST NOT OMIT:</span> {r.caveat.text}
                    </li>
                  </ul>
                </div>
              ) : null}
              {venueTotal(r) ? (
                <div className="kg-chip-row" style={{ margin: "16px 0" }}>
                  <span className="chip on">{r.verdict_counts.no_conflict} clear</span>
                  <span className="chip">{r.verdict_counts.ask_one_question} ask one question</span>
                  <span className="chip">{r.verdict_counts.conflict} conflict found</span>
                  <span className="chip">{r.verdict_counts.cannot_verify} couldn&rsquo;t verify</span>
                </div>
              ) : null}
              {r.notable?.length ? (
                <>
                  <p className="sec-label" style={{ marginTop: 20 }}>
                    WHAT IT ASKED
                  </p>
                  {r.notable.map((n, j) => (
                    <article key={j} className="kg-record-notable">
                      <div className="name">{n.subject?.name ?? n.subject?.value ?? "An item"}</div>
                      <p>{questionText(n.question) ?? summarizeItem(n)}</p>
                      {n.source ? (
                        <p className="kg-source">
                          {n.source.name} · read on {formatReadDate(n.source.read_date)}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </>
              ) : null}
              {r.source ? (
                <SourceLine
                  kind="chart"
                  name={r.source.name}
                  read_at={formatReadDate(r.source.read_date)}
                />
              ) : null}
            </section>
          ),
        )}

        <RecordActions rerunHref="/check" />

        <div className="kg-callout kg-record-note">
          <strong>This is a saved record, frozen on {frozenOn}.</strong>
          <p>
            The ruling above is what KnownGate found on that date, from the sources and dates shown.
            Food changes between batches; running the check again always rules fresh. This link is
            the one thing KnownGate stores, and its owner can delete it.
          </p>
        </div>
      </div>
    </div>
  );
}

function Unavailable() {
  return (
    <div className="kg-record">
      <div className="kg-record-body">
        <p className="kg-eyebrow">COULDN&rsquo;T VERIFY</p>
        <h1>This record could not be reached.</h1>
        <p>
          It could not be loaded from the evidence service, so no finding is shown. Nothing here is
          a ruling; try the link again.
        </p>
      </div>
    </div>
  );
}
