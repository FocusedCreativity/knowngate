"use client";
import { useState } from "react";
import { knownGateClient } from "@/lib/knowngate/client";
import type { ItemResult, Restriction } from "@/lib/knowngate/contracts";
import { useWebMcpTools } from "@/lib/webmcp/use-webmcp-tools";
import { restrictionsSchema } from "@/lib/webmcp/schemas";

export function EvidenceCheckIsland({ subject }: { subject: { kind: "upc" | "menu_item"; value: string; venue?: string } }) {
  const [result, setResult] = useState<ItemResult | null>(null);
  async function check(restrictions: Restriction[]) { const next = await knownGateClient.checkItem({ restrictions, subject }); setResult(next); return next; }
  useWebMcpTools([
    { name: "get_label_facts", description: "Read the sourced evidence shown on this page.", inputSchema: { type: "object", properties: {} }, annotations: { readOnlyHint: true }, async execute() { return { subject }; } },
    { name: "check_here", description: "Rule this page's subject against restrictions for this call.", inputSchema: { type: "object", required: ["restrictions"], properties: { restrictions: restrictionsSchema } }, async execute(input) { try { const findings = await check((input as { restrictions: Restriction[] }).restrictions); return findings; } catch (error) { return { error: { code: "invalid_input", message: error instanceof Error ? error.message : "Could not check this subject." } }; } } },
  ]);
  return <section className="panel evidence-island"><p className="step">CHECK THIS EVIDENCE</p><p>WebMCP tools are available when supported; restrictions are per-call and never retained here.</p>{result && <><p className={`verdict verdict-${result.verdict}`}>{result.verdict.replaceAll("_", " ")}</p><p className="source">SOURCE / {result.source ? `${result.source.name} / READ ${result.source.read_date}` : "Source unavailable"}</p></>}</section>;
}
