"use client";

import { useState } from "react";
import type { LabelResult, NutritionPanel } from "@/lib/knowngate/contracts";

/**
 * The retailer's product photo. It is fetched from their CDN, so it can fail
 * for reasons that have nothing to do with the check: render the placeholder
 * again rather than a broken image, and never let it hold up the verdict.
 */
export function PackShot({
  src,
  gtin,
  alt,
  className = "kg-packshot",
}: {
  src: string | null;
  /** When known, the photo comes through our own origin instead. */
  gtin?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // Agentic browsers drop third-party image requests, so a same-origin url is
  // the difference between a reader seeing the pack and seeing a grey box.
  const href = gtin && /^\d{8,14}$/.test(gtin) ? `/api/label-image/${gtin}` : src;
  if (!href || failed) {
    return (
      <div className={`${className} is-empty`} aria-hidden>
        PACK SHOT
      </div>
    );
  }
  return (
    /* A retailer CDN URL, not an asset we host; next/image would proxy and
       re-encode someone else's photograph on every request. */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={href}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

type Row = { key: keyof NutritionPanel; label: string; unit: string; indent?: boolean };

/** FDA panel order, so the table reads the way the pack does. */
const ROWS: Row[] = [
  { key: "energy_kcal", label: "Calories", unit: "" },
  { key: "fat_g", label: "Total fat", unit: "g" },
  { key: "saturated_fat_g", label: "Saturated fat", unit: "g", indent: true },
  { key: "trans_fat_g", label: "Trans fat", unit: "g", indent: true },
  { key: "cholesterol_mg", label: "Cholesterol", unit: "mg" },
  { key: "sodium_mg", label: "Sodium", unit: "mg" },
  { key: "carbohydrate_g", label: "Total carbohydrate", unit: "g" },
  { key: "fiber_g", label: "Dietary fibre", unit: "g", indent: true },
  { key: "sugar_g", label: "Total sugars", unit: "g", indent: true },
  { key: "added_sugar_g", label: "Added sugars", unit: "g", indent: true },
  { key: "protein_g", label: "Protein", unit: "g" },
  { key: "vitamin_d_mcg", label: "Vitamin D", unit: "mcg" },
  { key: "calcium_mg", label: "Calcium", unit: "mg" },
  { key: "iron_mg", label: "Iron", unit: "mg" },
  { key: "potassium_mg", label: "Potassium", unit: "mg" },
];

function servingLine(n: NutritionPanel): string | null {
  if (n.serving_qty === null && !n.serving_unit) return null;
  const qty = n.serving_qty === null ? "" : `${n.serving_qty} `;
  return `Per ${qty}${n.serving_unit ?? "serving"}`.trim();
}

/**
 * The typed panel, printed as the pack states it. A row the pack does not
 * state is absent from the corpus and stays absent here; a blank would read
 * as a zero, which is a different claim.
 */
export function NutritionPanelTable({
  nutrition,
  highlight,
}: {
  nutrition: NutritionPanel | null;
  highlight?: string | null;
}) {
  if (!nutrition) {
    return (
      <p className="kg-panel-empty">
        No nutrition panel is on file for this pack, so there is no number to
        rule against.
      </p>
    );
  }
  const rows = ROWS.filter((r) => nutrition[r.key] !== null);
  if (!rows.length) {
    return (
      <p className="kg-panel-empty">
        No nutrition panel is on file for this pack, so there is no number to
        rule against.
      </p>
    );
  }
  const serving = servingLine(nutrition);
  return (
    <div className="kg-nutrition">
      {serving ? <p className="kg-nutrition-serving">{serving}</p> : null}
      <table>
        <tbody>
          {rows.map((r) => {
            // The ruled row is marked so the panel and the verdict are visibly
            // the same number rather than two numbers that happen to agree.
            const ruled = !!highlight && r.key === `${highlight}_mg`;
            return (
              <tr key={r.key} className={ruled ? "is-ruled" : undefined}>
                <th scope="row" className={r.indent ? "indent" : undefined}>
                  {r.label}
                </th>
                <td>
                  {nutrition[r.key]}
                  {r.unit ? ` ${r.unit}` : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The ingredient statement and the retailer's allergen line, both verbatim.
 * These are captured label text: quoting them exactly is the whole point, so
 * nothing here paraphrases, truncates or re-cases them.
 */
export function IngredientPanel({ label }: { label: LabelResult | null }) {
  if (!label?.ingredients_verbatim && !label?.allergens_description) {
    return (
      <p className="kg-panel-empty">
        No ingredient statement is on file for this pack.
      </p>
    );
  }
  return (
    <div className="kg-ingredients">
      {label.ingredients_verbatim ? (
        <p className="kg-ingredients-text">{label.ingredients_verbatim}</p>
      ) : (
        <p className="kg-panel-empty">
          No ingredient statement is on file for this pack.
        </p>
      )}
      {label.allergens_description ? (
        <p className="kg-ingredients-allergens">{label.allergens_description}</p>
      ) : null}
    </div>
  );
}
