import { evidenceStandardProfile } from "@/lib/kg/evidence-standard";

/**
 * The standard as a document something can build against, at a stable url.
 * Same object the page renders from, so the prose and the profile cannot
 * disagree about a ceiling or a rule.
 */
export function GET() {
  return Response.json(evidenceStandardProfile(), {
    headers: {
      // Public, cacheable, and revalidated often enough that a new version is
      // never more than an hour stale for anyone building against it.
      "cache-control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
    },
  });
}
