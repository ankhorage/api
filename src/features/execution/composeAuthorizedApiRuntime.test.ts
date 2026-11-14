import type { Capability } from "@ankhorage/contracts/capability";
import type { InternalRestApiDefinition } from "@ankhorage/contracts/data";
import { expect, test } from "bun:test";

import type { ApiApprovedHandler } from "../../types/api.js";
import { composeAuthorizedApiRuntime } from "./composeAuthorizedApiRuntime.js";

const DEFINITION = {
  id: "projects",
  origin: "internal",
  protocol: "rest",
  basePath: "/api",
  endpoints: {
    projects: {
      id: "projects",
      kind: "http",
      operations: {
        "projects.read": {
          id: "projects.read",
          protocol: "http",
          intent: "read",
        },
      },
    },
  },
  handlers: {
    "projects.read": {
      operationId: "projects.read",
      capability: "projects.read",
    },
  },
} satisfies InternalRestApiDefinition;

test("composes declared capabilities with approved owner handlers and scoped authorization", async () => {
  const resolved: string[] = [];
  const runtime = composeAuthorizedApiRuntime({
    definition: DEFINITION,
    context: { appId: "app-a", projectId: "project-a" },
    resolveHandler: ({ binding, context, declaration }) => {
      resolved.push(
        `${context.appId}:${context.projectId}:${binding.operationId}:${declaration.capability}`,
      );
      return approvedHandler(declaration.capability);
    },
    authorizeAsync: ({ context }) => context.projectId === "project-a",
  });

  expect(resolved).toEqual(["app-a:project-a:projects.read:projects.read"]);
  expect(
    await runtime.dispatchAsync({
      operationId: "projects.read",
      method: "GET",
      params: {},
      query: {},
      headers: {},
    }),
  ).toEqual({
    status: 200,
    headers: {},
    body: {
      appId: "app-a",
      projectId: "project-a",
      capability: "projects.read",
    },
  });
});

/*** Build the host-approved executable owner handler for the declared capability. */
function approvedHandler(id: Capability["id"]): ApiApprovedHandler {
  return {
    capability: {
      id,
      owner: "@ankhorage/projects",
      access: ["invoke"],
      binding: { kind: "action", bindableAs: ["target"] },
    },
    handler: (_request, context) => ({
      body: { ...context.composition, capability: context.capability?.id },
    }),
  };
}
