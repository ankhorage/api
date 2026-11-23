import type {
  ApiResponse,
  CreateTrustedExternalApiBrokerOptions,
  TrustedExternalApiBroker,
  TrustedExternalApiBrokerContext,
  TrustedExternalApiBrokerRequest,
  TrustedExternalApiOperation,
} from "../../types/api.js";

/***
 * Create a framework-neutral, fail-closed boundary for generated-app external API operations.
 *
 * The caller supplies operation identity and input only; trusted host ports own target,
 * credentials, authorization, validation, and caller-safe result projection.
 * @security createTrustedExternalApiBroker.test.ts#denies before resolving secrets or executing network work
 */
export function createTrustedExternalApiBroker(
  options: CreateTrustedExternalApiBrokerOptions,
): TrustedExternalApiBroker {
  return {
    executeAsync: async ({ context, request }) =>
      executeTrustedOperationAsync(options, context, request),
  };
}

/*** Authorize before resolving any operation, credential, or outbound execution resource. */
async function executeTrustedOperationAsync(
  options: CreateTrustedExternalApiBrokerOptions,
  context: TrustedExternalApiBrokerContext,
  request: TrustedExternalApiBrokerRequest,
): Promise<ApiResponse> {
  if (!isTrustedBrokerContext(context) || hasCallerSuppliedTarget(request)) {
    return brokerErrorResponse(403, "forbidden");
  }
  if (!(await isAuthorizedAsync(options, context, request))) {
    return brokerErrorResponse(403, "forbidden");
  }

  const operation = await resolveOperationAsync(options, context, request);
  if (!operation) return brokerErrorResponse(404, "operation_not_found");

  try {
    const input = await options.validateInputAsync({
      operation,
      input: request.input,
    });
    const credentials = await resolveCredentialsAsync(
      options,
      context,
      operation,
    );
    if (operation.credentialsRequired === true && credentials === undefined) {
      return brokerErrorResponse(424, "credential_unavailable");
    }
    const result = await options.executeOperationAsync({
      operation,
      input,
      ...(credentials === undefined ? {} : { credentials }),
    });
    return publicResponse(result.status, result.publicBody);
  } catch {
    return brokerErrorResponse(502, "external_operation_failed");
  }
}

/*** Resolve a secret only for an operation whose trusted definition explicitly requires one. */
async function resolveCredentialsAsync(
  options: CreateTrustedExternalApiBrokerOptions,
  context: TrustedExternalApiBrokerContext,
  operation: TrustedExternalApiOperation,
) {
  if (operation.credentialsRequired !== true) return undefined;
  return options.resolveCredentialsAsync({ scope: context.scope, operation });
}

/*** Treat absent caller identity or incomplete project scope as a denial. */
function isTrustedBrokerContext(
  context: TrustedExternalApiBrokerContext,
): boolean {
  return (
    context.caller !== undefined &&
    context.caller !== null &&
    isNonEmpty(context.scope.appId) &&
    isNonEmpty(context.scope.projectId) &&
    isNonEmpty(context.scope.environment)
  );
}

/*** Reject target-selection fields that are never part of the broker's public request contract. */
function hasCallerSuppliedTarget(
  request: TrustedExternalApiBrokerRequest,
): boolean {
  return ["url", "host", "baseUrl", "upstreamUrl", "target"].some((key) =>
    Object.hasOwn(request, key),
  );
}

/*** Treat a missing, throwing, or false authorization decision as a denial. */
async function isAuthorizedAsync(
  options: CreateTrustedExternalApiBrokerOptions,
  context: TrustedExternalApiBrokerContext,
  request: TrustedExternalApiBrokerRequest,
): Promise<boolean> {
  try {
    return await options.authorizeAsync({ context, request });
  } catch {
    return false;
  }
}

/*** Resolve only the exact operation whose server-side identity matches the caller request. */
async function resolveOperationAsync(
  options: CreateTrustedExternalApiBrokerOptions,
  context: TrustedExternalApiBrokerContext,
  request: TrustedExternalApiBrokerRequest,
): Promise<TrustedExternalApiOperation | undefined> {
  try {
    const operation = await options.resolveOperationAsync({
      scope: context.scope,
      request,
    });
    return operation !== undefined &&
      operationMatchesRequest(operation, request)
      ? operation
      : undefined;
  } catch {
    return undefined;
  }
}

/*** Prevent a resolver from substituting another declared API, endpoint, or operation. */
function operationMatchesRequest(
  operation: TrustedExternalApiOperation,
  request: TrustedExternalApiBrokerRequest,
): boolean {
  return (
    operation.apiId === request.apiId &&
    operation.endpointId === request.endpointId &&
    operation.operationId === request.operationId
  );
}

/*** Return a result contract that never exposes credential headers or provider diagnostics. */
function publicResponse(status: number, publicBody: unknown): ApiResponse {
  return {
    status:
      Number.isInteger(status) && status >= 100 && status <= 599 ? status : 502,
    headers: {},
    ...(publicBody === undefined ? {} : { body: publicBody }),
  };
}

/*** Produce a stable caller-visible error without leaking upstream configuration or exception text. */
function brokerErrorResponse(status: number, code: string): ApiResponse {
  return {
    status,
    headers: { "content-type": "application/json" },
    body: { error: { code } },
  };
}

/*** Identify one non-blank trusted scope segment. */
function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}
