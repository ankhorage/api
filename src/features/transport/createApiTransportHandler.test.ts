import { describe, expect, test } from 'bun:test';

import { createApiRuntime } from '../runtime/createApiRuntime.js';
import { createApiTransportHandler } from './createApiTransportHandler.js';
import type { ApiTransportAdapter } from '../../types/api.js';

describe('createApiTransportHandler', () => {
  test('translates through one adapter while dispatching through the shared runtime', async () => {
    const runtime = createApiRuntime({
      definition: {
        id: 'example',
        origin: 'internal',
        protocol: 'rest',
        basePath: '/api',
        endpoints: {
          health: {
            id: 'health',
            kind: 'http',
            operations: {
              'health.read': {
                id: 'health.read',
                protocol: 'http',
                intent: 'read',
                method: 'GET',
                path: '/health',
              },
            },
          },
        },
      },
      handlers: {
        'health.read': () => ({ body: { ok: true } }),
      },
    });
    const binding = runtime.bindings[0];
    if (!binding) throw new Error('Expected one operation binding.');

    const adapter: ApiTransportAdapter<string, number> = {
      toApiRequestAsync: async () => ({
        operationId: binding.operationId,
        method: binding.method,
        params: {},
        query: {},
        headers: {},
      }),
      fromApiResponseAsync: async (response) => response.status,
    };

    await expect(createApiTransportHandler(runtime, adapter, binding)('request')).resolves.toBe(200);
  });
});
