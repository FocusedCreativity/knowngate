/**
 * The retailer's product photo, served from our own origin.
 *
 * Agentic browsers drop third-party image requests, so the pack shot was the
 * one part of a ruling that did not arrive for the reader who most needs the
 * whole thing in one place. This fetches it server-side and streams it back.
 *
 * It takes a GTIN, never a url. An image proxy that forwards whatever address
 * it is handed is a request-forgery hole pointed at our own network; the
 * upstream address is built here from digits we validated, so a caller cannot
 * choose where this goes.
 */
const UPSTREAM = (gtin: string) => `https://www.kroger.com/product/images/large/front/${gtin}`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gtin: string }> },
) {
  const { gtin } = await params;
  if (!/^\d{8,14}$/.test(gtin)) {
    return new Response("Not found", { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM(gtin), {
      headers: { accept: "image/avif,image/webp,image/jpeg,image/png,*/*" },
      // A slow retailer must not hold a request open behind a verdict.
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
  } catch {
    return new Response("Upstream image unavailable", { status: 502 });
  }

  const type = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !type.startsWith("image/")) {
    // The page falls back to its placeholder, which is the honest state:
    // we have no photograph, and nothing about the ruling changes.
    return new Response("No image on file", { status: 404 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": type,
      // Product photographs change rarely; this is the whole point of paying
      // the round trip once.
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "content-security-policy": "default-src 'none'; sandbox",
      "x-content-type-options": "nosniff",
    },
  });
}
