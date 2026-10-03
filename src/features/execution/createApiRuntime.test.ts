import type { InternalRestApiDefinition } from '@ankhorage/contracts/data';
import { describe, expect, test } from 'bun:test';

import { createApiRuntime } from './createApiRuntime.js';
import { resolveApiOperationBindings } from './resolveApiOperationBindings.js';

const DEFINITION = {
  id: 'example',
  origin: 'internal',
  protocol: 'rest',
  basePath: '/api/',
  endpoints: {
    workspace: {
      id: 'workspace',
      kind: 'http',
      path: '/workspaces/',
      operations: {
        'workspace.load': {
          id: 'workspace.load',
          endpointId: 'workspace',
          protocol: 'http',
          intent: 'read',
          path: '/:id',
        },
      },
    },
  },
} satisfies InternalRestApiDefinition;

describe('createApiRuntime', () => {
  test('resolves normalized bindings and infers conventional methods', () => {
    expect(resolveApiOperationBindings(DEFINITION)).toEqual([
      expect.objectContaining({
        operationId: 'workspace.load',
        method: 'GET',
        path: '/api/workspaces/:id',
      }),
    ]);
  });

  test('dispatches registered handlers and normalizes successful responses', async () => {
    const runtime = createApiRuntime({
      definition: DEFINITION,
      handlers: {
        'workspace.load': (request) => ({ body: { id: request.params.id } }),
      },
    });

    await expect(runtime.dispatchAsync(request())).resolves.toEqual({
      status: 200,
      headers: {},
      body: { id: 'one' },
    });
  });

  test('returns deterministic runtime errors', async () => {
    const noHandlers = createApiRuntime({ definition: DEFINITION, handlers: {} });
    await expect(noHandlers.dispatchAsync(request())).resolves.toEqual(
      expect.objectContaining({ status: 501 }),
    );

    await expect(
      noHandlers.dispatchAsync({ ...request(), operationId: 'missing' }),
    ).resolves.toEqual(expect.objectContaining({ status: 404 }));

    await expect(
      noHandlers.dispatchAsync({ ...request(), method: 'POST' }),
    ).resolves.toEqual(expect.objectContaining({ status: 405 }));
  });

  test('contains handler failures at the API runtime boundary', async () => {
    const runtime = createApiRuntime({
      definition: DEFINITION,
      handlers: {
        'workspace.load': () => {
          throw new Error('boom');
        },
      },
    });

    await expect(runtime.dispatchAsync(request())).resolves.toEqual(
      expect.objectContaining({ status: 500 }),
    );
  });
});

/*** Build a normalized request for the fixture operation. */
function request() {
  return {
    operationId: 'workspace.load',
    method: 'GET' as const,
    params: { id: 'one' },
    query: {},
    headers: {},
  };
}
