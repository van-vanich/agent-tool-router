import assert from "node:assert/strict";
import test from "node:test";
import { executeApprovedAction } from "../dist/index.js";
import { commonTools } from "../dist/presets.js";

test("executes only approved execute actions", async () => {
  const tool = commonTools.searchWeb();
  const result = {
    action: {
      type: "execute",
      toolId: "search_web",
      tool,
      reason: "ok",
    },
    decision: { toolId: "search_web", confidence: 0.9 },
    tool,
    latencyMs: 1,
  };

  const output = await executeApprovedAction(result, {
    input: { query: "docs" },
    executors: {
      search_web: async ({ query }) => ({ query, ok: true }),
    },
  });

  assert.deepEqual(output, { query: "docs", ok: true });
});

test("refuses confirmation actions", async () => {
  const tool = commonTools.sendEmail();
  const result = {
    action: {
      type: "confirm",
      toolId: "send_email",
      tool,
      reason: "needs confirmation",
    },
    decision: { toolId: "send_email", confidence: 0.9 },
    tool,
    latencyMs: 1,
  };

  await assert.rejects(() => executeApprovedAction(result), /Refusing to execute/);
});
