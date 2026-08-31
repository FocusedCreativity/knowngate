import "server-only";

import { randomBytes } from "node:crypto";

import type { CheckItemRequest, CheckPlaceRequest, FreezeCreated, FreezeRequest, FrozenCheck } from "./contracts.ts";
import { canonicalFrozen, fixtureItem, fixtureLabel, fixturePlace } from "./fixtures.ts";
import { parseFreezeCreated, parseFrozenCheck, parseItemResult, parseLabelResult, parsePlaceResult } from "./validation.ts";

const REQUEST_TIMEOUT_MS = 10_000;
const frozenStore = new Map<string, FrozenCheck>();

export class KnownGateApiError extends Error {
  constructor(readonly status: number, readonly body: unknown) {
    super("KnownGate API request failed");
    this.name = "KnownGateApiError";
  }
}

function isMockMode(): boolean {
  if (process.env.KNOWNGATE_MOCK !== undefined) return process.env.KNOWNGATE_MOCK === "1";
  return !process.env.KNOWNGATE_API_BASE;
}

async function liveRequest(path: string, init?: RequestInit): Promise<unknown> {
  const base = process.env.KNOWNGATE_API_BASE?.replace(/\/$/, "");
  if (!base) throw new KnownGateApiError(503, { error: { code: "not_configured", message: "Live KnownGate API is not configured" } });
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      // Server-side callers talk to the upstream directly, so they carry the
      // site header themselves; the wildcard proxy adds its own separately.
      headers: {
        "content-type": "application/json",
        ...(process.env.KNOWNGATE_SITE_SECRET
          ? { "x-knowngate-site": process.env.KNOWNGATE_SITE_SECRET }
          : {}),
        ...init?.headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new KnownGateApiError(502, { error: { code: "upstream_unavailable", message: "KnownGate could not reach its evidence service" } });
  }
  const body = await response.json().catch(() => ({ error: { code: "invalid_upstream_response", message: "KnownGate received an unreadable response" } }));
  if (!response.ok) throw new KnownGateApiError(response.status, body);
  return body;
}

export async function checkItem(request: CheckItemRequest) {
  return isMockMode() ? fixtureItem(request) : parseItemResult(await liveRequest("/check_item", { method: "POST", body: JSON.stringify(request) }));
}

export async function checkPlace(request: CheckPlaceRequest) {
  return isMockMode() ? fixturePlace(request) : parsePlaceResult(await liveRequest("/check_venue", { method: "POST", body: JSON.stringify(request) }));
}

export async function getLabel(gtin: string) {
  if (isMockMode()) return fixtureLabel(gtin);
  return parseLabelResult(await liveRequest(`/label/${encodeURIComponent(gtin)}`));
}

export async function createFreeze(payload: FreezeRequest): Promise<FreezeCreated> {
  if (!isMockMode()) return parseFreezeCreated(await liveRequest("/freeze", { method: "POST", body: JSON.stringify(payload) }));
  const ck_id = `ck_${randomBytes(10).toString("hex")}`;
  const frozen_at = new Date().toISOString();
  frozenStore.set(ck_id, { ck_id, payload, frozen_at });
  return { ck_id, url: `/ck/${ck_id}`, frozen_at };
}

export async function getFreeze(id: string): Promise<FrozenCheck | null> {
  if (!isMockMode()) {
    try { return parseFrozenCheck(await liveRequest(`/freeze/${encodeURIComponent(id)}`)); }
    catch (error) { if (error instanceof KnownGateApiError && error.status === 404) return null; throw error; }
  }
  const canonical = await canonicalFrozen();
  return id === canonical.ck_id ? canonical : frozenStore.get(id) ?? null;
}
