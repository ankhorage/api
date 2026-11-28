import { expect, test } from "bun:test";

import type {
  CreateTrustedExternalApiBrokerOptions,
  TrustedExternalApiBrokerContext,
  TrustedExternalApiBrokerRequest,
  TrustedExternalApiOperation,
} from "../../types/api.js";
import { createTrustedExternalApiBroker } from "./createTrustedExternalApiBroker.js";

const CONTEXT: TrustedExternalApiBrokerContext = {
  caller: { subject: "caller-a" },
  scope: { appId: "app-a", projectId: "project-a", environment: "production" },
};

const REQUEST: TrustedExternalApiBrokerRequest = {
  apiId: "zefix",
  endpointId: "companies",
  operationId: "search",
  input: { query: "Ankhorage" },
};

test("executes a server-resolved authorized operation without exposing credentials", async () => {
  const calls: string[] = [];
  const broker = createTrustedExternalApiBroker(
    createOptions({
      authorizeAsync: () => {
        calls.push("authorize");
        return true;
      },
      resolveOperationAsync: () => {
        calls.push("operation");
        return operation();
      },
      validateInputAsync: ({ input }) => {
        calls.push("validate");
        return input;
      },
      resolveCredentialsAsync: () => {
        calls.push("credentials");
        return { values: { authorization: "Basic secret" } };
      },
      executeOperationAsync: ({ credentials }) => {
        calls.push(`execute:${credentials?.values.authorization}`);
        return { status: 200, publicBody: { companies: [] } };
      },
    }),
  );

  expect(
    await broker.executeAsync({ context: CONTEXT, request: REQUEST }),
  ).toEqual({
    status: 200,
    headers: {},
    body: { companies: [] },
  });
  expect(calls).toEqual([
    "authorize",
    "operation",
    "validate",
    "credentials",
    "execute:Basic secret",
  ]);
});

test("keeps concurrent caller credentials isolated from each other and public responses", async () => {
  const credentialValues: string[] = [];
  const secondCaller = { subject: "caller-b" };
  const broker = createTrustedExternalApiBroker(
    createOptions({
      resolveCredentialsAsync: ({ caller }) => {
        return {
          values: {
            authorization:
              caller === CONTEXT.caller ? "caller-a-secret" : "caller-b-secret",
          },
        };
      },
      executeOperationAsync: ({ credentials }) => {
        const authorization = credentials?.values.authorization;
        if (authorization === undefined)
          throw new Error("Missing caller credential.");
        credentialValues.push(authorization);
        return { status: 200, publicBody: { authorized: true } };
      },
    }),
  );

  const responses = await Promise.all([
    broker.executeAsync({ context: CONTEXT, request: REQUEST }),
    broker.executeAsync({
      context: { ...CONTEXT, caller: secondCaller },
      request: REQUEST,
    }),
  ]);

  expect(credentialValues.sort()).toEqual([
    "caller-a-secret",
    "caller-b-secret",
  ]);
  expect(responses).toEqual([
    { status: 200, headers: {}, body: { authorized: true } },
    { status: 200, headers: {}, body: { authorized: true } },
  ]);
  expect(JSON.stringify(responses)).not.toContain("secret");
});

test("denies before resolving secrets or executing network work", async () => {
  const calls: string[] = [];
  const broker = createTrustedExternalApiBroker(
    createOptions({
      authorizeAsync: () => {
        calls.push("authorize");
        return false;
      },
      resolveOperationAsync: () => {
        calls.push("operation");
        return operation();
      },
      resolveCredentialsAsync: () => {
        calls.push("credentials");
        return { values: {} };
      },
      executeOperationAsync: () => {
        calls.push("execute");
        return { status: 200 };
      },
    }),
  );

  expect(
    await broker.executeAsync({ context: CONTEXT, request: REQUEST }),
  ).toEqual(errorResponse(403, "forbidden"));
  expect(calls).toEqual(["authorize"]);
});

test("fails closed for an invalid scope, unknown operation, or caller-supplied target", async () => {
  const calls: string[] = [];
  const broker = createTrustedExternalApiBroker(
    createOptions({
      authorizeAsync: () => {
        calls.push("authorize");
        return true;
      },
      resolveOperationAsync: () => undefined,
    }),
  );

  expect(
    await broker.executeAsync({
      context: { ...CONTEXT, scope: { ...CONTEXT.scope, projectId: "" } },
      request: REQUEST,
    }),
  ).toEqual(errorResponse(403, "forbidden"));
  expect(calls).toEqual([]);
  expect(
    await broker.executeAsync({ context: CONTEXT, request: REQUEST }),
  ).toEqual(errorResponse(404, "operation_not_found"));
  expect(
    await broker.executeAsync({
      context: CONTEXT,
      request: requestWithUpstreamUrl(),
    }),
  ).toEqual(errorResponse(403, "forbidden"));
});

test("does not execute when required credentials are unavailable", async () => {
  let executed = false;
  const broker = createTrustedExternalApiBroker(
    createOptions({
      resolveCredentialsAsync: () => undefined,
      executeOperationAsync: () => {
        executed = true;
        return { status: 200 };
      },
    }),
  );

  expect(
    await broker.executeAsync({ context: CONTEXT, request: REQUEST }),
  ).toEqual(errorResponse(424, "credential_unavailable"));
  expect(executed).toBeFalse();
});

test("redacts thrown provider diagnostics and supports public operations", async () => {
  const broker = createTrustedExternalApiBroker(
    createOptions({
      executeOperationAsync: () => {
        throw new Error("https://service.invalid?token=secret");
      },
    }),
  );

  expect(
    await broker.executeAsync({ context: CONTEXT, request: REQUEST }),
  ).toEqual(errorResponse(502, "external_operation_failed"));
  const publicBroker = createTrustedExternalApiBroker(
    createOptions({
      resolveOperationAsync: () => ({
        ...operation(),
        credentialsRequired: false,
      }),
      resolveCredentialsAsync: () => undefined,
      executeOperationAsync: ({ credentials }) => ({
        status: credentials === undefined ? 204 : 500,
      }),
    }),
  );
  expect(
    await publicBroker.executeAsync({ context: CONTEXT, request: REQUEST }),
  ).toEqual({ status: 204, headers: {} });
});

/*** Create the smallest secure broker port set and allow each test to override one boundary. */
function createOptions(
  overrides: Partial<CreateTrustedExternalApiBrokerOptions> = {},
): CreateTrustedExternalApiBrokerOptions {
  return {
    authorizeAsync: () => true,
    resolveOperationAsync: () => operation(),
    validateInputAsync: ({ input }) => input,
    resolveCredentialsAsync: () => ({
      values: { authorization: "Basic secret" },
    }),
    executeOperationAsync: () => ({ status: 200, publicBody: { ok: true } }),
    ...overrides,
  };
}

/*** Return the exact server-owned operation identity expected by the request fixture. */
function operation(): TrustedExternalApiOperation {
  return {
    apiId: REQUEST.apiId,
    endpointId: REQUEST.endpointId,
    operationId: REQUEST.operationId,
    credentialsRequired: true,
  };
}

/*** Create a deterministic caller-safe broker error assertion. */
function errorResponse(status: number, code: string) {
  return {
    status,
    headers: { "content-type": "application/json" },
    body: { error: { code } },
  };
}

/*** Return a runtime-shaped hostile request that cannot be represented by the public contract. */
function requestWithUpstreamUrl(): TrustedExternalApiBrokerRequest & {
  readonly upstreamUrl: string;
} {
  return { ...REQUEST, upstreamUrl: "https://attacker.invalid" };
}
