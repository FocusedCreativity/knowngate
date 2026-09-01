import type { ItemResult, LabelResult } from "@/lib/knowngate/contracts";
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
