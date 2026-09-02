/**
 * Which proxied requests may carry the site credential.
 *
 * Deliberately not marked server-only: it holds no secret, only the decision,
 * so the unit tests can import it directly.
 *
 * The upstream accepts x-knowngate-site in place of an API key, so whatever
 * the proxy stamps it onto is effectively keyless for the whole internet. This
 * module is the single place that decides when it is stamped: only on the
 * routes the site's own pages call, only for a same-origin browser request,
 * and never when the caller already presents a key of their own.
 *
 * A script can still imitate a browser by forging the fetch-metadata headers;
 * no header check stops that. What this closes is the wide-open case (any
 * caller, any path, any method) and cross-site abuse from other web pages.
 * The remaining script case is bounded upstream, where site-header traffic is
 * quota'd per client address rather than per key.
 */

export type SiteRoute = { method: "GET" | "POST"; match: (parts: string[]) => boolean };

const exact = (path: string) => (parts: string[]) => parts.join("/") === path;
const oneUnder = (head: string) => (parts: string[]) => parts.length === 2 && parts[0] === head && parts[1] !== "";

/** Routes the site's own UI calls that the upstream gates behind a key. */
export const SITE_ROUTES: readonly SiteRoute[] = [
  { method: "POST", match: exact("check_item") },
  { method: "POST", match: exact("check_venue") },
  { method: "POST", match: exact("check_place") },
  { method: "POST", match: exact("premise/parse") },
  { method: "POST", match: exact("freeze") },
  { method: "GET", match: oneUnder("freeze") },
  { method: "GET", match: oneUnder("label") },
];

/** Methods the proxy forwards at all. Nothing on the site writes with PUT, PATCH or DELETE. */
export const FORWARDED_METHODS = new Set(["GET", "POST", "HEAD", "OPTIONS"]);

/**
 * Request headers that reach the upstream. Everything else, cookies included,
 * stops here. `mcp-*` headers pass so MCP sessions keep working.
 */
export const FORWARDED_REQUEST_HEADERS = new Set([
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "last-event-id",
  "user-agent",
]);

export function isSiteRoute(method: string, parts: string[]): boolean {
  const m = method.toUpperCase();
  return SITE_ROUTES.some((route) => route.method === m && route.match(parts));
}

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * True only for a request a browser made from a page on this same host.
 * Browsers set Sec-Fetch-Site themselves and pages cannot override it; when it
 * says anything but same-origin, another site is driving the call.
 */
export function isSameOriginBrowserRequest(request: Request): boolean {
  const host = hostOf(request.url);
  if (!host) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== "same-origin") return false;
  const origin = hostOf(request.headers.get("origin"));
  if (origin && origin !== host) return false;
  const referer = hostOf(request.headers.get("referer"));
  if (referer && referer !== host) return false;
  return true;
}

/**
 * Whether to stamp the site credential on this request.
 * A caller presenting their own key is metered on that key, never on the site.
 */
export function shouldAttachSiteHeader(request: Request, parts: string[]): boolean {
  if (!isSiteRoute(request.method, parts)) return false;
  if (request.headers.has("authorization")) return false;
  return isSameOriginBrowserRequest(request);
}
