import { describe, expect, test } from "bun:test";

import {
  createApiRuntime,
  createApiTransportHandler,
  resolveApiOperationBindings,
  resolveApiOperationCapabilities,
} from "./api.js";

describe("@ankhorage/api public entrypoint", () => {
  test("exports the canonical runtime operations", () => {
    expect(createApiRuntime).toBeFunction();
    expect(createApiTransportHandler).toBeFunction();
    expect(resolveApiOperationBindings).toBeFunction();
    expect(resolveApiOperationCapabilities).toBeFunction();
  });
});
