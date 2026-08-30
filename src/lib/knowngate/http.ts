import { NextResponse } from "next/server";

import { KnownGateApiError } from "./api.ts";
import { ContractError } from "./validation.ts";

export const MAX_REQUEST_BYTES = 16 * 1024;

export async function readJson(request: Request): Promise<unknown> {
  const announced = Number(request.headers.get("content-length") ?? 0);
  if (announced > MAX_REQUEST_BYTES) throw new ContractError("Request body is too large", "payload_too_large");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) throw new ContractError("Request body is too large", "payload_too_large");
  try { return JSON.parse(raw); }
  catch { throw new ContractError("Request body must be valid JSON", "invalid_json"); }
}

export function routeError(error: unknown): NextResponse {
  if (error instanceof ContractError) return NextResponse.json(error.toBody(), { status: error.code === "payload_too_large" ? 413 : 400 });
  if (error instanceof KnownGateApiError) return NextResponse.json(error.body, { status: error.status });
  return NextResponse.json({ error: { code: "internal_error", message: "KnownGate could not complete the request" } }, { status: 500 });
}
