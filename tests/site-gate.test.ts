import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FORWARDED_METHODS,
  isSameOriginBrowserRequest,
  isSiteRoute,
  shouldAttachSiteHeader,
} from "../src/lib/knowngate/site-gate.ts";

const ORIGIN = "https://www.knowngate.com";

function req(path: string, init: RequestInit & { headers?: Record<string, string> } = {}): Request {
  return new Request(`${ORIGIN}/api/knowngate/v0/${path}`, init);
}

const browser = {
  "sec-fetch-site": "same-origin",
  origin: ORIGIN,
  referer: `${ORIGIN}/check`,
};

test("only the site's own routes are site routes", () => {
  assert.equal(isSiteRoute("POST", ["check_item"]), true);
  assert.equal(isSiteRoute("POST", ["check_venue"]), true);
  assert.equal(isSiteRoute("POST", ["premise", "parse"]), true);
  assert.equal(isSiteRoute("POST", ["freeze"]), true);
  assert.equal(isSiteRoute("GET", ["freeze", "ck_abc"]), true);
  assert.equal(isSiteRoute("GET", ["label", "0078742119346"]), true);

  assert.equal(isSiteRoute("POST", ["mcp"]), false, "agents bring their own key to MCP");
  assert.equal(isSiteRoute("POST", ["check_plan"]), false, "the site never calls check_plan");
  assert.equal(isSiteRoute("POST", ["keys"]), false);
  assert.equal(isSiteRoute("GET", ["check_item"]), false, "method is part of the match");
  assert.equal(isSiteRoute("GET", ["freeze"]), false);
  assert.equal(isSiteRoute("GET", ["freeze", "ck_abc", "extra"]), false);
});

test("a same-origin browser call on a site route gets the site header", () => {
  assert.equal(shouldAttachSiteHeader(req("check_item", { method: "POST", headers: browser }), ["check_item"]), true);
});

test("a bare script call gets nothing", () => {
  const r = req("check_item", { method: "POST" });
  assert.equal(isSameOriginBrowserRequest(r), false);
  assert.equal(shouldAttachSiteHeader(r, ["check_item"]), false);
});

test("a call from another web page gets nothing", () => {
  const crossSite = req("check_item", {
    method: "POST",
    headers: { "sec-fetch-site": "cross-site", origin: "https://evil.example" },
  });
  assert.equal(shouldAttachSiteHeader(crossSite, ["check_item"]), false);

  const spoofedFetchSite = req("check_item", {
    method: "POST",
    headers: { "sec-fetch-site": "same-origin", origin: "https://evil.example" },
  });
  assert.equal(shouldAttachSiteHeader(spoofedFetchSite, ["check_item"]), false, "origin must match too");
});

test("a caller with their own key is metered on that key, never on the site", () => {
  const keyed = req("check_item", { method: "POST", headers: { ...browser, authorization: "Bearer kg_live_x" } });
  assert.equal(shouldAttachSiteHeader(keyed, ["check_item"]), false);
});

test("a same-origin browser call on a non-site route still gets nothing", () => {
  assert.equal(shouldAttachSiteHeader(req("mcp", { method: "POST", headers: browser }), ["mcp"]), false);
  assert.equal(shouldAttachSiteHeader(req("check_plan", { method: "POST", headers: browser }), ["check_plan"]), false);
});

test("writes other than POST are not forwarded at all", () => {
  for (const m of ["GET", "POST", "HEAD", "OPTIONS"]) assert.equal(FORWARDED_METHODS.has(m), true, m);
  for (const m of ["PUT", "PATCH", "DELETE"]) assert.equal(FORWARDED_METHODS.has(m), false, m);
});
