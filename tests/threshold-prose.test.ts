import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  describeThresholdHit,
  summarizeItem,
  summarizeThresholdHit,
  thresholdBreached,
} from "../src/lib/kg/live-map.ts";

const over = {
  nutrient: "sodium",
  found: 780,
  unit: "mg",
  basis: "per_serving",
  max: 200,
  verdict: "conflict_found" as const,
};

const under = { ...over, found: 190, max: 600, verdict: "no_conflict_found" as const };

test("a number above its limit reads as over, never as under", () => {
  assert.equal(thresholdBreached(over), true);
  assert.equal(describeThresholdHit(over), "780 mg per serving, over the 200 mg limit.");
  assert.equal(summarizeThresholdHit(over), "The sodium limit is exceeded.");
});

test("a number below its limit reads as under", () => {
  assert.equal(thresholdBreached(under), false);
  assert.equal(describeThresholdHit(under), "190 mg per serving, under the 600 mg limit.");
  assert.equal(summarizeThresholdHit(under), "The sodium limit is met.");
});

test("a missing figure says so rather than claiming the limit was cleared", () => {
  const absent = { ...over, found: null, verdict: "couldnt_verify" as const };
  assert.equal(thresholdBreached(absent), false);
  assert.match(describeThresholdHit(absent), /could not be checked/);
  assert.equal(summarizeThresholdHit(absent), "The sodium limit could not be checked.");
});

test("a minimum is breached from below", () => {
  const belowMin = {
    nutrient: "fibre",
    found: 2,
    unit: "g",
    basis: "per_serving",
    min: 5,
    verdict: "conflict_found" as const,
  };
  assert.equal(thresholdBreached(belowMin), true);
  assert.equal(describeThresholdHit(belowMin), "2 g per serving, over the 5 g minimum.");
});

test("a named conflict opens its sentence in upper case and agrees in number", () => {
  const one = {
    verdict: "conflict_found" as const,
    conflicts: [{ restriction: "peanut", evidence: "" }],
  };
  assert.equal(
    summarizeItem(one as never),
    "Conflict found. Peanut is present on the evidence.",
  );
  const two = {
    verdict: "conflict_found" as const,
    conflicts: [
      { restriction: "peanut", evidence: "" },
      { restriction: "milk", evidence: "" },
    ],
  };
  assert.equal(
    summarizeItem(two as never),
    "Conflict found. Peanut, milk are present on the evidence.",
  );
});
