import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { compactItem, compactPlace, utf8Bytes } from "../src/lib/knowngate/compact.ts";
import { parseFrozenCheck, parseItemResult, parseLabelResult, parsePlaceResult } from "../src/lib/knowngate/validation.ts";

async function fixture(name: string): Promise<unknown> {
  return JSON.parse(await readFile(new URL(`../fixtures/${name}`, import.meta.url), "utf8"));
}

for (const name of ["item-conflict.json", "item-clear.json", "item-amber.json", "item-cannot-verify.json"]) {
  test(`validates ${name}`, async () => {
    const parsed = parseItemResult(await fixture(name));
    assert.ok(parsed.source.read_date);
    assert.ok(utf8Bytes(compactItem(parsed)) <= 1536);
  });
}

for (const name of ["place-ruled.json", "place-unreadable.json", "place-none.json"]) {
  test(`validates ${name}`, async () => {
    const parsed = parsePlaceResult(await fixture(name));
    assert.ok(parsed.source.read_date);
    assert.ok(utf8Bytes(compactPlace(parsed)) <= 1536);
  });
}

test("validates label and frozen fixtures", async () => {
  assert.equal(parseLabelResult(await fixture("label-product.json")).gtin, "0000822910553");
  assert.match(parseFrozenCheck(await fixture("frozen-check.json")).ck_id, /^ck_[a-z0-9]{16,32}$/);
});

test("rejects an invalid verdict", () => {
  assert.throws(() => parseItemResult({ verdict: "safe" }), /verdict is invalid/);
});
