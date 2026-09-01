import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFreeze, getLabel, KnownGateApiError } from "@/lib/knowngate/api";
import type { FrozenCheck, ItemResult, LabelResult } from "@/lib/knowngate/contracts";
import { isFreezeId } from "@/lib/knowngate/validation";
import { formatReadDate } from "@/lib/kg/live-map";
import { MustNotOmit } from "@/components/kg/primitives";
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

/** The premise as the banner states it, in the household's own terms. */
function premiseLine(frozen: FrozenCheck): string {
  const parts = frozen.payload.premise.restrictions.map((r) => r.note ?? r.key);
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
        <span className="kg-eyebrow">SAVED RECORD</span>
        <strong>{premiseLine(frozen)}</strong>
        <span className="kg-subbar-right">
          Frozen {frozenOn} · {frozen.ck_id}
        </span>
      </div>

      <div className="kg-record-body">
        {results.map((r, i) =>
          isItem(r) ? (
            <ResultEvidence key={i} item={r} label={labels[i]} />
          ) : (
            <section key={i} className="kg-record-place">
              <h2>{r.venue.name}</h2>
              <p className="kg-summary">{r.chart.replaceAll("_", " ")}</p>
              {r.source ? (
                <p className="kg-source">
                  {r.source.name} · read on {formatReadDate(r.source.read_date)}
                </p>
              ) : null}
              <MustNotOmit items={r.must_not_omit ?? []} />
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
