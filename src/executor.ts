import type { ExecuteApprovedActionOptions, RouteResult } from "./types.js";

export async function executeApprovedAction<Input = unknown, Output = unknown>(
  result: RouteResult,
  options: ExecuteApprovedActionOptions<Input> = {},
): Promise<Output> {
  if (result.action.type !== "execute") {
    throw new Error(`Refusing to execute action of type "${result.action.type}".`);
  }

  const executor = options.executors?.[result.action.toolId] || result.action.tool.execute;

  if (!executor) {
    throw new Error(`No executor registered for tool: ${result.action.toolId}`);
  }

  return executor(options.input) as Promise<Output>;
}
