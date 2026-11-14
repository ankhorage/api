import type { Capability } from "@ankhorage/contracts/capability";
import type { InternalRestApiDefinition } from "@ankhorage/contracts/data";
import { CAPABILITIES } from "@ankhorage/projects/capabilities";
import { expect, test } from "bun:test";

import type {
  ApiApprovedHandler,
  ApiOperationBinding,
  ApiRuntime,
} from "../../types/api.js";
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
        "projects.create": {
          id: "projects.create",
          protocol: "http",
          intent: "create",
        },
      },
    },
  },
  handlers: {
    "projects.read": {
      operationId: "projects.read",
      capability: "projects.read",
    },
    "projects.create": {
      operationId: "projects.create",
      capability: "projects.create",
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
      return approvedHandler(declaration.capability, binding);
    },
    authorizeAsync: ({ context }) => context.projectId === "project-a",
  });

  expect(resolved).toEqual([
    "app-a:project-a:projects.create:projects.create",
    "app-a:project-a:projects.read:projects.read",
  ]);
  await expectPublishedOperationAsync(runtime, "projects.read", "GET");
  await expectPublishedOperationAsync(runtime, "projects.create", "POST");
});

test("fails closed for mismatched capability, owner, or authorization scope", () => {
  expect(() => composeWith("capability")).toThrow(
    "Approved handler capability does not match API operation projects.read",
  );
  expect(() => composeWith("owner")).toThrow(
    "Approved handler does not authorize API operation projects.read",
  );
  expect(() => composeWith("scope")).toThrow(
    "Approved handler does not authorize API operation projects.read",
  );
});

/*** Compose the catalog-backed definition with one deliberately invalid read-operation approval. */
function composeWith(mismatch: "capability" | "owner" | "scope") {
  return composeAuthorizedApiRuntime({
    definition: DEFINITION,
    context: { appId: "app-a", projectId: "project-a" },
    resolveHandler: ({ binding, declaration }) => {
      const approved = approvedHandler(declaration.capability, binding);
      if (binding.operationId !== "projects.read") return approved;
      if (mismatch === "capability")
        return approvedHandler("projects.create", binding);
      if (mismatch === "owner")
        return {
          ...approved,
          approval: { ...approved.approval, owner: "@ankhorage/other" },
        };
      return {
        ...approved,
        approval: {
          ...approved.approval,
          scope: { appId: "app-a", projectId: "other" },
        },
      };
    },
    authorizeAsync: () => true,
  });
}

/*** Assert that one real owner descriptor executes only its matching HTTP intent. */
async function expectPublishedOperationAsync(
  runtime: ApiRuntime,
  operationId: string,
  method: "GET" | "POST",
): Promise<void> {
  expect(
    await runtime.dispatchAsync({
      operationId,
      method,
      params: {},
      query: {},
      headers: {},
    }),
  ).toEqual({
    status: 200,
    headers: {},
    body: { appId: "app-a", projectId: "project-a", capability: operationId },
  });
}

/*** Build the host-approved executable owner handler for the declared capability. */
function approvedHandler(
  id: Capability["id"],
  binding: ApiOperationBinding,
): ApiApprovedHandler {
  const capability = CAPABILITIES.find((candidate) => candidate.id === id);
  if (!capability)
    throw new Error(`Missing published projects capability ${id}.`);
  return {
    capability,
    approval: {
      operationId: binding.operationId,
      intent: binding.operation.intent,
      method: binding.method,
      capabilityId: id,
      owner: capability.owner,
      scope: { appId: "app-a", projectId: "project-a" },
    },
    handler: (_request, context) => ({
      body: { ...context.composition, capability: context.capability?.id },
    }),
  };
}
