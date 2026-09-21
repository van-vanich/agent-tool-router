import { toPublicDescription } from "../tools.js";
import type { AgentTool, DecisionModel, ModelDecision, RouteInput } from "../types.js";

declare const process: { env: Record<string, string | undefined> };

const DEFAULT_MODEL = "jev-latest";

interface JevDecisionModelOptions {
  model?: string;
  client?: {
    systemOne(input: unknown): Promise<Record<string, unknown>>;
  };
}

interface ChoiceAnswer {
  choice: string;
  confidence: number;
  probabilities?: Record<string, number>;
}

interface NoulAnswer {
  noul: number;
}

interface ScoreAnswer {
  score: number;
}

export class JevDecisionModel implements DecisionModel {
  private readonly model: string;
  private readonly client?: JevDecisionModelOptions["client"];

  constructor({
    model = process.env.TYPESAFE_MODEL || process.env.TYPESAFE_DEFAULT_MODEL || DEFAULT_MODEL,
    client,
  }: JevDecisionModelOptions = {}) {
    this.model = model;
    this.client = client;
  }

  async decide({ input, tools }: { input: RouteInput; tools: AgentTool[] }): Promise<ModelDecision> {
    const { choice, noul, score } = await import("@typesafe-ai/sdk");
    const client = this.client || (await createClient());
    const toolOptions = Object.fromEntries(
      tools.map((tool) => [tool.id, toJevToolDescription(tool)]),
    );

    const response = await client.systemOne({
      model: this.model,
      state: {
        ...input,
        tools: toolOptions,
        routerContract:
          "Select at most one registered tool for the next agent step. Prefer answer_directly when no tool is needed. Prefer ask_user when the user request is under-specified.",
      } as never,
      questions: {
        bestTool: choice("Which registered tool should the agent use next?", toolOptions as never),
        needsTool: noul("Does this turn require a tool call instead of answering directly?"),
        needsClarification: noul("Does the agent need clarification from the user before acting?"),
        modifiesExternalState: noul(
          "Would the selected next step modify external state, send a message, delete data, spend money, or affect another person?",
        ),
        containsSensitiveData: noul("Does the requested next step require handling sensitive or private data?"),
        riskLevel: score("How risky is executing the selected next step without more checks?", {
          0: "Read-only or conversational action with little downside.",
          1: "Uses private context, local execution, or reversible changes.",
          2: "External side effects, security impact, irreversible actions, or user-visible writes.",
        }),
      },
    });

    return normalizeJevResponse(response as unknown as Record<string, unknown>);
  }
}

function toJevToolDescription(tool: AgentTool): Record<string, string | boolean | string[]> {
  const description = toPublicDescription(tool);
  return Object.fromEntries(
    Object.entries(description).filter(([, value]) => value !== undefined),
  ) as Record<string, string | boolean | string[]>;
}

function normalizeJevResponse(response: Record<string, unknown>): ModelDecision {
  const answers = response.answers as Record<string, unknown>;
  const bestTool = answers.bestTool as ChoiceAnswer;
  const needsTool = answers.needsTool as NoulAnswer;
  const needsClarification = answers.needsClarification as NoulAnswer;
  const modifiesExternalState = answers.modifiesExternalState as NoulAnswer;
  const containsSensitiveData = answers.containsSensitiveData as NoulAnswer;
  const riskLevel = answers.riskLevel as ScoreAnswer;

  const decision: ModelDecision = {
    toolId: bestTool.choice,
    confidence: bestTool.confidence,
    flags: {
      needsTool: needsTool.noul,
      needsClarification: needsClarification.noul,
      modifiesExternalState: modifiesExternalState.noul,
      containsSensitiveData: containsSensitiveData.noul,
      riskLevel: riskLevel.score,
    },
    raw: response,
  };

  if (bestTool.probabilities) {
    decision.probabilities = bestTool.probabilities;
  }

  return decision;
}

async function createClient() {
  const { TypeSafeClient } = await import("@typesafe-ai/sdk");
  return new TypeSafeClient();
}
