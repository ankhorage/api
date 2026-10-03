import type {
  DataEndpointConfig,
  DataOperationConfig,
  InternalRestApiDefinition,
} from '@ankhorage/contracts/data';

import type {
  ApiDispatchFailure,
  ApiDispatchResult,
  ApiOperationDispatchInput,
  ApiOperationHandlerRegistry,
} from '../../types/api.js';

interface ExecuteApiOperationInput {
  readonly definition: InternalRestApiDefinition;
  readonly handlers: ApiOperationHandlerRegistry;
  readonly input: ApiOperationDispatchInput;
}

interface ApiOperationTarget {
  readonly endpoint: DataEndpointConfig;
  readonly operation: DataOperationConfig;
}

type ResolveTargetResult =
  | { readonly ok: true; readonly target: ApiOperationTarget }
  | { readonly ok: false; readonly failure: ApiDispatchFailure };

/*** Execute one registered API operation and normalize lookup and handler failures. */
export async function executeApiOperationAsync(
  args: ExecuteApiOperationInput,
): Promise<ApiDispatchResult> {
  const resolved = resolveApiOperationTarget(args.definition, args.input);
  if (!resolved.ok) return resolved.failure;

  const handler = args.handlers[resolved.target.operation.id];
  if (handler === undefined) {
    return failure(
      'handler-not-found',
      `No handler is registered for operation '${resolved.target.operation.id}'.`,
    );
  }

  try {
    const data = await handler({
      definition: args.definition,
      endpoint: resolved.target.endpoint,
      operation: resolved.target.operation,
      ...(args.input.input === undefined ? {} : { input: args.input.input }),
      ...(args.input.signal === undefined ? {} : { signal: args.input.signal }),
    });
    return { ok: true, data };
  } catch {
    return failure(
      'handler-error',
      `Operation '${resolved.target.operation.id}' failed while executing its handler.`,
    );
  }
}

/*** Resolve an operation by explicit endpoint or by one unique operation id across the API. */
function resolveApiOperationTarget(
  definition: InternalRestApiDefinition,
  input: ApiOperationDispatchInput,
): ResolveTargetResult {
  if (input.endpointId !== undefined) {
    const endpoint = definition.endpoints[input.endpointId];
    if (endpoint === undefined) {
      return {
        ok: false,
        failure: failure('endpoint-not-found', `Endpoint '${input.endpointId}' was not found.`),
      };
    }
    const operation = endpoint.operations[input.operationId];
    return operation === undefined
      ? {
          ok: false,
          failure: failure(
            'operation-not-found',
            `Operation '${input.operationId}' was not found on endpoint '${input.endpointId}'.`,
          ),
        }
      : { ok: true, target: { endpoint, operation } };
  }

  const matches = Object.values(definition.endpoints).flatMap((endpoint) => {
    const operation = endpoint.operations[input.operationId];
    return operation === undefined ? [] : [{ endpoint, operation }];
  });

  if (matches.length === 0) {
    return {
      ok: false,
      failure: failure('operation-not-found', `Operation '${input.operationId}' was not found.`),
    };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      failure: failure(
        'endpoint-required',
        `Operation '${input.operationId}' exists on multiple endpoints; endpointId is required.`,
      ),
    };
  }

  const target = matches[0];
  return target === undefined
    ? {
        ok: false,
        failure: failure('operation-not-found', `Operation '${input.operationId}' was not found.`),
      }
    : { ok: true, target };
}

/*** Create one normalized dispatch failure. */
function failure(code: ApiDispatchFailure['code'], message: string): ApiDispatchFailure {
  return { ok: false, code, message };
}
