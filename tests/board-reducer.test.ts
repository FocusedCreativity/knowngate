import assert from "node:assert/strict";
import { test } from "node:test";
import { boardReducer, initialBoardState } from "../src/lib/board/reducer.ts";

const premise = { restrictions: [{ key: "peanut" as const }] };

test("blocks an out-of-order check and explains recovery", () => {
  const state = boardReducer(initialBoardState, { type: "startCheck", id: "1", kind: "item", label: "a product", eventId: "e1" });
  assert.equal(state.entries.length, 0);
  assert.match(state.activity[0].message, /Confirm/);
});

test("requires confirmation and clears rulings when the premise changes", () => {
  let state = boardReducer(initialBoardState, { type: "proposePremise", premise });
  assert.equal(state.premise.status, "proposed");
  state = boardReducer(state, { type: "confirmPremise", eventId: "e1" });
  state = boardReducer(state, { type: "startCheck", id: "1", kind: "item", label: "product", eventId: "e2" });
  state = boardReducer(state, { type: "proposePremise", premise: { restrictions: [{ key: "sesame" }] } });
  assert.equal(state.entries.length, 1);
  state = boardReducer(state, { type: "confirmPremise", eventId: "e3" });
  assert.equal(state.entries.length, 0);
});

test("keeps prior successes when a later request fails", () => {
  let state = boardReducer(initialBoardState, { type: "proposePremise", premise });
  state = boardReducer(state, { type: "confirmPremise", eventId: "e1" });
  state = boardReducer(state, { type: "startCheck", id: "1", kind: "item", label: "first", eventId: "e2" });
  state = boardReducer(state, { type: "completeCheck", id: "1", eventId: "e3", result: { verdict: "no_conflict", subject: { kind: "product_query", value: "rice" }, coverage: { composition: "covered", preparation: "covered" }, conflicts: [], unverified: [], question: null, source: { name: "fixture", url: null, read_date: "2026-08-30" }, caveat: null, label_url: null } });
  state = boardReducer(state, { type: "startCheck", id: "2", kind: "place", label: "later", eventId: "e4" });
  state = boardReducer(state, { type: "failCheck", id: "2", message: "network unavailable", eventId: "e5" });
  assert.equal(state.entries[0].status, "complete");
  assert.equal(state.entries[1].status, "error");
});
