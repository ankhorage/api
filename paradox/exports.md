# Public API

## ApiApprovedHandler

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:65:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| approval | property | `ApiHandlerApproval` | yes |  |
| capability | property | `Capability` | yes |  |
| handler | property | `ApiHandler` | yes |  |

## ApiAuthorizationPolicy

Kind: `unknown`
Module: `src/types/api.ts`
Source: `src/types/api.ts:91:1`

## ApiAuthorizationRequest

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:85:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| binding | property | `ApiOperationBinding` | yes |  |
| context | property | `ApiCompositionContext` | yes |  |
| request | property | `ApiRequest` | yes |  |

## ApiCompositionContext

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:54:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| appId | property | `string` | yes |  |
| projectId | property | `string` | yes |  |

## ApiHandler

Kind: `unknown`
Module: `src/types/api.ts`
Source: `src/types/api.ts:47:1`

## ApiHandlerApproval

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:72:1`

Bind one host-approved owner handler to its exact API operation and application scope.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| capabilityId | property | ``${string}.${string}`` | yes |  |
| intent | property | `DataOperationIntent` | yes |  |
| method | property | `DataOperationMethod` | yes |  |
| operationId | property | `string` | yes |  |
| owner | property | `string` | yes |  |
| scope | property | `ApiCompositionContext` | yes |  |

## ApiHandlerContext

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:41:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| binding | property | `ApiOperationBinding` | yes |  |
| capability | property | `Capability` | no |  |
| composition | property | `ApiCompositionContext` | no |  |

## ApiHandlerRegistry

Kind: `unknown`
Module: `src/types/api.ts`
Source: `src/types/api.ts:52:1`

## ApiHandlerResolutionRequest

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:59:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| binding | property | `ApiOperationBinding` | yes |  |
| context | property | `ApiCompositionContext` | yes |  |
| declaration | property | `InternalApiOperationHandlerDeclaration` | yes |  |

## ApiHandlerResolver

Kind: `unknown`
Module: `src/types/api.ts`
Source: `src/types/api.ts:81:1`

## ApiHandlerResponse

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:29:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| body | property | `unknown` | no |  |
| headers | property | `Readonly<Record<string, string>>` | no |  |
| status | property | `number` | no |  |

## ApiOperationBinding

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:11:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| definition | property | `InternalRestApiDefinition` | yes |  |
| endpoint | property | `DataEndpointConfig` | yes |  |
| method | property | `DataOperationMethod` | yes |  |
| operation | property | `DataOperationConfig` | yes |  |
| operationId | property | `string` | yes |  |
| path | property | `string` | yes |  |

## ApiRequest

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:20:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| body | property | `unknown` | no |  |
| headers | property | `Readonly<Record<string, string>>` | yes |  |
| method | property | `DataOperationMethod` | yes |  |
| operationId | property | `string` | yes |  |
| params | property | `Readonly<Record<string, string>>` | yes |  |
| query | property | `Readonly<Record<string, string \| readonly string[]>>` | yes |  |

## ApiResponse

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:35:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| body | property | `unknown` | no |  |
| headers | property | `Readonly<Record<string, string>>` | yes |  |
| status | property | `number` | yes |  |

## ApiRuntime

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:102:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| bindings | property | `readonly ApiOperationBinding[]` | yes |  |
| definition | property | `InternalRestApiDefinition` | yes |  |
| dispatchAsync | method | `(request: ApiRequest) => Promise<ApiResponse>` | yes |  |
| getBinding | method | `(operationId: string) => ApiOperationBinding \| undefined` | yes |  |

## ApiTransportAdapter

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:109:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| fromApiResponseAsync | method | `(response: ApiResponse, request: TRequest, binding: ApiOperationBinding) => Promise<TResponse>` | yes |  |
| toApiRequestAsync | method | `(request: TRequest, binding: ApiOperationBinding) => Promise<ApiRequest>` | yes |  |

## CAPABILITIES

Kind: `value`
Module: `src/capabilities/index.ts`
Source: `src/capabilities/index.ts:9:14`

## composeAuthorizedApiRuntime

Kind: `function`
Module: `src/features/execution/composeAuthorizedApiRuntime.ts`
Source: `src/features/execution/composeAuthorizedApiRuntime.ts:16:1`

Compose declared API operations with host-approved handlers and deny-by-default authorization.

### Signatures

- `(options: ComposeAuthorizedApiRuntimeOptions) => ApiRuntime`
  - options: `ComposeAuthorizedApiRuntimeOptions`
  - returns: `ApiRuntime`

## ComposeAuthorizedApiRuntimeOptions

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:95:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| authorizeAsync | property | `ApiAuthorizationPolicy` | yes |  |
| context | property | `ApiCompositionContext` | yes |  |
| definition | property | `InternalRestApiDefinition` | yes |  |
| resolveHandler | property | `ApiHandlerResolver` | yes |  |

## createApiRuntime

Kind: `function`
Module: `src/features/execution/createApiRuntime.ts`
Source: `src/features/execution/createApiRuntime.ts:13:1`

Create the canonical executable API runtime for one portable internal REST definition.

### Signatures

- `(input: { readonly definition: InternalRestApiDefinition; readonly handlers: ApiHandlerRegistry; }) => ApiRuntime`
  - input: `{ readonly definition: InternalRestApiDefinition; readonly handlers: ApiHandlerRegistry; }`
  - returns: `ApiRuntime`

## createApiTransportHandler

Kind: `function`
Module: `src/features/execution/createApiTransportHandler.ts`
Source: `src/features/execution/createApiTransportHandler.ts:8:1`

Compose one framework adapter with the canonical runtime for a single operation binding.

### Signatures

- `(runtime: ApiRuntime, adapter: ApiTransportAdapter<TRequest, TResponse>, binding: ApiOperationBinding) => (request: TRequest) => Promise<TResponse>`
  - adapter: `ApiTransportAdapter<TRequest, TResponse>`
  - binding: `ApiOperationBinding`
  - runtime: `ApiRuntime`
  - returns: `(request: TRequest) => Promise<TResponse>`

## createTrustedExternalApiBroker

Kind: `function`
Module: `src/features/execution/createTrustedExternalApiBroker.ts`
Source: `src/features/execution/createTrustedExternalApiBroker.ts:17:1`

Create a framework-neutral, fail-closed boundary for generated-app external API operations.

The caller supplies operation identity and input only; trusted host ports own target,
credentials, authorization, validation, and caller-safe result projection.

Security tests: `createTrustedExternalApiBroker.test.ts#denies before resolving secrets or executing network work`

### Signatures

- `(options: CreateTrustedExternalApiBrokerOptions) => TrustedExternalApiBroker`
  - options: `CreateTrustedExternalApiBrokerOptions`
  - returns: `TrustedExternalApiBroker`

## CreateTrustedExternalApiBrokerOptions

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:165:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| authorizeAsync | property | `(input: { readonly context: TrustedExternalApiBrokerContext; readonly request: TrustedExternalApiBrokerRequest; }) => boolean \| Promise<boolean>` | yes |  |
| executeOperationAsync | property | `(input: { readonly operation: TrustedExternalApiOperation; readonly input: unknown; readonly credentials?: TrustedExternalApiCredentials; }) => TrustedExternalApiExecutionResult \| Promise<TrustedExternalApiExecutionResult>` | yes |  |
| resolveCredentialsAsync | property | `(input: { readonly scope: TrustedExternalApiBrokerContext["scope"]; readonly operation: TrustedExternalApiOperation; }) => TrustedExternalApiCredentials \| undefined \| Promise<TrustedExternalApiCredentials \| undefined>` | yes |  |
| resolveOperationAsync | property | `(input: { readonly scope: TrustedExternalApiBrokerContext["scope"]; readonly request: TrustedExternalApiBrokerRequest; }) => TrustedExternalApiOperation \| undefined \| Promise<TrustedExternalApiOperation \| undefined>` | yes |  |
| validateInputAsync | property | `(input: { readonly operation: TrustedExternalApiOperation; readonly input: unknown; }) => unknown` | yes |  |

## projectApiCapabilities

Kind: `function`
Module: `src/features/execution/projectApiCapabilities.ts`
Source: `src/features/execution/projectApiCapabilities.ts:13:1`

Project one internal REST API definition into canonical invocable API capabilities.

### Signatures

- `(definition: InternalRestApiDefinition) => readonly Capability[]`
  - definition: `InternalRestApiDefinition`
  - returns: `readonly Capability[]`

## resolveApiOperationBindings

Kind: `function`
Module: `src/features/execution/resolveApiOperationBindings.ts`
Source: `src/features/execution/resolveApiOperationBindings.ts:11:1`

Resolve one portable internal REST definition into deterministic executable operation bindings.

### Signatures

- `(definition: InternalRestApiDefinition) => readonly ApiOperationBinding[]`
  - definition: `InternalRestApiDefinition`
  - returns: `readonly ApiOperationBinding[]`

## TrustedExternalApiBroker

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:158:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| executeAsync | method | `(input: { readonly context: TrustedExternalApiBrokerContext; readonly request: TrustedExternalApiBrokerRequest; }) => Promise<ApiResponse>` | yes |  |

## TrustedExternalApiBrokerContext

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:122:1`

Describe the authenticated host context that scopes one generated-app broker request.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| caller | property | `unknown` | yes |  |
| scope | property | `{ readonly appId: string; readonly projectId: string; readonly environment: string; }` | yes |  |

## TrustedExternalApiBrokerRequest

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:132:1`

Describe the only client-controlled values accepted by the trusted external API broker.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| apiId | property | `string` | yes |  |
| endpointId | property | `string` | yes |  |
| input | property | `unknown` | no |  |
| operationId | property | `string` | yes |  |

## TrustedExternalApiCredentials

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:148:1`

Describe server-only credentials resolved for a trusted external API operation.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| values | property | `Readonly<Record<string, string>>` | yes |  |

## TrustedExternalApiExecutionResult

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:153:1`

Describe the caller-safe result returned after trusted operation execution.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| publicBody | property | `unknown` | no |  |
| status | property | `number` | yes |  |

## TrustedExternalApiOperation

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:140:1`

Describe an operation resolved exclusively from trusted server-side application state.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| apiId | property | `string` | yes |  |
| credentialsRequired | property | `boolean` | no |  |
| endpointId | property | `string` | yes |  |
| operationId | property | `string` | yes |  |
