import type { AgentTool, PublicToolDescription } from "./types.js";

const TOOL_ID_PATTERN = /^[a-zA-Z0-9_.:-]+$/;

export function defineTool<Input = unknown, Output = unknown>(
  tool: AgentTool<Input, Output>,
): AgentTool<Input, Output> {
  validateTool(tool as AgentTool);

  return {
    kind: "compute",
    risk: "medium",
    sideEffects: false,
    requiresConfirmation: false,
    permissions: [],
    ...tool,
  };
}

export function createToolRegistry(initialTools: AgentTool[] = []) {
  const tools = new Map<string, AgentTool>();

  for (const tool of initialTools) {
    register(tool);
  }

  function register(tool: AgentTool): void {
    const normalized = defineTool(tool);
    if (tools.has(normalized.id)) {
      throw new Error(`Tool is already registered: ${normalized.id}`);
    }
    tools.set(normalized.id, normalized);
  }

  return {
    register,
    list(): AgentTool[] {
      return [...tools.values()];
    },
    get(id: string): AgentTool | undefined {
      return tools.get(id);
    },
    publicDescriptions(): PublicToolDescription[] {
      return [...tools.values()].map(toPublicDescription);
    },
  };
}

export function toPublicDescription(tool: AgentTool): PublicToolDescription {
  const description: PublicToolDescription = {
    id: tool.id,
    description: tool.description,
  };

  if (tool.kind !== undefined) description.kind = tool.kind;
  if (tool.risk !== undefined) description.risk = tool.risk;
  if (tool.sideEffects !== undefined) description.sideEffects = tool.sideEffects;
  if (tool.requiresConfirmation !== undefined) description.requiresConfirmation = tool.requiresConfirmation;
  if (tool.permissions !== undefined) description.permissions = tool.permissions;
  if (tool.examples !== undefined) description.examples = tool.examples;

  return description;
}

function validateTool(tool: AgentTool): void {
  if (!tool || typeof tool !== "object") {
    throw new TypeError("Tool must be an object.");
  }

  if (!tool.id || typeof tool.id !== "string") {
    throw new TypeError("Tool requires a string id.");
  }

  if (!TOOL_ID_PATTERN.test(tool.id)) {
    throw new TypeError(`Tool id contains unsupported characters: ${tool.id}`);
  }

  if (!tool.description || typeof tool.description !== "string") {
    throw new TypeError(`Tool ${tool.id} requires a string description.`);
  }
}
