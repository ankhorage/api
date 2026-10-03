import type { InternalRestApiDefinition } from '@ankhorage/contracts/data';

import type { ApiOperationBinding } from '../../types/api.js';

/***
 * Resolve one portable internal REST definition into deterministic executable operation bindings.
 */
export function resolveApiOperationBindings(
  definition: InternalRestApiDefinition,
): readonly ApiOperationBinding[] {
  return Object.values(definition.endpoints)
    .flatMap((endpoint) =>
      Object.values(endpoint.operations).map((operation) => {
        const method = operation.method ?? inferMethod(operation.intent);
        return {
          definition,
          endpoint,
          operation,
          operationId: operation.id,
          method,
          path: joinRoutePath(definition.basePath, endpoint.path, operation.path),
        } satisfies ApiOperationBinding;
      }),
    )
    .sort((left, right) => left.operationId.localeCompare(right.operationId));
}

/*** Infer the conventional HTTP method for an operation intent when the contract omits one. */
function inferMethod(intent: string) {
  switch (intent) {
    case 'create':
      return 'POST';
    case 'delete':
      return 'DELETE';
    case 'read':
      return 'GET';
    case 'update':
      return 'PATCH';
    default:
      return 'POST';
  }
}

/*** Join API, endpoint, and operation paths into one normalized absolute route path. */
function joinRoutePath(...parts: readonly (string | undefined)[]) {
  const segments = parts
    .filter((part): part is string => typeof part === 'string')
    .flatMap((part) => part.split('/'))
    .filter(Boolean);
  return '/' + segments.join('/');
}
