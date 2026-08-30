type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: unknown, client: { requestUserInteraction?: (options?: unknown) => Promise<unknown> }) => Promise<unknown>;
};

interface Document {
  modelContext?: {
    registerTool?: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<unknown>;
  };
}
