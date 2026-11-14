import type {
  ApiApprovedHandler,
  ApiHandler,
  ApiHandlerRegistry,
  ApiOperationBinding,
  ApiResponse,
  ApiRuntime,
  ComposeAuthorizedApiRuntimeOptions,
} from "../../types/api.js";
import { createApiRuntime } from "./createApiRuntime.js";
import { resolveApiOperationBindings } from "./resolveApiOperationBindings.js";

/***
 * Compose declared API operations with host-approved handlers and deny-by-default authorization.
 */
export function composeAuthorizedApiRuntime(
  options: ComposeAuthorizedApiRuntimeOptions,
): ApiRuntime {
  assertCompositionContext(options.context);
  const handlers = resolveAuthorizedHandlers(options);

  return createApiRuntime({ definition: options.definition, handlers });
}

/*** Resolve every declared operation before exposing the API runtime. */
function resolveAuthorizedHandlers(
  options: ComposeAuthorizedApiRuntimeOptions,
): ApiHandlerRegistry {
  const declarations = resolveHandlerDeclarations(options.definition);

  return Object.fromEntries(
    resolveApiOperationBindings(options.definition).map((binding) => {
      const declaration = declarations.get(binding.operationId);
      if (!declaration) {
        throw new Error(
          `No declared handler targets API operation ${binding.operationId}.`,
        );
      }

      const approvedHandler = options.resolveHandler({
        binding,
        declaration,
        context: options.context,
      });
      assertApprovedHandler(binding, declaration.capability, approvedHandler);

      return [
        binding.operationId,
        createAuthorizedHandler(binding, approvedHandler, options),
      ];
    }),
  );
}

/*** Resolve one exact declared capability target for every executable API operation. */
function resolveHandlerDeclarations(
  definition: ComposeAuthorizedApiRuntimeOptions["definition"],
): ReadonlyMap<string, NonNullable<typeof definition.handlers>[string]> {
  const bindings = resolveApiOperationBindings(definition);
  const bindingIds = new Set(bindings.map((binding) => binding.operationId));
  if (bindingIds.size !== bindings.length) {
    throw new Error(
      "API definition declares duplicate endpoint operation ids.",
    );
  }

  const declarations = Object.entries(definition.handlers ?? {});
  const declaredOperationIds = new Set<string>();
  const declaredCapabilityIds = new Set<string>();
  for (const [registryOperationId, declaration] of declarations) {
    if (registryOperationId !== declaration.operationId) {
      throw new Error(
        `Handler declaration key does not match its operation id: ${registryOperationId}.`,
      );
    }
    if (!bindingIds.has(declaration.operationId)) {
      throw new Error(
        `Handler declaration targets unknown API operation ${declaration.operationId}.`,
      );
    }
    if (declaredOperationIds.has(declaration.operationId)) {
      throw new Error(
        `Duplicate handler declaration for API operation ${declaration.operationId}.`,
      );
    }
    if (declaredCapabilityIds.has(declaration.capability)) {
      throw new Error(
        `Duplicate handler declaration for capability ${declaration.capability}.`,
      );
    }
    declaredOperationIds.add(declaration.operationId);
    declaredCapabilityIds.add(declaration.capability);
  }

  if (declaredOperationIds.size !== bindingIds.size) {
    throw new Error(
      "Every API operation requires exactly one handler declaration.",
    );
  }

  return new Map(
    declarations.map(([, declaration]) => [
      declaration.operationId,
      declaration,
    ]),
  );
}

/*** Reject a handler unless the host-approved owner capability exactly matches the declaration. */
function assertApprovedHandler(
  binding: ApiOperationBinding,
  capabilityId: string,
  approvedHandler: ApiApprovedHandler | undefined,
): asserts approvedHandler is ApiApprovedHandler {
  if (!approvedHandler || typeof approvedHandler.handler !== "function") {
    throw new Error(
      `No approved handler is registered for API operation ${binding.operationId}.`,
    );
  }
  if (approvedHandler.capability.id !== capabilityId) {
    throw new Error(
      `Approved handler capability does not match API operation ${binding.operationId}.`,
    );
  }
  if (!approvedHandler.capability.owner.trim()) {
    throw new Error(
      `Approved handler has no owner for API operation ${binding.operationId}.`,
    );
  }
  if (!approvedHandler.capability.access.includes("invoke")) {
    throw new Error(
      `Approved handler is not executable for API operation ${binding.operationId}.`,
    );
  }
}

/*** Deny a request unless the host authorization policy explicitly approves it. */
function createAuthorizedHandler(
  binding: ApiOperationBinding,
  approvedHandler: ApiApprovedHandler,
  options: ComposeAuthorizedApiRuntimeOptions,
): ApiHandler {
  return async (request) => {
    const authorized = await isAuthorizedAsync(binding, request, options);
    if (!authorized) return forbiddenResponse(binding.operationId);

    return approvedHandler.handler(request, {
      binding,
      composition: options.context,
      capability: approvedHandler.capability,
    });
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
