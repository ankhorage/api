import type { InternalRestApiDefinition } from "@ankhorage/contracts/data";
import { describe, expect, test } from "bun:test";

import { CAPABILITIES } from "../../capabilities/index.js";
import { resolveApiOperationCapabilities } from "./resolveApiOperationCapabilities.js";

const DEFINITION = {
  id: "catalog",
  origin: "internal",
  protocol: "rest",
  basePath: "/api",
  endpoints: {
    products: {
      id: "products",
      kind: "http",
      operations: {
        "products.list": {
          id: "products.list",
          protocol: "http",
          intent: "read",
          method: "GET",
          path: "/products",
          name: "List products",
          response: {
            status: 200,
            contentType: "application/json",
            schema: { type: "array", items: { type: "object" } },
          },
        },
        "products.create": {
          id: "products.create",
          protocol: "http",
          intent: "create",
          method: "POST",
          path: "/products",
          name: "Create product",
          description: "Create one catalog product.",
          request: {
            contentType: "application/json",
            parameters: [
              {
                name: "trace",
                location: "header",
                schema: { type: "string" },
              },
            ],
            schema: {
              type: "object",
              required: ["name"],
              properties: { name: { type: "string" } },
            },
          },
          response: {
            status: 201,
            schemaRef: { id: "Product" },
          },
        },
      },
    },
  },
} satisfies InternalRestApiDefinition;

describe("resolveApiOperationCapabilities", () => {
  test("keeps the package static catalog separate from dynamic API operations", () => {
    expect(CAPABILITIES).toEqual([]);
  });

  test("projects stable semantic operation capabilities with schema slots only", () => {
    const capabilities = resolveApiOperationCapabilities(DEFINITION);

    expect(capabilities.map(({ id }) => id)).toEqual([
      "api.catalog.products.create",
      "api.catalog.products.list",
    ]);
    expect(capabilities[0]).toEqual({
      id: "api.catalog.products.create",
      owner: "@ankhorage/api",
      access: ["invoke"],
      binding: { kind: "api", bindableAs: ["target"] },
      label: "Create product",
      description: "Create one catalog product.",
      input: {
        schema: {
          type: "object",
          required: ["name"],
          properties: { name: { type: "string" } },
        },
      },
      output: { schemaRef: { id: "Product" } },
    });
    expect(capabilities[1]).toEqual({
      id: "api.catalog.products.list",
      owner: "@ankhorage/api",
      access: ["invoke"],
      binding: { kind: "api", bindableAs: ["target"] },
      label: "List products",
      output: { schema: { type: "array", items: { type: "object" } } },
    });
    expect(capabilities[0]).not.toHaveProperty("method");
    expect(capabilities[0]).not.toHaveProperty("path");
    expect(capabilities[0]?.input).not.toHaveProperty("parameters");
    expect(capabilities[0]?.input).not.toHaveProperty("contentType");
  });

  test("rejects duplicate semantic operation identities across endpoints", () => {
    const duplicate = {
      ...DEFINITION,
      endpoints: {
        ...DEFINITION.endpoints,
        legacy: {
          id: "legacy",
          kind: "http",
          operations: {
            "products.create": {
              id: "products.create",
              protocol: "http",
              intent: "create",
            },
          },
        },
      },
    } satisfies InternalRestApiDefinition;

    expect(() => resolveApiOperationCapabilities(duplicate)).toThrow(
      "projects duplicate capability ids",
    );
  });
});
