import type { InternalRestApiDefinition } from '@ankhorage/contracts/data';
import { describe, expect, test } from 'bun:test';

import { projectApiCapabilities } from './projectApiCapabilities.js';

const DEFINITION = {
  id: 'catalog',
  origin: 'internal',
  protocol: 'rest',
  basePath: '/api',
  schemas: {
    createProduct: {
      type: 'object',
      required: ['name'],
      properties: { name: { type: 'string' } },
    },
  },
  endpoints: {
    products: {
      id: 'products',
      kind: 'http',
      operations: {
        create: {
          id: 'products.create',
          endpointId: 'products',
          name: 'Create product',
          description: 'Create one catalog product.',
          protocol: 'http',
          intent: 'create',
          request: {
            schemaRef: { id: 'createProduct' },
            parameters: [
              {
                name: 'locale',
                location: 'query',
                required: true,
                description: 'Locale used for the created product.',
                schema: { type: 'string' },
              },
            ],
          },
          response: {
            schema: {
              type: 'object',
              required: ['id'],
              properties: { id: { type: 'string' } },
            },
          },
        },
      },
    },
  },
} satisfies InternalRestApiDefinition;

describe('projectApiCapabilities', () => {
  test('projects stable API capability identity and schema semantics', () => {
    expect(projectApiCapabilities(DEFINITION)).toEqual([
      {
        id: 'api.catalog.products.create',
        owner: '@ankhorage/api',
        access: ['invoke'],
        binding: { kind: 'api', bindableAs: ['target'] },
        label: 'Create product',
        description: 'Create one catalog product.',
        input: {
          schema: {
            allOf: [
              { ref: { id: 'createProduct' } },
              {
                type: 'object',
                properties: {
                  locale: {
                    type: 'string',
                    description: 'Locale used for the created product.',
                  },
                },
                required: ['locale'],
              },
            ],
          },
        },
        output: {
          schema: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'string' } },
          },
        },
      },
    ]);
  });

  test('preserves a body-only schema reference without wrapping or duplication', () => {
    const definition = {
      ...DEFINITION,
      endpoints: {
        products: {
          ...DEFINITION.endpoints.products,
          operations: {
            create: {
              ...DEFINITION.endpoints.products.operations.create,
              request: { schemaRef: { id: 'createProduct' } },
            },
          },
        },
      },
    } satisfies InternalRestApiDefinition;

    expect(projectApiCapabilities(definition)[0]?.input).toEqual({
      schemaRef: { id: 'createProduct' },
    });
  });

  test('rejects invalid projected ids instead of casting them into the capability contract', () => {
    const definition = {
      ...DEFINITION,
      id: '',
    } satisfies InternalRestApiDefinition;

    expect(() => projectApiCapabilities(definition)).toThrow(
      'API operation projects to an invalid capability id',
    );
  });

  test('rejects duplicate operation identities across endpoints deterministically', () => {
    const definition = {
      ...DEFINITION,
      endpoints: {
        first: DEFINITION.endpoints.products,
        second: {
          ...DEFINITION.endpoints.products,
          id: 'second',
        },
      },
    } satisfies InternalRestApiDefinition;

    expect(() => projectApiCapabilities(definition)).toThrow(
      'Duplicate projected API capability id: api.catalog.products.create',
    );
  });
});
