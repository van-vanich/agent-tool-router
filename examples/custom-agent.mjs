import { createRouter, executeApprovedAction } from "../dist/index.js";
import { commonTools } from "../dist/presets.js";

const events = [];

const router = createRouter({
  onDecision(event) {
    events.push({
      message: event.input.userMessage,
      action: event.action.type,
      tool: event.decision.toolId,
      confidence: event.decision.confidence,
      latencyMs: event.latencyMs,
    });
  },
});

const tools = [
  commonTools.answerDirectly(),
  commonTools.askUser(),
  commonTools.searchWeb(),
  commonTools.sendEmail({
    execute: async ({ recipient, body }) => ({
      id: "email_dry_run_001",
      recipient,
      body,
      delivered: false,
    }),
  }),
];

async function handleAgentTurn(userMessage) {
  const result = await router.route({
    input: {
      userMessage,
      conversationSummary: "A support agent can search the web, ask the user, answer directly, or send email.",
    },
    tools,
  });

  switch (result.action.type) {
    case "execute":
      return executeApprovedAction(result, {
        input: { query: userMessage },
        executors: {
          search_web: async ({ query }) => ({
            query,
            results: ["Example result from the host agent's search tool"],
          }),
        },
      });

    case "confirm":
      return {
        pendingConfirmation: true,
        toolId: result.action.toolId,
        reason: result.action.reason,
      };

    case "clarify":
      return {
        question: result.action.reason,
      };

    case "answer_directly":
      return {
        answer: "The host agent would answer from its current conversation context.",
      };

    case "deny":
      return {
        refusal: result.action.reason,
      };
  }
}

console.log(await handleAgentTurn("Find the latest TypeSafe AI pricing."));
console.log(await handleAgentTurn("Send an email to the customer."));
console.log(events);
