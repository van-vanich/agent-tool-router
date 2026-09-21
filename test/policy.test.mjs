import assert from "node:assert/strict";
import test from "node:test";
import { createPolicy } from "../dist/index.js";
import { commonTools } from "../dist/presets.js";

const tools = [
  commonTools.answerDirectly(),
  commonTools.askUser(),
  commonTools.searchWeb(),
  commonTools.sendEmail(),
];

test("allows confident read-only tools", () => {
  const policy = createPolicy();
  const action = policy(
    {
      toolId: "search_web",
      confidence: 0.92,
      flags: { needsClarification: 0.1, modifiesExternalState: 0.02 },
    },
    tools,
  );

  assert.equal(action.type, "execute");
  assert.equal(action.toolId, "search_web");
});

test("requires confirmation for high-risk side-effect tools", () => {
  const policy = createPolicy();
  const action = policy(
    {
      toolId: "send_email",
      confidence: 0.93,
      flags: { needsClarification: 0.1, modifiesExternalState: 0.96 },
    },
    tools,
  );

  assert.equal(action.type, "confirm");
  assert.equal(action.toolId, "send_email");
});

test("clarifies when confidence is below threshold", () => {
  const policy = createPolicy();
  const action = policy(
    {
      toolId: "search_web",
      confidence: 0.42,
      flags: { needsClarification: 0.1, modifiesExternalState: 0.02 },
    },
    tools,
  );

  assert.equal(action.type, "clarify");
});

test("denies unregistered tools", () => {
  const policy = createPolicy();
  const action = policy(
    {
      toolId: "invented_tool",
      confidence: 0.99,
      flags: {},
    },
    tools,
  );

  assert.equal(action.type, "deny");
});
