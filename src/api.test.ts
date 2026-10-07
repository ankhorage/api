import { describe, expect, test } from "bun:test";

import {
  CAPABILITIES,
  createApiRuntime,
  createApiTransportHandler,
  projectApiCapabilities,
  resolveApiOperationBindings,
} from "./api.js";

describe("@ankhorage/api public entrypoint", () => {
  test("exports the canonical runtime operations and capability projection", () => {
    expect(CAPABILITIES).toEqual([]);
    expect(createApiRuntime).toBeFunction();
    expect(createApiTransportHandler).toBeFunction();
    expect(projectApiCapabilities).toBeFunction();
    expect(resolveApiOperationBindings).toBeFunction();
  });
});
