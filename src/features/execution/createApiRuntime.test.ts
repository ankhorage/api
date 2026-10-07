import type { InternalRestApiDefinition } from "@ankhorage/contracts/data";
import { expect, test } from "bun:test";

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

test("resolves normalized bindings and infers conventional methods", () => {
  expect(resolveApiOperationBindings(DEFINITION)).toEqual([
    expect.objectContaining({
      operationId: "workspace.load",
      method: "GET",
      path: "/api/workspaces/:id",
    }),
  ]);
});

test("dispatches registered handlers and normalizes successful responses", async () => {
  const runtime = createApiRuntime({
    definition: DEFINITION,
    handlers: {
      "workspace.load": (request) => ({ body: { id: request.params.id } }),
    },
  });

  const response = await runtime.dispatchAsync(request());
  expect(response).toEqual({
    status: 200,
    headers: {},
    body: { id: "one" },
  });
});

test("returns deterministic runtime errors", async () => {
  const noHandlers = createApiRuntime({
    definition: DEFINITION,
    handlers: {},
  });

  const noHandlerResponse = await noHandlers.dispatchAsync(request());
  expect(noHandlerResponse.status).toBe(501);

  const missingResponse = await noHandlers.dispatchAsync({
    ...request(),
    operationId: "missing",
  });
  expect(missingResponse.status).toBe(404);

  const wrongMethodResponse = await noHandlers.dispatchAsync({
    ...request(),
    method: "POST",
  });
  expect(wrongMethodResponse.status).toBe(405);
});

test("contains handler failures at the API runtime boundary", async () => {
  const runtime = createApiRuntime({
    definition: DEFINITION,
    handlers: {
      "workspace.load": () => {
        throw new Error("boom");
      },
    },
  });

  const response = await runtime.dispatchAsync(request());
  expect(response.status).toBe(500);
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
