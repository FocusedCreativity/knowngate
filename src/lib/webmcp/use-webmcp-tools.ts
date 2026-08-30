"use client";
import { useEffect, useRef } from "react";

export type RegisteredTool = { name: string; description: string; inputSchema: Record<string, unknown>; annotations?: { readOnlyHint?: boolean }; execute: (input: unknown, client: { requestUserInteraction?: (options?: unknown) => Promise<unknown> }) => Promise<unknown> };

export function useWebMcpTools(tools: RegisteredTool[]) {
  const toolsRef = useRef(tools);
  useEffect(() => { toolsRef.current = tools; }, [tools]);
  useEffect(() => {
    if (typeof document.modelContext?.registerTool !== "function") return;
    const controller = new AbortController();
    for (const tool of toolsRef.current) {
      void document.modelContext.registerTool(tool, { signal: controller.signal }).catch(() => undefined);
    }
    return () => controller.abort();
  }, []);
}
