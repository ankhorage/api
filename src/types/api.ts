import type {
  DataEndpointConfig,
  DataOperationConfig,
  DataOperationMethod,
  InternalRestApiDefinition,
} from '@ankhorage/contracts/data';

export interface ApiOperationBinding {
  readonly definition: InternalRestApiDefinition;
  readonly endpoint: DataEndpointConfig;
  readonly operation: DataOperationConfig;
  readonly operationId: string;
  readonly method: DataOperationMethod;
  readonly path: string;
}

export interface ApiRequest {
  readonly operationId: string;
  readonly method: DataOperationMethod;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string | readonly string[]>>;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: unknown;
}

export interface ApiResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: unknown;
}

export interface ApiHandlerContext {
  readonly binding: ApiOperationBinding;
}

export type ApiHandler = (
  request: ApiRequest,
  context: ApiHandlerContext,
) => ApiResponse | Promise<ApiResponse>;

export type ApiHandlerRegistry = Readonly<Record<string, ApiHandler>>;

export interface ApiRuntime {
  readonly definition: InternalRestApiDefinition;
  readonly bindings: readonly ApiOperationBinding[];
  dispatchAsync(request: ApiRequest): Promise<ApiResponse>;
  getBinding(operationId: string): ApiOperationBinding | undefined;
}

export interface ApiTransportAdapter<TRequest, TResponse> {
  toApiRequestAsync(request: TRequest, binding: ApiOperationBinding): Promise<ApiRequest>;
  fromApiResponseAsync(response: ApiResponse): Promise<TResponse>;
}
