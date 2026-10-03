import { describe, expect, test } from "bun:test";

import type { ApiTransportAdapter } from "../../types/api.js";
import { createApiRuntime } from "./createApiRuntime.js";
import { createApiTransportHandler } from "./createApiTransportHandler.js";

describe("createApiTransportHandler", () => {
  test("translates through one adapter while dispatching through the shared runtime", async () => {
    const runtime = createApiRuntime({
      definition: {
        id: "example",
        origin: "internal",
        protocol: "rest",
        basePath: "/api",
        endpoints: {
          health: {
            id: "health",
            kind: "http",
            operations: {
              "health.read": {
                id: "health.read",
                protocol: "http",
                intent: "read",
                method: "GET",
                path: "/health",
              },
            },
          },
        },
      },
      handlers: {
        "health.read": () => ({ body: { ok: true } }),
      },
    });
    const [binding] = runtime.bindings;
    if (!binding) throw new Error("Expected one operation binding.");

    const adapter: ApiTransportAdapter<string, number> = {
      toApiRequestAsync: () =>
        Promise.resolve({
          operationId: binding.operationId,
          method: binding.method,
          params: {},
          query: {},
          headers: {},
        }),
      fromApiResponseAsync: (response) => Promise.resolve(response.status),
    };

    const handler = createApiTransportHandler(runtime, adapter, binding);
    const status = await handler("request");
    expect(status).toBe(200);
  });
});
