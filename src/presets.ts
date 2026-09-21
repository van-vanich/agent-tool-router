import { defineTool } from "./tools.js";
import type { AgentTool } from "./types.js";

export const commonTools = {
  answerDirectly(overrides: Partial<AgentTool> = {}): AgentTool {
    return defineTool({
      id: "answer_directly",
      description: "Answer from current conversation context without calling an external tool.",
      kind: "fallback",
      risk: "low",
      ...overrides,
    });
  },

  askUser(overrides: Partial<AgentTool> = {}): AgentTool {
    return defineTool({
      id: "ask_user",
      description: "Ask the user for clarification before taking action.",
      kind: "fallback",
      risk: "low",
      ...overrides,
    });
  },

  searchWeb(overrides: Partial<AgentTool> = {}): AgentTool {
    return defineTool({
      id: "search_web",
      description: "Search the public web for fresh or external information.",
      kind: "read",
      risk: "low",
      ...overrides,
    });
  },

  runCode(overrides: Partial<AgentTool> = {}): AgentTool {
    return defineTool({
      id: "run_code",
      description: "Run local code, commands, tests, or scripts.",
      kind: "compute",
      risk: "medium",
      ...overrides,
    });
  },

  sendEmail(overrides: Partial<AgentTool> = {}): AgentTool {
    return defineTool({
      id: "send_email",
      description: "Send an email to an external recipient.",
      kind: "write",
      risk: "high",
      sideEffects: true,
      requiresConfirmation: true,
      ...overrides,
    });
  },
};
