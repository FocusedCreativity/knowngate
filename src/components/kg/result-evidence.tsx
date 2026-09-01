import type { ItemResult, LabelResult, PlaceResult } from "@/lib/knowngate/contracts";
import type { DesignVerdict } from "@/lib/kg/types";
import {
  compositionDetail,
  describeThresholdHit,
  formatReadDate,
  preparationDetail,
  summarizeItem,
  summarizeThresholdHit,
  thresholdBreached,
  toDesignVerdict,
} from "@/lib/kg/live-map";
import { MustNotOmit, SourceLine, SummaryLine, VerdictCard } from "./primitives";
import { IngredientPanel, NutritionPanelTable, PackShot } from "./label-panels";

/**
 * The ruling and its evidence, exactly as the workspace draws it. A frozen
 * record shows the same block so that what someone was handed is what they
 * were shown, down to the wording.
 */
export function ResultEvidence({
  item,
  label,
}: {
  item: ItemResult;
  label: LabelResult | null;
}) {
  const subject = item.subject.name || item.subject.value;
  const hit = item.threshold_hits?.find((h) => h.found !== null || h.max != null) ?? null;
  const chips = [
    ...item.conflicts.map((c) => c.restriction),
    item.source?.name ?? "label",
    item.source ? `read ${formatReadDate(item.source.read_date)}` : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <PackShot src={label?.image_url ?? null} gtin={label?.gtin ?? null} alt={subject} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <VerdictCard verdict={toDesignVerdict(item.verdict)} subject={subject} chips={chips} />
        </div>
      </div>
      <SummaryLine
        text={[summarizeItem(item), hit ? summarizeThresholdHit(hit) : null]
          .filter(Boolean)
          .join(" ")}
      />
      {/* Records are read by exactly the people these lines protect, so they
          travel with the ruling and stay labelled. */}
      <MustNotOmit items={item.must_not_omit ?? []} />
      <p className="sec-label" style={{ marginTop: 24 }}>
        THE EVIDENCE
      </p>
      <div className="kg-axes" style={{ marginTop: 12 }}>
        <div className={`kg-axis ${item.coverage.composition === "covered" ? "covered" : "not_covered"}`}>
          <div className="axis-label">
            <span className="dot" aria-hidden />
            Composition, {item.coverage.composition === "covered" ? "covered" : "not covered"}
          </div>
          <IngredientPanel label={label} />
          <p style={{ margin: "10px 0 0", fontSize: 13 }}>{compositionDetail(item)}</p>
        </div>
        <div className={`kg-axis ${item.coverage.preparation === "covered" ? "covered" : "not_covered"}`}>
          <div className="axis-label">
            <span className="dot" aria-hidden />
            Preparation, {item.coverage.preparation === "covered" ? "covered" : "not covered"}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 13 }}>{preparationDetail(item)}</p>
        </div>
        {/* No limit in the premise means no limit panel, here as in the
            workspace: a panel implies a number was ruled against. */}
        {hit ? (
          <div className={`kg-axis ${thresholdBreached(hit) ? "not_covered" : "covered"}`}>
            <div className="axis-label">
              <span className="dot" aria-hidden />
              Threshold, {hit.nutrient}
            </div>
            <NutritionPanelTable nutrition={label?.nutrition ?? null} highlight={hit.nutrient} />
            <p style={{ margin: "10px 0 0", fontSize: 13 }}>{describeThresholdHit(hit)}</p>
          </div>
        ) : null}
      </div>
      <SourceLine
        kind="label"
        name={item.source?.name ?? "label"}
        read_at={item.source ? formatReadDate(item.source.read_date) : ""}
      />
    </>
  );
}

/**
 * The venue's outcome in the same visual language as a product's.
 *
 * A record is the artifact somebody hands to a school or a sitter, and a menu
 * ruling was arriving as a paragraph while a product ruling arrived as a
 * certificate. The four verdicts already carry a colour, a dot and a weight
 * that a reader learns once; a venue outcome maps onto them rather than
 * inventing a quieter vocabulary of its own.
 */
function venueVerdict(r: PlaceResult): DesignVerdict {
  const c = r.verdict_counts;
  const total = c.no_conflict + c.conflict + c.ask_one_question + c.cannot_verify;
  if (r.chart !== "ruled" || !total) return "couldnt_verify";
  if (c.conflict > 0) return "conflict_found";
  if (c.ask_one_question > 0) return "ask_one_question";
  if (c.no_conflict > 0) return "no_conflict_found";
  return "couldnt_verify";
}

const COUNT_BANDS = [
  { key: "no_conflict", label: "clear", cls: "no_conflict_found" },
  { key: "conflict", label: "conflict found", cls: "conflict_found" },
  { key: "ask_one_question", label: "ask one question", cls: "ask_one_question" },
  { key: "cannot_verify", label: "couldn't verify", cls: "couldnt_verify" },
] as const;

/**
 * The counts as proportion, not as four numbers. With 368 items, "12 ask" and
 * "368 ask" read the same in a chip row and could not be less alike.
 */
export function VenueCounts({ counts }: { counts: PlaceResult["verdict_counts"] }) {
  const total = COUNT_BANDS.reduce((n, b) => n + counts[b.key], 0);
  if (!total) return null;
  return (
    <div className="kg-venue-counts">
      <div className="kg-venue-bar" role="img" aria-label={`${total} items ruled`}>
        {COUNT_BANDS.filter((b) => counts[b.key] > 0).map((b) => (
          <span
            key={b.key}
            className={`band ${b.cls}`}
            style={{ width: `${(counts[b.key] / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="kg-venue-legend">
        {COUNT_BANDS.map((b) => (
          <li key={b.key} className={counts[b.key] ? undefined : "is-zero"}>
            <span className={`dot ${b.cls}`} aria-hidden />
            <strong>{counts[b.key]}</strong> {b.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The whole venue block: the ruling, what it means, and what it asked. */
export function PlaceEvidence({ result, chartLine }: { result: PlaceResult; chartLine: string }) {
  const chips = [
    result.source?.name,
    result.source ? `read ${formatReadDate(result.source.read_date)}` : null,
  ].filter(Boolean) as string[];
  return (
    <>
      <VerdictCard
        verdict={venueVerdict(result)}
        subject={result.venue?.name || "This venue"}
        chips={chips}
      />
      <SummaryLine text={chartLine} />
      <MustNotOmit items={result.must_not_omit ?? []} />
      {/* The venue's own caveat travels with the ruling, labelled, because it
          is the line the people this protects most need to read. */}
      {result.caveat ? (
        <div className="kg-must-not-omit">
          <ul>
            <li>
              <span className="mno-label">MUST NOT OMIT:</span> {result.caveat.text}
            </li>
          </ul>
        </div>
      ) : null}
      <VenueCounts counts={result.verdict_counts} />
    </>
  );
}
