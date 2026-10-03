import type { InternalRestApiDefinition } from '@ankhorage/contracts/data';

import { resolveApiOperationBindings } from './resolveApiOperationBindings.js';
import type {
  ApiHandlerRegistry,
  ApiHandlerResponse,
  ApiRequest,
  ApiResponse,
  ApiRuntime,
} from '../../types/api.js';

/*** Create the canonical executable API runtime for one portable internal REST definition. */
export function createApiRuntime(input: {
  readonly definition: InternalRestApiDefinition;
  readonly handlers: ApiHandlerRegistry;
}): ApiRuntime {
  const bindings = resolveApiOperationBindings(input.definition);
  const bindingsByOperation = new Map(bindings.map((binding) => [binding.operationId, binding]));

  return {
    definition: input.definition,
    bindings,
    getBinding: (operationId) => bindingsByOperation.get(operationId),
    dispatchAsync: async (request) =>
      dispatchApiRequestAsync(request, bindingsByOperation, input.handlers),
  };
}

/*** Dispatch one normalized request to its registered operation handler. */
async function dispatchApiRequestAsync(
  request: ApiRequest,
  bindingsByOperation: ReadonlyMap<string, ReturnType<typeof resolveApiOperationBindings>[number]>,
  handlers: ApiHandlerRegistry,
): Promise<ApiResponse> {
  const binding = bindingsByOperation.get(request.operationId);
  if (!binding) return errorResponse(404, 'operation_not_found', request.operationId);
  if (request.method !== binding.method) {
    return errorResponse(405, 'method_not_allowed', request.operationId);
  }

  const handler = handlers[request.operationId];
  if (!handler) return errorResponse(501, 'handler_not_registered', request.operationId);

  try {
    return normalizeResponse(await handler(request, { binding }));
  } catch {
    return errorResponse(500, 'handler_failed', request.operationId);
  }
}

/*** Normalize handler responses to the stable runtime response contract. */
function normalizeResponse(response: ApiHandlerResponse): ApiResponse {
  return {
    status: response.status ?? 200,
    headers: response.headers ?? {},
    ...(response.body === undefined ? {} : { body: response.body }),
  };
}

/*** Create one deterministic runtime error response. */
function errorResponse(status: number, code: string, operationId: string): ApiResponse {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: {
      error: {
        code,
        operationId,
      },
    },
  };
}
