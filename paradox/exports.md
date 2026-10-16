# Public API

## ApiHandler

Kind: `unknown`
Module: `src/types/api.ts`
Source: `src/types/api.ts:42:1`

## ApiHandlerContext

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:38:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| binding | property | `ApiOperationBinding` | yes |  |

## ApiHandlerRegistry

Kind: `unknown`
Module: `src/types/api.ts`
Source: `src/types/api.ts:47:1`

## ApiHandlerResponse

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:26:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| body | property | `unknown` | no |  |
| headers | property | `Readonly<Record<string, string>>` | no |  |
| status | property | `number` | no |  |

## ApiOperationBinding

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:8:1`

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
Source: `src/types/api.ts:17:1`

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
Source: `src/types/api.ts:32:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| body | property | `unknown` | no |  |
| headers | property | `Readonly<Record<string, string>>` | yes |  |
| status | property | `number` | yes |  |

## ApiRuntime

Kind: `type`
Module: `src/types/api.ts`
Source: `src/types/api.ts:49:1`

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
Source: `src/types/api.ts:56:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| fromApiResponseAsync | method | `(response: ApiResponse, request: TRequest, binding: ApiOperationBinding) => Promise<TResponse>` | yes |  |
| toApiRequestAsync | method | `(request: TRequest, binding: ApiOperationBinding) => Promise<ApiRequest>` | yes |  |

## CAPABILITIES

Kind: `value`
Module: `src/capabilities/index.ts`
Source: `src/capabilities/index.ts:9:14`

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
