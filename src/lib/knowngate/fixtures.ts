import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { CheckItemRequest, CheckPlaceRequest, FrozenCheck } from "./contracts.ts";
import { parseFrozenCheck, parseItemResult, parseLabelResult, parsePlaceResult } from "./validation.ts";

async function readFixture(name: string): Promise<unknown> {
  const file = path.join(process.cwd(), "fixtures", name);
  return JSON.parse(await readFile(file, "utf8"));
}

export function selectItemFixture(request: CheckItemRequest): string {
  const value = `${request.subject.value} ${request.subject.venue ?? ""}`.toLowerCase();
  if (value.includes("amber") || value.includes("orange chicken")) return "item-amber.json";
  if (value.includes("unknown") || value.includes("cannot verify")) return "item-cannot-verify.json";
  if (value.includes("clear") || value.includes("rice")) return "item-clear.json";
  return "item-conflict.json";
}

export function selectPlaceFixture(request: CheckPlaceRequest): string {
  const value = `${request.venue.name} ${request.venue.location ?? ""}`.toLowerCase();
  if (value.includes("unreadable")) return "place-unreadable.json";
  if (value.includes("no chart") || value.includes("unknown")) return "place-none.json";
  return "place-ruled.json";
}

export async function fixtureItem(request: CheckItemRequest) {
  return parseItemResult(await readFixture(selectItemFixture(request)));
}

export async function fixturePlace(request: CheckPlaceRequest) {
  return parsePlaceResult(await readFixture(selectPlaceFixture(request)));
}

export async function fixtureLabel(gtin: string) {
  const label = parseLabelResult(await readFixture("label-product.json"));
  if (gtin !== label.gtin) return null;
  return label;
}

export async function canonicalFrozen(): Promise<FrozenCheck> {
  return parseFrozenCheck(await readFixture("frozen-check.json"));
}
