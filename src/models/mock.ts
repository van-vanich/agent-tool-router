import type { AgentTool, DecisionModel, ModelDecision, RouteInput } from "../types.js";

export interface MockDecisionModelOptions {
  decisions?: Record<string, Partial<ModelDecision> & Pick<ModelDecision, "toolId">>;
}

export class MockDecisionModel implements DecisionModel {
  private readonly decisions: NonNullable<MockDecisionModelOptions["decisions"]>;

  constructor({ decisions = {} }: MockDecisionModelOptions = {}) {
    this.decisions = decisions;
  }

  async decide({ input, tools }: { input: RouteInput; tools: AgentTool[] }): Promise<ModelDecision> {
    const override = this.decisions[input.userMessage];
    if (override) {
      return normalizeDecision(override, tools);
    }

    const text = input.userMessage.toLowerCase();
    const toolIds = new Set(tools.map((tool) => tool.id));
    return normalizeDecision(pickTool(text, toolIds), tools);
  }
}

function normalizeDecision(decision: Partial<ModelDecision> & Pick<ModelDecision, "toolId">, tools: AgentTool[]): ModelDecision {
  const confidence = decision.confidence ?? 0.75;

  return {
    toolId: decision.toolId,
    confidence,
    probabilities:
      decision.probabilities ||
      Object.fromEntries(tools.map((tool) => [tool.id, tool.id === decision.toolId ? confidence : 0.01])),
    flags: {
      needsTool: 0.8,
      needsClarification: 0.1,
      modifiesExternalState: 0.05,
      containsSensitiveData: 0.1,
      ...(decision.flags || {}),
    },
    raw: decision.raw || { source: "mock" },
  };
}

function pickTool(text: string, toolIds: Set<string>): ModelDecision {
  if (matches(text, ["email", "send", "лист", "відправ"]) && toolIds.has("send_email")) {
    return {
      toolId: "send_email",
      confidence: 0.9,
      flags: { modifiesExternalState: 0.95 },
    };
  }

  if (
    matches(text, ["search", "latest", "current", "сьогодні", "новин", "знайди", "пошукай"]) &&
    toolIds.has("search_web")
  ) {
    return {
      toolId: "search_web",
      confidence: 0.86,
    };
  }

  if (
    matches(text, ["database", "db", "sql", "клієнт", "користувач", "замовлення"]) &&
    toolIds.has("read_database")
  ) {
    return {
      toolId: "read_database",
      confidence: 0.78,
      flags: { containsSensitiveData: 0.55 },
    };
  }

  if (matches(text, ["test", "run", "code", "файл", "репо", "перевір"]) && toolIds.has("run_code")) {
    return {
      toolId: "run_code",
      confidence: 0.81,
      flags: { modifiesExternalState: 0.25 },
    };
  }

  if (matches(text, ["що саме", "непонятно", "уточни", "clarify"]) && toolIds.has("ask_user")) {
    return {
      toolId: "ask_user",
      confidence: 0.92,
      flags: { needsClarification: 0.95 },
    };
  }

  return {
    toolId: toolIds.has("answer_directly") ? "answer_directly" : "ask_user",
    confidence: 0.74,
    flags: { needsTool: 0.2 },
  };
}

function matches(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}
