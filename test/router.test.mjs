import assert from "node:assert/strict";
import test from "node:test";
import { createRouter, MockDecisionModel } from "../dist/index.js";
import { commonTools } from "../dist/presets.js";

const tools = [
  commonTools.answerDirectly(),
  commonTools.askUser(),
  commonTools.searchWeb(),
  commonTools.runCode(),
  commonTools.sendEmail(),
];

test("routes through the model and evaluates policy", async () => {
  const router = createRouter({
    model: new MockDecisionModel({
      decisions: {
        "Look this up": {
          toolId: "search_web",
          confidence: 0.9,
          flags: { needsClarification: 0.1, modifiesExternalState: 0.02 },
        },
      },
    }),
  });

  const result = await router.route({
    input: { userMessage: "Look this up" },
    tools,
  });

  assert.equal(result.action.type, "execute");
  assert.equal(result.action.toolId, "search_web");
  assert.equal(result.decision.toolId, "search_web");
});

test("mock model can route common outbound requests to confirmation", async () => {
  const router = createRouter();
  const result = await router.route({
    input: { userMessage: "Send an email to the customer" },
    tools,
  });

  assert.equal(result.action.type, "confirm");
  assert.equal(result.action.toolId, "send_email");
});
