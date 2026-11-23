import type { Capability } from "@ankhorage/contracts/capability";
import type {
  DataEndpointConfig,
  DataOperationConfig,
  DataOperationIntent,
  DataOperationMethod,
  InternalApiOperationHandlerDeclaration,
  InternalRestApiDefinition,
} from "@ankhorage/contracts/data";

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

export interface ApiHandlerResponse {
  readonly status?: number;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
}

export interface ApiResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: unknown;
}

export interface ApiHandlerContext {
  readonly binding: ApiOperationBinding;
  readonly composition?: ApiCompositionContext;
  readonly capability?: Capability;
}

export type ApiHandler = (
  request: ApiRequest,
  context: ApiHandlerContext,
) => ApiHandlerResponse | Promise<ApiHandlerResponse>;

export type ApiHandlerRegistry = Readonly<Record<string, ApiHandler>>;

export interface ApiCompositionContext {
  readonly appId: string;
  readonly projectId: string;
}

export interface ApiHandlerResolutionRequest {
  readonly binding: ApiOperationBinding;
  readonly declaration: InternalApiOperationHandlerDeclaration;
  readonly context: ApiCompositionContext;
}

export interface ApiApprovedHandler {
  readonly capability: Capability;
  readonly approval: ApiHandlerApproval;
  readonly handler: ApiHandler;
}

/*** Bind one host-approved owner handler to its exact API operation and application scope. */
export interface ApiHandlerApproval {
  readonly operationId: string;
  readonly intent: DataOperationIntent;
  readonly method: DataOperationMethod;
  readonly capabilityId: Capability["id"];
  readonly owner: string;
  readonly scope: ApiCompositionContext;
}

export type ApiHandlerResolver = (
  request: ApiHandlerResolutionRequest,
) => ApiApprovedHandler | undefined;

export interface ApiAuthorizationRequest {
  readonly binding: ApiOperationBinding;
  readonly context: ApiCompositionContext;
  readonly request: ApiRequest;
}

export type ApiAuthorizationPolicy = (
  request: ApiAuthorizationRequest,
) => boolean | Promise<boolean>;

export interface ComposeAuthorizedApiRuntimeOptions {
  readonly definition: InternalRestApiDefinition;
  readonly context: ApiCompositionContext;
  readonly resolveHandler: ApiHandlerResolver;
  readonly authorizeAsync: ApiAuthorizationPolicy;
}

export interface ApiRuntime {
  readonly definition: InternalRestApiDefinition;
  readonly bindings: readonly ApiOperationBinding[];
  dispatchAsync(request: ApiRequest): Promise<ApiResponse>;
  getBinding(operationId: string): ApiOperationBinding | undefined;
}

export interface ApiTransportAdapter<TRequest, TResponse> {
  toApiRequestAsync(
    request: TRequest,
    binding: ApiOperationBinding,
  ): Promise<ApiRequest>;
  fromApiResponseAsync(
    response: ApiResponse,
    request: TRequest,
    binding: ApiOperationBinding,
  ): Promise<TResponse>;
}

/*** Describe the authenticated host context that scopes one generated-app broker request. */
export interface TrustedExternalApiBrokerContext {
  readonly caller: unknown;
  readonly scope: {
    readonly appId: string;
    readonly projectId: string;
    readonly environment: string;
  };
}

/*** Describe the only client-controlled values accepted by the trusted external API broker. */
export interface TrustedExternalApiBrokerRequest {
  readonly apiId: string;
  readonly endpointId: string;
  readonly operationId: string;
  readonly input?: unknown;
}

/*** Describe an operation resolved exclusively from trusted server-side application state. */
export interface TrustedExternalApiOperation {
  readonly apiId: string;
  readonly endpointId: string;
  readonly operationId: string;
  readonly credentialsRequired?: boolean;
}

/*** Describe server-only credentials resolved for a trusted external API operation. */
export interface TrustedExternalApiCredentials {
  readonly values: Readonly<Record<string, string>>;
}

/*** Describe the caller-safe result returned after trusted operation execution. */
export interface TrustedExternalApiExecutionResult {
  readonly status: number;
  readonly publicBody?: unknown;
}

export interface TrustedExternalApiBroker {
  executeAsync(input: {
    readonly context: TrustedExternalApiBrokerContext;
    readonly request: TrustedExternalApiBrokerRequest;
  }): Promise<ApiResponse>;
}

export interface CreateTrustedExternalApiBrokerOptions {
  readonly authorizeAsync: (input: {
    readonly context: TrustedExternalApiBrokerContext;
    readonly request: TrustedExternalApiBrokerRequest;
  }) => boolean | Promise<boolean>;
  readonly resolveOperationAsync: (input: {
    readonly scope: TrustedExternalApiBrokerContext["scope"];
    readonly request: TrustedExternalApiBrokerRequest;
  }) =>
    | TrustedExternalApiOperation
    | undefined
    | Promise<TrustedExternalApiOperation | undefined>;
  readonly validateInputAsync: (input: {
    readonly operation: TrustedExternalApiOperation;
    readonly input: unknown;
  }) => unknown;
  readonly resolveCredentialsAsync: (input: {
    readonly scope: TrustedExternalApiBrokerContext["scope"];
    readonly operation: TrustedExternalApiOperation;
  }) =>
    | TrustedExternalApiCredentials
    | undefined
    | Promise<TrustedExternalApiCredentials | undefined>;
  readonly executeOperationAsync: (input: {
    readonly operation: TrustedExternalApiOperation;
    readonly input: unknown;
    readonly credentials?: TrustedExternalApiCredentials;
  }) =>
    | TrustedExternalApiExecutionResult
    | Promise<TrustedExternalApiExecutionResult>;
}
