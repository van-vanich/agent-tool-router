import { createRouter, JevDecisionModel } from "../dist/index.js";
import { commonTools } from "../dist/presets.js";

const tools = [
  commonTools.answerDirectly(),
  commonTools.askUser(),
  commonTools.searchWeb(),
  commonTools.runCode(),
  commonTools.sendEmail(),
];

const router = createRouter({
  model: process.env.USE_TYPESAFE === "1" ? new JevDecisionModel() : undefined,
});

for (const userMessage of [
  "Find the latest TypeSafe AI pricing.",
  "Send an email to the customer saying the refund was approved.",
  "Explain what Jev is useful for from the context above.",
  "Run the tests and check whether the router logic works.",
]) {
  const result = await router.route({
    input: {
      userMessage,
      conversationSummary: "The user is designing an AI agent that chooses tools safely.",
    },
    tools,
  });

  console.log(`\nUser: ${userMessage}`);
  console.log(`Action: ${result.action.type}`);
  console.log(`Tool: ${result.action.toolId || result.tool?.id || "none"}`);
  console.log(`Confidence: ${result.decision.confidence.toFixed(2)}`);
  console.log(`Reason: ${result.action.reason}`);
}
