import type {
  ApiHandler,
  ApiHandlerRegistry,
  ApiOperationBinding,
  ApiResponse,
  ComposeAuthorizedApiRuntimeOptions,
} from "../../types/api.js";
import { createApiRuntime } from "./createApiRuntime.js";
import { resolveApiOperationBindings } from "./resolveApiOperationBindings.js";

/***
 * Compose declared API operations with host-approved handlers and deny-by-default authorization.
 */
export function composeAuthorizedApiRuntime(
  options: ComposeAuthorizedApiRuntimeOptions,
) {
  assertCompositionContext(options.context);
  const handlers = resolveAuthorizedHandlers(options);

  return createApiRuntime({ definition: options.definition, handlers });
}

/*** Resolve every declared operation before exposing the API runtime. */
function resolveAuthorizedHandlers(
  options: ComposeAuthorizedApiRuntimeOptions,
): ApiHandlerRegistry {
  return Object.fromEntries(
    resolveApiOperationBindings(options.definition).map((binding) => {
      const handler = options.resolveHandler({
        binding,
        context: options.context,
      });
      if (!handler) {
        throw new Error(
          `No approved handler is registered for API operation ${binding.operationId}.`,
        );
      }

      return [
        binding.operationId,
        createAuthorizedHandler(binding, handler, options),
      ];
    }),
  );
}

/*** Deny a request unless the host authorization policy explicitly approves it. */
function createAuthorizedHandler(
  binding: ApiOperationBinding,
  handler: ApiHandler,
  options: ComposeAuthorizedApiRuntimeOptions,
): ApiHandler {
  return async (request) => {
    const authorized = await isAuthorizedAsync(binding, request, options);
    if (!authorized) return forbiddenResponse(binding.operationId);

    return handler(request, { binding, composition: options.context });
  };
}

/*** Treat a failing authorization policy exactly like an explicit denial. */
async function isAuthorizedAsync(
  binding: ApiOperationBinding,
  request: Parameters<ApiHandler>[0],
  options: ComposeAuthorizedApiRuntimeOptions,
): Promise<boolean> {
  try {
    return await options.authorizeAsync({
      binding,
      context: options.context,
      request,
    });
  } catch {
    return false;
  }
}

/*** Reject incomplete composition scope before any HTTP route can be registered. */
function assertCompositionContext(
  context: ComposeAuthorizedApiRuntimeOptions["context"],
): void {
  if (!context.appId.trim() || !context.projectId.trim()) {
    throw new Error(
      "Authorized API composition requires non-empty app and project ids.",
    );
  }
}

/*** Return a normalized authorization failure without invoking the selected handler. */
function forbiddenResponse(operationId: string): ApiResponse {
  return {
    status: 403,
    headers: { "content-type": "application/json" },
    body: { error: { code: "forbidden", operationId } },
  };
}
