"use client";
import { useEffect, useRef } from "react";

export type RegisteredTool = { name: string; description: string; inputSchema: Record<string, unknown>; annotations?: { readOnlyHint?: boolean }; execute: (input: unknown, client: { requestUserInteraction?: (options?: unknown) => Promise<unknown> }) => Promise<unknown> };

/**
 * Registers this page's tools with the browser's model context, where one
 * exists.
 *
 * Everything here is defensive on purpose. This is the one code path that
 * runs only inside an agent's browser, which is exactly the environment we
 * cannot open a console in, and every implementation of it is young. A
 * registration that throws synchronously, returns something that is not a
 * promise, or rejects on a shape it dislikes must cost us the tools and
 * nothing else: a person reading a verdict should never lose the page
 * because an agent API misbehaved.
 */
export function useWebMcpTools(tools: RegisteredTool[]) {
  const toolsRef = useRef(tools);
  useEffect(() => { toolsRef.current = tools; }, [tools]);
  useEffect(() => {
    let controller: AbortController | null = null;
    try {
      if (typeof document.modelContext?.registerTool !== "function") return;
      controller = new AbortController();
      for (const tool of toolsRef.current) {
        try {
          // May throw rather than reject, and may not return a promise at all.
          const registered = document.modelContext.registerTool(tool, { signal: controller.signal });
          if (registered && typeof (registered as Promise<unknown>).catch === "function") {
            void (registered as Promise<unknown>).catch(() => undefined);
          }
        } catch {
          // This tool did not register. The others still can, and the page
          // does not depend on any of them.
        }
      }
    } catch {
      // No model context we can use. The DOM path in the agent directions is
      // the one that always works, and it is unaffected.
      return;
    }
    return () => {
      try {
        controller?.abort();
      } catch {
        // Nothing to undo.
      }
    };
  }, []);
}
