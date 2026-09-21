import assert from "node:assert/strict";
import { createRouter, JevDecisionModel } from "../dist/index.js";
import { commonTools } from "../dist/presets.js";

if (!process.env.TYPESAFE_API_KEY) {
  console.log("Skipping live Jev test: TYPESAFE_API_KEY is not set.");
  process.exit(0);
}

const router = createRouter({
  model: new JevDecisionModel(),
});

const result = await router.route({
  input: {
    userMessage: "Find the latest TypeSafe AI pricing.",
    conversationSummary: "The user is testing a tool router SDK with a web search tool available.",
  },
  tools: [
    commonTools.answerDirectly(),
    commonTools.askUser(),
    commonTools.searchWeb(),
    commonTools.runCode(),
  ],
});

assert.equal(result.decision.toolId, "search_web");
assert.equal(result.action.type, "execute");
assert.ok(result.decision.confidence > 0.5);

console.log({
  action: result.action.type,
  toolId: result.decision.toolId,
  confidence: result.decision.confidence,
});
