import { strict as assert } from "node:assert";
import { test } from "node:test";

import { isEmptyPremise, normalizeParsed } from "../src/lib/kg/premise-parse.ts";

test("keeps a threshold that carries a real number", () => {
  const p = normalizeParsed({ thresholds: [{ nutrient: "sugar", max: 10, unit: "g" }] });
  assert.deepEqual(p.thresholds, [{ nutrient: "sugar", max: 10, unit: "g" }]);
});

test("drops a threshold with no number, so an unstated rule is never rendered", () => {
  const p = normalizeParsed({
    thresholds: [
      { nutrient: "sugar", unit: "g" },
      { nutrient: "salt", max: null, unit: "mg" },
      { nutrient: "fat", max: "low", unit: "g" },
    ],
  });
  assert.deepEqual(p.thresholds, []);
});

test("carries needs_number through for the person to fill in", () => {
  const p = normalizeParsed({ needs_number: [{ nutrient: "sugar", said: "we keep sugar low" }] });
  assert.deepEqual(p.needs_number, [{ nutrient: "sugar", said: "we keep sugar low" }]);
  assert.equal(isEmptyPremise(p), false);
});

test("rejects a subject with an unknown kind", () => {
  assert.equal(normalizeParsed({ subject: { kind: "guess", value: "x" } }).subject, null);
  assert.deepEqual(normalizeParsed({ subject: { kind: "upc", value: "0001111004969" } }).subject, {
    kind: "upc",
    value: "0001111004969",
  });
});

test("a response with nothing usable reads as empty", () => {
  assert.equal(isEmptyPremise(normalizeParsed({})), true);
  assert.equal(isEmptyPremise(normalizeParsed({ unparsed: ["for the school trip"] })), true);
});

test("survives a malformed body without throwing", () => {
  const p = normalizeParsed({ restrictions: "peanut", thresholds: null, needs_number: 7 });
  assert.deepEqual(p.restrictions, []);
  assert.deepEqual(p.thresholds, []);
  assert.deepEqual(p.needs_number, []);
});
