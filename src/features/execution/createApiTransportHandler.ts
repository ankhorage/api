import type {
  ApiOperationBinding,
  ApiRuntime,
  ApiTransportAdapter,
} from "../../types/api.js";

/*** Compose one framework adapter with the canonical runtime for a single operation binding. */
export function createApiTransportHandler<TRequest, TResponse>(
  runtime: ApiRuntime,
  adapter: ApiTransportAdapter<TRequest, TResponse>,
  binding: ApiOperationBinding,
): (request: TRequest) => Promise<TResponse> {
  return async (request) => {
    const apiRequest = await adapter.toApiRequestAsync(request, binding);
    const apiResponse = await runtime.dispatchAsync(apiRequest);
    return adapter.fromApiResponseAsync(apiResponse, request, binding);
  };
}
