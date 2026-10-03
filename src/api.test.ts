import { describe, expect, it } from 'bun:test';
import type { InternalRestApiDefinition } from '@ankhorage/contracts';

import { createApi } from './api.js';

const definition: InternalRestApiDefinition = {
  id: 'demo',
  origin: 'internal',
  protocol: 'rest',
  basePath: '/api/demo',
  endpoints: {
    graph: {
      id: 'graph',
      kind: 'http',
      operations: {
        analyze: {
          id: 'analyze',
          endpointId: 'graph',
          protocol: 'http',
          intent: 'action',
          method: 'POST',
          path: '/analyze',
        },
      },
    },
    duplicate: {
      id: 'duplicate',
      kind: 'http',
      operations: {
        shared: {
          id: 'shared',
          endpointId: 'duplicate',
          protocol: 'http',
          intent: 'action',
          method: 'POST',
          path: '/shared',
        },
      },
    },
    duplicate2: {
      id: 'duplicate2',
      kind: 'http',
      operations: {
        shared: {
          id: 'shared',
          endpointId: 'duplicate2',
          protocol: 'http',
          intent: 'action',
          method: 'POST',
          path: '/shared',
        },
      },
    },
  },
};

describe('createApi', () => {
  it('dispatches a unique operation to its registered handler', async () => {
    const api = createApi({
      definition,
      handlers: { analyze: ({ input }) => ({ received: input }) },
    });
    expect(await api.executeAsync({ operationId: 'analyze', input: { source: 'atlas' } })).toEqual({
      ok: true,
      data: { received: { source: 'atlas' } },
    });
  });

  it('requires an endpoint when an operation id is ambiguous', async () => {
    const api = createApi({ definition, handlers: { shared: () => 'ok' } });
    expect(await api.executeAsync({ operationId: 'shared' })).toMatchObject({
      ok: false,
      code: 'endpoint-required',
    });
    expect(await api.executeAsync({ endpointId: 'duplicate', operationId: 'shared' })).toEqual({
      ok: true,
      data: 'ok',
    });
  });

  it('reports missing operations and handlers without throwing', async () => {
    const api = createApi({ definition, handlers: {} });
    expect(await api.executeAsync({ operationId: 'missing' })).toMatchObject({
      ok: false,
      code: 'operation-not-found',
    });
    expect(await api.executeAsync({ operationId: 'analyze' })).toMatchObject({
      ok: false,
      code: 'handler-not-found',
    });
  });

  it('normalizes handler exceptions', async () => {
    const api = createApi({
      definition,
      handlers: {
        analyze: () => {
          throw new Error('private failure');
        },
      },
    });
    expect(await api.executeAsync({ operationId: 'analyze' })).toMatchObject({
      ok: false,
      code: 'handler-error',
    });
  });
});
