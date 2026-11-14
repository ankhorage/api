import type { InternalRestApiDefinition } from "@ankhorage/contracts/data";
import { expect, test } from "bun:test";

import { composeAuthorizedApiRuntime } from "./composeAuthorizedApiRuntime.js";
import { createApiRuntime } from "./createApiRuntime.js";
import { resolveApiOperationBindings } from "./resolveApiOperationBindings.js";

const DEFINITION = {
  id: "example",
  origin: "internal",
  protocol: "rest",
  basePath: "/api/",
  endpoints: {
    workspace: {
      id: "workspace",
      kind: "http",
      path: "/workspaces/",
      operations: {
        "workspace.load": {
          id: "workspace.load",
          endpointId: "workspace",
          protocol: "http",
          intent: "read",
          path: "/:id",
        },
      },
    },
  },
} satisfies InternalRestApiDefinition;

test("resolves normalized bindings and dispatches registered handlers", async () => {
  const runtime = createApiRuntime({
    definition: DEFINITION,
    handlers: { "workspace.load": () => ({ body: { loaded: true } }) },
  });

  expect(resolveApiOperationBindings(DEFINITION)).toMatchObject([
    {
      operationId: "workspace.load",
      method: "GET",
      path: "/api/workspaces/:id",
    },
  ]);
  expect(await runtime.dispatchAsync(request())).toMatchObject({
    status: 200,
    body: { loaded: true },
  });
});

test("returns deterministic errors for invalid runtime dispatch", async () => {
  const runtime = createApiRuntime({ definition: DEFINITION, handlers: {} });

  expect(await runtime.dispatchAsync(request())).toMatchObject({
    status: 501,
    body: { error: { code: "handler_not_registered" } },
  });
  expect(
    await runtime.dispatchAsync({ ...request(), method: "POST" }),
  ).toMatchObject({
    status: 405,
    body: { error: { code: "method_not_allowed" } },
  });
});

test("composes each manifest operation with an approved handler and scoped authorization", async () => {
  const resolved: string[] = [];
  const runtime = composeAuthorizedApiRuntime({
    definition: DEFINITION,
    context: { appId: "app-a", projectId: "project-a" },
    resolveHandler: ({ binding, context }) => {
      resolved.push(
        `${context.appId}:${context.projectId}:${binding.operationId}`,
      );
      return (_request, handlerContext) => ({
        body: handlerContext.composition,
      });
    },
    authorizeAsync: ({ context, request }) =>
      context.projectId === "project-a" && request.params.id === "one",
  });

  expect(resolved).toEqual(["app-a:project-a:workspace.load"]);
  expect(await runtime.dispatchAsync(request())).toMatchObject({
    status: 200,
    body: { appId: "app-a", projectId: "project-a" },
  });
});

test("fails closed without a scoped context, approved handler, or authorization", async () => {
  expect(() =>
    composeAuthorizedApiRuntime({
      definition: DEFINITION,
      context: { appId: "", projectId: "project-a" },
      resolveHandler: () => () => ({}),
      authorizeAsync: () => true,
    }),
  ).toThrow("requires non-empty app and project ids");

  expect(() =>
    composeAuthorizedApiRuntime({
      definition: DEFINITION,
      context: { appId: "app-a", projectId: "project-a" },
      resolveHandler: () => undefined,
      authorizeAsync: () => true,
    }),
  ).toThrow("No approved handler");

  const handled: string[] = [];
  const handler = () => {
    handled.push("called");
    return { body: { unexpected: true } };
  };
  const runtime = composeAuthorizedApiRuntime({
    definition: DEFINITION,
    context: { appId: "app-a", projectId: "project-a" },
    resolveHandler: () => handler,
    authorizeAsync: () => false,
  });

  expect(await runtime.dispatchAsync(request())).toMatchObject({
    status: 403,
    body: { error: { code: "forbidden", operationId: "workspace.load" } },
  });
  expect(handled).toEqual([]);

  const failingPolicyRuntime = composeAuthorizedApiRuntime({
    definition: DEFINITION,
    context: { appId: "app-a", projectId: "project-a" },
    resolveHandler: () => handler,
    authorizeAsync: () => {
      throw new Error("unavailable");
    },
  });

  expect(await failingPolicyRuntime.dispatchAsync(request())).toMatchObject({
    status: 403,
    body: { error: { code: "forbidden", operationId: "workspace.load" } },
  });
  expect(handled).toEqual([]);
});

/*** Build a normalized request for the fixture operation. */
function request() {
  return {
    operationId: "workspace.load",
    method: "GET" as const,
    params: { id: "one" },
    query: {},
    headers: {},
  };
}
