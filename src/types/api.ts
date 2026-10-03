import type {
  DataEndpointConfig,
  DataOperationConfig,
  InternalRestApiDefinition,
} from '@ankhorage/contracts/data';

export interface ApiOperationHandlerArgs {
  readonly definition: InternalRestApiDefinition;
  readonly endpoint: DataEndpointConfig;
  readonly operation: DataOperationConfig;
  readonly input?: unknown;
  readonly signal?: AbortSignal;
}

export type ApiOperationHandler = (args: ApiOperationHandlerArgs) => unknown | Promise<unknown>;
export type ApiOperationHandlerRegistry = Readonly<Record<string, ApiOperationHandler>>;

export interface ApiOperationDispatchInput {
  readonly endpointId?: string;
  readonly operationId: string;
  readonly input?: unknown;
  readonly signal?: AbortSignal;
}

export type ApiDispatchFailureCode =
  | 'endpoint-not-found'
  | 'endpoint-required'
  | 'handler-error'
  | 'handler-not-found'
  | 'operation-not-found';

export interface ApiDispatchFailure {
  readonly ok: false;
  readonly code: ApiDispatchFailureCode;
  readonly message: string;
}

export type ApiDispatchResult =
  | { readonly ok: true; readonly data: unknown }
  | ApiDispatchFailure;

export interface Api {
  readonly definition: InternalRestApiDefinition;
  executeAsync(input: ApiOperationDispatchInput): Promise<ApiDispatchResult>;
}
