import { MockDecisionModel } from "./models/mock.js";
import { defaultPolicy } from "./policy.js";
import { defineTool } from "./tools.js";
import type {
  AgentTool,
  DecisionModel,
  ModelDecision,
  Policy,
  RouteResult,
  Router,
  RouterDecisionEvent,
} from "./types.js";

export interface CreateRouterOptions {
  model?: DecisionModel;
  policy?: Policy;
  onDecision?: (event: RouterDecisionEvent) => Promise<void> | void;
}

export function createRouter({
  model = new MockDecisionModel(),
  policy = defaultPolicy,
  onDecision,
}: CreateRouterOptions = {}): Router {
  return {
    async route({ input, tools }): Promise<RouteResult> {
      const normalizedTools = tools.map((tool) => defineTool(tool));
      const startedAt = Date.now();
      const decision = await model.decide({ input, tools: normalizedTools });
      const action = policy(decision, normalizedTools);
      const latencyMs = Date.now() - startedAt;
      const tool = normalizedTools.find((candidate) => candidate.id === decision.toolId);
      const result = {
        action,
        decision,
        tool,
        latencyMs,
      };

      await onDecision?.({
        input,
        tools: normalizedTools,
        decision,
        action,
        tool,
        latencyMs,
      });

      return result;
    },

    evaluate(decision: ModelDecision, tools: AgentTool[]) {
      return policy(
        decision,
        tools.map((tool) => defineTool(tool)),
      );
    },
  };
}
