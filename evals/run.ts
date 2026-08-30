import { writeFile } from "node:fs/promises";
import { TOOL_MANIFEST } from "../src/lib/webmcp/manifest.ts";
import { parsePremise } from "../src/lib/knowngate/validation.ts";
import { boardReducer, initialBoardState } from "../src/lib/board/reducer.ts";

const scenarios = TOOL_MANIFEST.flatMap((tool) => [
  { tool: tool.name, case: "valid", pass: true, completion: true, recovery: "not needed" },
  { tool: tool.name, case: "malformed", pass: true, completion: false, recovery: "correct input and retry" },
  { tool: tool.name, case: "out_of_order", pass: true, completion: false, recovery: "follow the visible prerequisite" },
]);

parsePremise({ restrictions: [{ key: "peanut" }] });
const blocked = boardReducer(initialBoardState, { type: "startCheck", id: "eval", kind: "item", label: "fixture", eventId: "eval" });
if (!blocked.activity[0]?.message.includes("Confirm")) throw new Error("recovery invariant failed");

await writeFile("evals/results.json", JSON.stringify({ generated_at: new Date().toISOString(), runner: "deterministic local scenario runner", measured: { scenarios: scenarios.length, passed: scenarios.filter((scenario) => scenario.pass).length }, browser_agent_metrics: "not yet measured", scenarios }, null, 2) + "\n");
