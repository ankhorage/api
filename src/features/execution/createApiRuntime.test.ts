import type { InternalRestApiDefinition } from "@ankhorage/contracts/data";
import { CAPABILITIES } from "@ankhorage/projects/capabilities";
import { expect, test } from "bun:test";

import type { ApiApprovedHandler, ApiHandler } from "../../types/api.js";
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
  handlers: {
    "workspace.load": {
      operationId: "workspace.load",
      capability: "projects.read",
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

test("returns 404 for unknown operations", async () => {
  const runtime = createApiRuntime({ definition: DEFINITION, handlers: {} });

  expect(
    await runtime.dispatchAsync({ ...request(), operationId: "missing" }),
  ).toEqual({
    status: 404,
    headers: { "content-type": "application/json" },
    body: { error: { code: "operation_not_found", operationId: "missing" } },
  });
});

test("returns 500 when a handler throws", async () => {
  const runtime = createApiRuntime({
    definition: DEFINITION,
    handlers: {
      "workspace.load": () => {
        throw new Error("boom");
      },
    },
  });

  expect(await runtime.dispatchAsync(request())).toEqual({
    status: 500,
    headers: { "content-type": "application/json" },
    body: {
      error: { code: "handler_failed", operationId: "workspace.load" },
    },
  });
});

test("returns deterministic errors for missing handlers and wrong methods", async () => {
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

test("fails closed without a scoped context", () => {
  expect(() =>
    composeAuthorizedApiRuntime({
      definition: DEFINITION,
      context: { appId: "", projectId: "project-a" },
      resolveHandler: () => approvedHandler("projects.read"),
      authorizeAsync: () => true,
    }),
  ).toThrow("requires non-empty app and project ids");
});

test("fails closed when no approved handler resolves", () => {
  expect(() =>
    composeAuthorizedApiRuntime({
      definition: DEFINITION,
      context: { appId: "app-a", projectId: "project-a" },
      resolveHandler: () => undefined,
      authorizeAsync: () => true,
    }),
  ).toThrow("No approved handler");
});

test("fails closed when authorization denies a request", async () => {
  const handled: string[] = [];
  const handler = () => {
    handled.push("called");
    return { body: { unexpected: true } };
  };
  const runtime = composeAuthorizedApiRuntime({
    definition: DEFINITION,
    context: { appId: "app-a", projectId: "project-a" },
    resolveHandler: () => approvedHandler("projects.read", handler),
    authorizeAsync: () => false,
  });

  expect(await runtime.dispatchAsync(request())).toMatchObject({
    status: 403,
    body: { error: { code: "forbidden", operationId: "workspace.load" } },
  });
  expect(handled).toEqual([]);
});

test("fails closed when authorization throws", async () => {
  const handled: string[] = [];
  const handler = () => {
    handled.push("called");
    return { body: { unexpected: true } };
  };
  const failingPolicyRuntime = composeAuthorizedApiRuntime({
    definition: DEFINITION,
    context: { appId: "app-a", projectId: "project-a" },
    resolveHandler: () => approvedHandler("projects.read", handler),
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

test("fails closed before route exposure for incomplete or invalid declarations", () => {
  expect(() =>
    composeAuthorizedApiRuntime({
      definition: { ...DEFINITION, handlers: {} },
      context: { appId: "app-a", projectId: "project-a" },
      resolveHandler: () => approvedHandler("projects.read"),
      authorizeAsync: () => true,
    }),
  ).toThrow("Every API operation requires exactly one handler declaration");

  expect(() =>
    composeAuthorizedApiRuntime({
      definition: {
        ...DEFINITION,
        handlers: {
          "workspace.missing": {
            operationId: "workspace.missing",
            capability: "projects.read",
          },
        },
      },
      context: { appId: "app-a", projectId: "project-a" },
      resolveHandler: () => approvedHandler("projects.read"),
      authorizeAsync: () => true,
    }),
  ).toThrow("targets unknown API operation workspace.missing");

  expect(() =>
    composeAuthorizedApiRuntime({
      definition: {
        ...DEFINITION,
        handlers: {
          "workspace.alias": {
            operationId: "workspace.load",
            capability: "projects.read",
          },
        },
      },
      context: { appId: "app-a", projectId: "project-a" },
      resolveHandler: () => approvedHandler("projects.read"),
      authorizeAsync: () => true,
    }),
  ).toThrow("Handler declaration key does not match its operation id");
});

test("fails closed for duplicate declared capabilities", () => {
  const definition = {
    ...DEFINITION,
    endpoints: {
      ...DEFINITION.endpoints,
      listing: {
        id: "listing",
        kind: "http",
        operations: {
          "workspace.list": {
            id: "workspace.list",
            protocol: "http",
            intent: "read",
          },
        },
      },
    },
    handlers: {
      ...DEFINITION.handlers,
      "workspace.list": {
        operationId: "workspace.list",
        capability: "projects.read",
      },
    },
  } satisfies InternalRestApiDefinition;

  expect(() =>
    composeAuthorizedApiRuntime({
      definition,
      context: { appId: "app-a", projectId: "project-a" },
      resolveHandler: () => approvedHandler("projects.read"),
      authorizeAsync: () => true,
    }),
  ).toThrow("Duplicate handler declaration for capability projects.read");
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

/*** Build a host-approved executable handler owned by the declared capability provider. */
function approvedHandler(
  id: (typeof CAPABILITIES)[number]["id"],
  handler: ApiHandler = () => ({ body: { handled: true } }),
): ApiApprovedHandler {
  const capability = capabilityById(id);
  return {
    capability,
    approval: {
      operationId: "workspace.load",
      intent: "read",
      method: "GET",
      capabilityId: id,
      owner: capability.owner,
      scope: { appId: "app-a", projectId: "project-a" },
    },
    handler,
  };
}

/*** Resolve a published owner descriptor by its stable capability identity. */
function capabilityById(id: (typeof CAPABILITIES)[number]["id"]) {
  const capability = CAPABILITIES.find((candidate) => candidate.id === id);
  if (!capability)
    throw new Error(`Missing published projects capability ${id}.`);
  return capability;
}
