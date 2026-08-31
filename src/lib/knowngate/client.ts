import type { CheckItemRequest, CheckPlaceRequest, FreezeCreated, FreezeRequest, ItemResult, PlaceResult } from "./contracts.ts";

export class KnownGateClientError extends Error {
  constructor(readonly code: string, message: string, readonly missing?: string) {
    super(message);
    this.name = "KnownGateClientError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = await response.json();
  if (!response.ok) {
    const error = body?.error;
    throw new KnownGateClientError(error?.code ?? "request_failed", error?.message ?? "KnownGate request failed", error?.missing);
  }
  return body as T;
}

export const knownGateClient = {
  checkItem: (body: CheckItemRequest) => request<ItemResult>("/api/knowngate/v0/check_item", { method: "POST", body: JSON.stringify(body) }),
  checkPlace: (body: CheckPlaceRequest) => request<PlaceResult>("/api/knowngate/v0/check_venue", { method: "POST", body: JSON.stringify(body) }),
  freeze: (body: FreezeRequest) => request<FreezeCreated>("/api/knowngate/v0/freeze", { method: "POST", body: JSON.stringify(body) }),
};
