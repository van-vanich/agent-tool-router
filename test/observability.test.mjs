import assert from "node:assert/strict";
import test from "node:test";
import { createRouter, MockDecisionModel } from "../dist/index.js";
import { commonTools } from "../dist/presets.js";

test("calls onDecision with route details", async () => {
  const events = [];
  const router = createRouter({
    model: new MockDecisionModel({
      decisions: {
        "Look this up": {
          toolId: "search_web",
          confidence: 0.91,
          flags: { needsClarification: 0.1, modifiesExternalState: 0.01 },
        },
      },
    }),
    onDecision(event) {
      events.push(event);
    },
  });

  const result = await router.route({
    input: { userMessage: "Look this up" },
    tools: [commonTools.askUser(), commonTools.searchWeb()],
  });

  assert.equal(result.action.type, "execute");
  assert.equal(events.length, 1);
  assert.equal(events[0].decision.toolId, "search_web");
  assert.equal(events[0].action.type, "execute");
  assert.equal(events[0].input.userMessage, "Look this up");
  assert.equal(events[0].tools.length, 2);
});
