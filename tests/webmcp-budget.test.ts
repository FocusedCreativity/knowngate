import assert from "node:assert/strict";
import { test } from "node:test";
import { TOOL_BUDGETS, TOOL_MANIFEST } from "../src/lib/webmcp/manifest.ts";

test("declares exactly seven page-appropriate WebMCP tools within budgets", () => {
  assert.equal(TOOL_MANIFEST.length, 7);
  assert.equal(new Set(TOOL_MANIFEST.map((tool) => tool.name)).size, 7);
  for (const tool of TOOL_MANIFEST) assert.ok(tool.name.length <= TOOL_BUDGETS.name);
  assert.deepEqual(TOOL_MANIFEST.filter((tool) => tool.page === "ruling-room").map((tool) => tool.name), ["propose_premise", "check_item", "check_place", "get_board", "freeze_check"]);
});
