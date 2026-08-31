import type { CheckItemRequest, CheckPlaceRequest, FreezeCreated, FreezeRequest, ItemResult, PlaceResult } from "./contracts.ts";
import { normalizeItemResult, normalizePlaceResult } from "./normalize.ts";

export class KnownGateClientError extends Error {
  constructor(readonly code: string, message: string, readonly missing?: string) {
    super(message);
    this.name = "KnownGateClientError";
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = await response.json();
  if (!response.ok) {
    const error = body?.error;
    throw new KnownGateClientError(error?.code ?? "request_failed", error?.message ?? "KnownGate request failed", error?.missing);
  }
  return body;
}

export const knownGateClient = {
  checkItem: async (body: CheckItemRequest): Promise<ItemResult> =>
    normalizeItemResult(await request("/api/knowngate/v0/check_item", { method: "POST", body: JSON.stringify(body) })),
  checkPlace: async (body: CheckPlaceRequest): Promise<PlaceResult> =>
    normalizePlaceResult(await request("/api/knowngate/v0/check_venue", { method: "POST", body: JSON.stringify(body) })),
  freeze: (body: FreezeRequest) =>
    request("/api/knowngate/v0/freeze", { method: "POST", body: JSON.stringify(body) }) as Promise<FreezeCreated>,
};
