import "server-only";

import {
  checkItem,
  checkPlace,
  createFreeze,
  getFreeze,
  getLabel,
  KnownGateApiError,
} from "./api.ts";
import {
  ContractError,
  parseCheckItemRequest,
  parseCheckPlaceRequest,
  parseFreezeRequest,
} from "./validation.ts";

const HOP_REQUEST = new Set([
  // never let a caller supply the site header; the proxy sets it itself
  "x-knowngate-site",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

const HOP_RESPONSE = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  // fetch may decompress; do not claim compressed length/encoding to the client
  "content-encoding",
  "content-length",
]);

function isMockMode(): boolean {
  if (process.env.KNOWNGATE_MOCK !== undefined) return process.env.KNOWNGATE_MOCK === "1";
  return !process.env.KNOWNGATE_API_BASE;
}

function joinUpstreamPath(base: string, pathParts: string[], search: string): string {
  const suffix = pathParts.map((part) => encodeURIComponent(part)).join("/");
  return `${base.replace(/\/$/, "")}/${suffix}${search}`;
}

function forwardRequestHeaders(request: Request): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (HOP_REQUEST.has(key.toLowerCase())) return;
    headers.set(key, value);
  });
  // The API gates its checking routes behind a key or this header. It is what
  // keeps knowngate.com itself keyless: the site is the caller, not the agent.
  // A caller cannot set it themselves, because the inbound copy is dropped
  // above before this is written.
  const siteSecret = process.env.KNOWNGATE_SITE_SECRET;
  if (siteSecret) headers.set("x-knowngate-site", siteSecret);
  return headers;
}

function forwardResponseHeaders(upstream: Response, pathParts: string[]): Headers {
  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (HOP_RESPONSE.has(key.toLowerCase())) return;
    headers.set(key, value);
  });
  const contentType = headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream") || pathParts[0] === "mcp") {
    headers.set("cache-control", "no-cache, no-transform");
    headers.set("x-accel-buffering", "no");
  }
  return headers;
}

/** Live path: stream the upstream Response body through unchanged (SSE / MCP safe). */
async function liveProxy(request: Request, pathParts: string[]): Promise<Response> {
  const base = process.env.KNOWNGATE_API_BASE;
  if (!base) {
    return Response.json(
      { error: { code: "not_configured", message: "Live KnownGate API is not configured" } },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const target = joinUpstreamPath(base, pathParts, url.search);
  const method = request.method.toUpperCase();
  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers: forwardRequestHeaders(request),
    cache: "no-store",
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return Response.json(
      {
        error: {
          code: "upstream_unavailable",
          message: "KnownGate could not reach its evidence service",
        },
      },
      { status: 502 },
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: forwardResponseHeaders(upstream, pathParts),
  });
}

async function readJsonBody(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new ContractError("Request body must be valid JSON", "invalid_json");
  }
}

function mockError(error: unknown): Response {
  if (error instanceof ContractError) {
    return Response.json(error.toBody(), {
      status: error.code === "payload_too_large" ? 413 : 400,
    });
  }
  if (error instanceof KnownGateApiError) {
    return Response.json(error.body, { status: error.status });
  }
  return Response.json(
    { error: { code: "internal_error", message: "KnownGate could not complete the request" } },
    { status: 500 },
  );
}

/**
 * Fixture fallback when KNOWNGATE_MOCK=1 or KNOWNGATE_API_BASE is unset.
 * Live mode never enters here — the wildcard forwards every path intact.
 */
async function mockProxy(request: Request, pathParts: string[]): Promise<Response> {
  const method = request.method.toUpperCase();
  const joined = pathParts.join("/");

  try {
    if (method === "POST" && (joined === "check_item" || joined === "check/item")) {
      return Response.json(await checkItem(parseCheckItemRequest(await readJsonBody(request))));
    }
    if (
      method === "POST" &&
      (joined === "check_venue" || joined === "check_place" || joined === "check/place")
    ) {
      return Response.json(await checkPlace(parseCheckPlaceRequest(await readJsonBody(request))));
    }
    if (method === "POST" && joined === "check_plan") {
      return Response.json(
        {
          error: {
            code: "not_available_in_mock",
            message: "check_plan requires the live KnownGate API",
          },
        },
        { status: 501 },
      );
    }
    if (method === "GET" && joined === "questions") {
      const { readFile } = await import("node:fs/promises");
      const path = await import("node:path");
      const questions = JSON.parse(
        await readFile(path.join(process.cwd(), "fixtures/design/questions.json"), "utf8"),
      ) as unknown[];
      return Response.json({ count: questions.length, questions });
    }
    if (method === "GET" && joined === "stats") {
      const { readFile } = await import("node:fs/promises");
      const path = await import("node:path");
      const stats = JSON.parse(
        await readFile(path.join(process.cwd(), "fixtures/design/corpus.json"), "utf8"),
      );
      return Response.json(stats);
    }
    if (method === "POST" && joined === "mcp") {
      const body = (await readJsonBody(request)) as { id?: unknown; method?: string };
      if (body.method === "initialize") {
        return Response.json({
          jsonrpc: "2.0",
          id: body.id ?? null,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "knowngate-mock", version: "0" },
          },
        });
      }
      return Response.json({
        jsonrpc: "2.0",
        id: body.id ?? null,
        error: { code: -32601, message: "Method not found in mock MCP" },
      });
    }
    if (method === "GET" && pathParts[0] === "label" && pathParts[1]) {
      const label = await getLabel(pathParts[1]);
      if (!label) {
        return Response.json(
          { error: { code: "not_found", message: "Label not found" } },
          { status: 404 },
        );
      }
      return Response.json(label);
    }
    if (method === "POST" && joined === "freeze") {
      return Response.json(await createFreeze(parseFreezeRequest(await readJsonBody(request))));
    }
    if (method === "GET" && pathParts[0] === "freeze" && pathParts[1]) {
      const frozen = await getFreeze(pathParts[1]);
      if (!frozen) {
        return Response.json(
          { error: { code: "not_found", message: "Frozen check not found" } },
          { status: 404 },
        );
      }
      return Response.json(frozen);
    }

    return Response.json(
      {
        error: {
          code: "not_configured",
          message: `No mock for /${joined}; set KNOWNGATE_API_BASE for live proxy`,
        },
      },
      { status: 503 },
    );
  } catch (error) {
    return mockError(error);
  }
}

export async function proxyKnownGate(request: Request, pathParts: string[]): Promise<Response> {
  if (!pathParts.length) {
    return Response.json(
      { error: { code: "not_found", message: "KnownGate v0 path required" } },
      { status: 404 },
    );
  }
  return isMockMode() ? mockProxy(request, pathParts) : liveProxy(request, pathParts);
}
