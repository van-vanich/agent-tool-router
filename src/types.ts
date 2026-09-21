export type ToolKind = "read" | "compute" | "write" | "external" | "fallback";
export type ToolRisk = "low" | "medium" | "high";

export interface AgentTool<Input = unknown, Output = unknown> {
  id: string;
  description: string;
  kind?: ToolKind;
  risk?: ToolRisk;
  sideEffects?: boolean;
  requiresConfirmation?: boolean;
  permissions?: string[];
  inputSchema?: unknown;
  examples?: string[];
  metadata?: Record<string, unknown>;
  execute?: (input: Input) => Promise<Output> | Output;
}

export interface PublicToolDescription {
  id: string;
  description: string;
  kind?: ToolKind;
  risk?: ToolRisk;
  sideEffects?: boolean;
  requiresConfirmation?: boolean;
  permissions?: string[];
  examples?: string[];
}

export interface RouteInput {
  userMessage: string;
  conversationSummary?: string;
  currentGoal?: string;
  constraints?: string[];
  recentToolResults?: unknown[];
  metadata?: Record<string, unknown>;
}

export interface DecisionFlags {
  needsTool?: number;
  needsClarification?: number;
  modifiesExternalState?: number;
  containsSensitiveData?: number;
  riskLevel?: number;
}

export interface ModelDecision {
  toolId: string;
  confidence: number;
  probabilities?: Record<string, number>;
  flags?: DecisionFlags;
  raw?: unknown;
}

export interface DecisionModel {
  decide(input: {
    input: RouteInput;
    tools: AgentTool[];
  }): Promise<ModelDecision>;
}

export type RouterAction =
  | { type: "execute"; toolId: string; tool: AgentTool; reason: string }
  | { type: "confirm"; toolId: string; tool: AgentTool; reason: string }
  | { type: "clarify"; reason: string }
  | { type: "answer_directly"; reason: string }
  | { type: "deny"; reason: string };

export interface RouteResult {
  action: RouterAction;
  decision: ModelDecision;
  tool?: AgentTool | undefined;
  latencyMs: number;
}

export interface RouterDecisionEvent {
  input: RouteInput;
  tools: AgentTool[];
  decision: ModelDecision;
  action: RouterAction;
  tool?: AgentTool | undefined;
  latencyMs: number;
}

export interface PolicyOptions {
  minConfidence?: number;
  minWriteConfidence?: number;
  clarificationThreshold?: number;
  sideEffectThreshold?: number;
  requireConfirmationForSideEffects?: boolean;
  fallbackToolId?: string;
}

export type Policy = (decision: ModelDecision, tools: AgentTool[]) => RouterAction;

export interface Router {
  route(input: { input: RouteInput; tools: AgentTool[] }): Promise<RouteResult>;
  evaluate(decision: ModelDecision, tools: AgentTool[]): RouterAction;
}

export type ToolExecutor<Input = unknown, Output = unknown> = (input: Input) => Promise<Output> | Output;
export type ToolExecutors = Record<string, ToolExecutor>;

export interface ExecuteApprovedActionOptions<Input = unknown> {
  input?: Input;
  executors?: ToolExecutors;
}
