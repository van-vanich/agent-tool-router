import type { AgentTool, ModelDecision, Policy, PolicyOptions, RouterAction } from "./types.js";

const DEFAULT_OPTIONS: Required<PolicyOptions> = {
  minConfidence: 0.7,
  minWriteConfidence: 0.85,
  clarificationThreshold: 0.7,
  sideEffectThreshold: 0.55,
  requireConfirmationForSideEffects: true,
  fallbackToolId: "ask_user",
};

export const defaultPolicy = createPolicy();

export function createPolicy(options: PolicyOptions = {}): Policy {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return function evaluatePolicy(decision: ModelDecision, tools: AgentTool[]): RouterAction {
    const selectedTool = tools.find((tool) => tool.id === decision.toolId);
    const flags = decision.flags || {};

    if (!selectedTool) {
      return {
        type: "deny",
        reason: `The model selected an unregistered tool: ${decision.toolId}`,
      };
    }

    if ((flags.needsClarification ?? 0) >= config.clarificationThreshold) {
      return {
        type: "clarify",
        reason: "The request needs more detail before a tool can be selected safely.",
      };
    }

    if (decision.toolId === "answer_directly") {
      return {
        type: "answer_directly",
        reason: "The request can be answered without a tool.",
      };
    }

    if (decision.toolId === config.fallbackToolId) {
      return {
        type: "clarify",
        reason: "The router selected the configured clarification fallback.",
      };
    }

    const confidenceThreshold =
      selectedTool.kind === "write" || selectedTool.sideEffects
        ? config.minWriteConfidence
        : config.minConfidence;

    if (decision.confidence < confidenceThreshold) {
      return {
        type: "clarify",
        reason: `Tool confidence ${formatProbability(decision.confidence)} is below the required ${formatProbability(confidenceThreshold)}.`,
      };
    }

    const mayAffectOutsideWorld =
      selectedTool.requiresConfirmation ||
      selectedTool.risk === "high" ||
      selectedTool.sideEffects ||
      (flags.modifiesExternalState ?? 0) >= config.sideEffectThreshold;

    if (config.requireConfirmationForSideEffects && mayAffectOutsideWorld) {
      return {
        type: "confirm",
        toolId: selectedTool.id,
        tool: selectedTool,
        reason: "The selected tool may modify external state or affect another person.",
      };
    }

    return {
      type: "execute",
      toolId: selectedTool.id,
      tool: selectedTool,
      reason: "The selected tool passed confidence and policy checks.",
    };
  };
}

function formatProbability(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "unknown";
}
