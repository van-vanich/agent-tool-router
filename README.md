# @van-vanich/agent-tool-router

A TypeScript tool-decision SDK for AI agents.

**Jev selects. Policy permits. Your agent executes.**

The SDK sits between an AI agent and its tools. The agent passes the current turn, conversation context, and the tools it supports. A decision model chooses the best next tool, then deterministic policy code decides whether the agent may execute it, must ask for confirmation, needs clarification, should answer directly, or must deny the action.

## Install

```bash
npm install @van-vanich/agent-tool-router
```

For local development in this repository:

```bash
npm install
npm test
npm run demo
npm run test:live
```

The demo uses `MockDecisionModel` by default, so it runs without an API key.

## Basic Usage

```ts
import { createRouter, defineTool, JevDecisionModel } from "@van-vanich/agent-tool-router";

const router = createRouter({
  model: new JevDecisionModel(),
  onDecision(event) {
    console.log(event.decision.toolId, event.action.type, event.latencyMs);
  },
});

const tools = [
  defineTool({
    id: "search_web",
    description: "Search the public web for fresh information.",
    kind: "read",
    risk: "low",
  }),
  defineTool({
    id: "send_email",
    description: "Send an email to an external recipient.",
    kind: "write",
    risk: "high",
    sideEffects: true,
    requiresConfirmation: true,
  }),
];

const result = await router.route({
  input: {
    userMessage: "Find the latest pricing and email it to the customer.",
    conversationSummary: "The user is building a customer support agent.",
  },
  tools,
});

switch (result.action.type) {
  case "execute":
    await agent.callTool(result.action.toolId);
    break;
  case "confirm":
    await agent.askForConfirmation(result.action.reason);
    break;
  case "clarify":
    await agent.askUser(result.action.reason);
    break;
  case "answer_directly":
    await agent.answerWithoutTool();
    break;
  case "deny":
    await agent.refuse(result.action.reason);
    break;
}
```

## Optional Execution Helper

The router does not execute tools automatically. If you want a small boundary helper, use `executeApprovedAction`. It refuses anything except `action.type === "execute"`.

```ts
import { executeApprovedAction } from "@van-vanich/agent-tool-router";

const output = await executeApprovedAction(result, {
  input: { query: "TypeSafe AI pricing" },
  executors: {
    search_web: async ({ query }) => searchWeb(query),
  },
});
```

For tools with an inline `execute` function, the helper can use `result.action.tool.execute` directly.

## Tools Are Not Hardcoded

The SDK does not own a global tool list. Each agent passes its own tools for each route call.

```ts
defineTool({
  id: "stripe_refund",
  description: "Issue a refund in Stripe.",
  kind: "external",
  risk: "high",
  sideEffects: true,
  requiresConfirmation: true,
  permissions: ["billing:refund"],
});
```

Optional presets live in a separate export and only provide metadata:

```ts
import { commonTools } from "@van-vanich/agent-tool-router/presets";

const tools = [
  commonTools.answerDirectly(),
  commonTools.askUser(),
  commonTools.searchWeb(),
  commonTools.sendEmail(),
];
```

## Use Real Jev

```bash
export TYPESAFE_API_KEY=your-key
export TYPESAFE_MODEL=jev-latest
USE_TYPESAFE=1 npm run demo
npm run test:live
```

`JevDecisionModel` dynamically imports `@typesafe-ai/sdk`, asks closed structured questions, and normalizes the response into a `ModelDecision`.

`npm run test:live` skips cleanly when `TYPESAFE_API_KEY` is not set.

## Agent Integration Example

Run a host-agent style example:

```bash
npm run build
node examples/custom-agent.mjs
```

It demonstrates:

- router decision
- policy action
- optional execution helper
- confirmation/clarification branches
- `onDecision` observability events

## Architecture

```text
Agent turn
  -> createRouter().route(...)
  -> DecisionModel decides best registered tool
  -> Policy evaluates confidence, clarification, side effects, and risk
  -> Agent receives action and executes or asks the user
```

Core pieces:

- `defineTool` - normalizes tool metadata and validates ids/descriptions.
- `createRouter` - calls a decision model and applies policy.
- `JevDecisionModel` - adapter for TypeSafe AI/System One Jev models.
- `MockDecisionModel` - deterministic local adapter for tests and demos.
- `createPolicy` - deterministic safety gate for confidence, risk, side effects, and clarification.
- `executeApprovedAction` - optional helper that only executes already-approved actions.
- `onDecision` - observability hook for decisions, actions, latency, and selected tool.

The SDK deliberately does not execute tools by default. It returns an action, and the host agent decides how to run the actual tool implementation.
