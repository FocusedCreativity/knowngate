import "server-only";

import type { ItemResult } from "@/lib/knowngate/contracts";
import { questionText } from "@/lib/knowngate/contracts";
import { normalizeItemResult, normalizePlaceResult } from "@/lib/knowngate/normalize";
import { toDesignVerdict, formatReadDate } from "@/lib/kg/live-map";
import type { DesignVerdict } from "@/lib/kg/types";
import { VERDICT_PROSE } from "@/lib/kg/types";

const SODIUM = {
  nutrient: "sodium",
  max: 600,
  unit: "mg",
  basis: "per_serving",
} as const;

export const LANDING_PRODUCTS = [
  {
    upc: "0001111004969",
    expectedName: "Kroger® 99% Fat Free Chicken Broth",
  },
  {
    upc: "0085170200717",
    expectedName: "Kettle & Fire Gluten Free Low Sodium Chicken Broth",
  },
  {
    // Made and packed in the store deli, so the no-panel story is structural
    // rather than a gap in our records.
    upc: "0001111006809",
    expectedName: "Simple Truth® Cold Deli Fresh Whole Rotisserie Chicken",
  },
] as const;

export type LandingProductCard = {
  upc: string;
  name: string;
  verdict: DesignVerdict;
  verdictLabel: string;
  detail: string;
  chips: string[];
  readDate: string | null;
};

export type LandingMenuCard = {
  venueName: string;
  premiseLine: string;
  itemCount: number;
  counts: {
    no_conflict_found: number;
    conflict_found: number;
    ask_one_question: number;
    couldnt_verify: number;
  };
  readDate: string | null;
  sourceName: string | null;
  /** Rendered with a visible label; a venue result's cross-contact caveat lives here. */
  mustNotOmit: string[];
  notable: Array<{
    name: string;
    verdict: DesignVerdict;
    verdictLabel: string;
    line: string;
  }>;
};

export type LandingExamples = {
  products: LandingProductCard[];
  menu: LandingMenuCard | null;
};

function apiBase(): string | null {
  if (process.env.KNOWNGATE_MOCK === "1") return null;
  const base = process.env.KNOWNGATE_API_BASE?.replace(/\/$/, "");
  return base || null;
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  // Prefer the private upstream when configured. Otherwise call the public
  // same-origin proxy on www so landing examples always carry real read dates
  // (local mock fixtures do not cover these UPCs).
  const base = apiBase();
  const url = base
    ? `${base}/${path}`
    : `https://www.knowngate.com/api/knowngate/v0/${path}`;
  // This path talks to the upstream directly rather than through the wildcard
  // proxy, so it has to carry the site header itself. Without it these calls
  // are just another unkeyed caller, and the examples degrade to couldn't
  // verify on the home page.
  const headers: Record<string, string> = { "content-type": "application/json" };
  const siteSecret = process.env.KNOWNGATE_SITE_SECRET;
  if (base && siteSecret) headers["x-knowngate-site"] = siteSecret;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`landing ${path} failed: ${res.status}`);
  return res.json();
}

function productDetail(result: ItemResult): string {
  const hit = result.threshold_hits?.find((h) => h.nutrient === "sodium");
  const design = toDesignVerdict(result.verdict);
  if (hit) {
    if (hit.found === null || hit.found === undefined) {
      return hit.reason ?? "No nutrition panel is on file for this subject.";
    }
    if (design === "conflict_found" && hit.max != null) {
      return `${hit.found} ${hit.unit} per serving, over the ${hit.max} ${hit.unit} limit.`;
    }
    return `${hit.found} ${hit.unit} per serving.`;
  }
  if (design === "couldnt_verify") {
    return "No nutrition panel is on file for this subject.";
  }
  return "";
}

function productChips(result: ItemResult): string[] {
  const hit = result.threshold_hits?.find((h) => h.nutrient === "sodium");
  const chips: string[] = [];
  if (hit && hit.found !== null && hit.found !== undefined) {
    chips.push(`sodium ${hit.found} ${hit.unit}`);
  } else {
    chips.push("no panel");
  }
  chips.push("panel");
  if (result.source?.read_date) {
    chips.push(`read ${formatReadDate(result.source.read_date)}`);
  }
  return chips;
}

function toProductCard(upc: string, fallbackName: string, result: ItemResult): LandingProductCard {
  const verdict = toDesignVerdict(result.verdict);
  return {
    upc,
    name: result.subject.name || fallbackName,
    verdict,
    verdictLabel: VERDICT_PROSE[verdict],
    detail: productDetail(result),
    chips: productChips(result),
    readDate: result.source?.read_date ? formatReadDate(result.source.read_date) : null,
  };
}

export async function loadLandingExamples(): Promise<LandingExamples> {
  const productBodies = LANDING_PRODUCTS.map((p) => ({
    restrictions: [] as { key: string }[],
    thresholds: [SODIUM],
    subject: { kind: "upc" as const, value: p.upc },
  }));

  const [rawProducts, rawVenue] = await Promise.all([
    Promise.all(
      productBodies.map(async (body) => {
        try {
          return normalizeItemResult(await postJson("check_item", body));
        } catch {
          return null;
        }
      }),
    ),
    (async () => {
      try {
        return normalizePlaceResult(
          await postJson("check_venue", {
            restrictions: [{ key: "milk" }],
            venue: { name: "Krystal" },
          }),
        );
      } catch {
        return null;
      }
    })(),
  ]);

  const products: LandingProductCard[] = LANDING_PRODUCTS.map((p, i) => {
    const result = rawProducts[i];
    if (!result) {
      return {
        upc: p.upc,
        name: p.expectedName,
        verdict: "couldnt_verify" as DesignVerdict,
        verdictLabel: VERDICT_PROSE.couldnt_verify,
        detail: "Live check unavailable right now.",
        chips: ["retry"],
        readDate: null,
      };
    }
    return toProductCard(p.upc, p.expectedName, result);
  });

  let menu: LandingMenuCard | null = null;
  if (rawVenue) {
    const counts = {
      no_conflict_found: rawVenue.verdict_counts.no_conflict,
      conflict_found: rawVenue.verdict_counts.conflict,
      ask_one_question: rawVenue.verdict_counts.ask_one_question,
      couldnt_verify: rawVenue.verdict_counts.cannot_verify,
    };
    const itemCount =
      counts.no_conflict_found +
      counts.conflict_found +
      counts.ask_one_question +
      counts.couldnt_verify;
    menu = {
      venueName: rawVenue.venue.name || "Krystal",
      premiseLine: "milk",
      itemCount,
      counts,
      readDate: rawVenue.source?.read_date ? formatReadDate(rawVenue.source.read_date) : null,
      sourceName: rawVenue.source?.name ?? null,
      mustNotOmit: rawVenue.must_not_omit ?? [],
      notable: rawVenue.notable.slice(0, 5).map((n) => {
        const verdict = toDesignVerdict(n.verdict);
        return {
          name: n.subject.name ?? n.subject.value,
          verdict,
          verdictLabel: VERDICT_PROSE[verdict],
          line: questionText(n.question) ?? "",
        };
      }),
    };
  }

  return { products, menu };
}
