import type { InternalRestApiDefinition } from "@ankhorage/contracts/data";

import { createApiRuntime } from "../../src/api.js";

/***
 * @title Basic Usage
 *
 * `@ankhorage/api` executes portable internal REST API definitions without coupling application
 * handlers to Fastify, Next.js, or another HTTP framework. Framework packages adapt requests and
 * responses at the transport edge while this runtime owns operation lookup and dispatch.
 *
 * @usage
 * @readme
 */
const definition = {
  id: "health-api",
  origin: "internal",
  protocol: "rest",
  basePath: "/api",
  endpoints: {
    health: {
      id: 'health',
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
} satisfies InternalRestApiDefinition;

export const runtime = createApiRuntime({
  definition,
  handlers: {
    "health.read": () => ({ body: { ok: true } }),
  },
});
