import {
  type Capability,
  isCapabilityId,
} from "@ankhorage/contracts/capabilities";
import type {
  DataOperationConfig,
  DataOperationParameter,
  DataOperationRequest,
  DataSchema,
  DataSchemaSlot,
  InternalRestApiDefinition,
} from "@ankhorage/contracts/data";

/*** Project one internal REST API definition into canonical invocable API capabilities. */
export function projectApiCapabilities(
  definition: InternalRestApiDefinition,
): readonly Capability[] {
  const capabilities = Object.values(definition.endpoints).flatMap((endpoint) =>
    Object.values(endpoint.operations).map((operation) =>
      projectApiOperationCapability(definition, operation),
    ),
  );

  assertUniqueCapabilityIds(capabilities);
  return [...capabilities].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

/*** Project one authored API operation into its stable semantic capability descriptor. */
function projectApiOperationCapability(
  definition: InternalRestApiDefinition,
  operation: DataOperationConfig,
): Capability {
  const id = `api.${definition.id}.${operation.id}`;
  if (!isCapabilityId(id)) {
    throw new Error(
      `API operation projects to an invalid capability id: ${definition.id} / ${operation.id}`,
    );
  }

  const input = projectOperationInput(operation.request);
  const output = projectSchemaSlot(operation.response);

  return {
    id,
    owner: "@ankhorage/api",
    access: ["invoke"],
    binding: { kind: "api", bindableAs: ["target"] },
    label: operation.name ?? operation.id,
    ...(operation.description === undefined
      ? {}
      : { description: operation.description }),
    ...(input === undefined ? {} : { input }),
    ...(output === undefined ? {} : { output }),
  };
}

/*** Project request parameters and request body into the flat operation input value space. */
function projectOperationInput(
  request: DataOperationRequest | undefined,
): DataSchemaSlot | undefined {
  if (request === undefined) return undefined;

  const bodySchema = projectSchemaSlotAsSchema(request);
  const parameterSchema = projectOperationParameters(request.parameters);

  if (bodySchema === undefined) {
    return parameterSchema === undefined
      ? undefined
      : { schema: parameterSchema };
  }
  if (parameterSchema === undefined) return projectSchemaSlot(request);

  return {
    schema: {
      allOf: [bodySchema, parameterSchema],
    },
  };
}

/*** Project transport parameters into the flat object consumed by Runtime operation bindings. */
function projectOperationParameters(
  parameters: readonly DataOperationParameter[] | undefined,
): DataSchema | undefined {
  if (parameters === undefined || parameters.length === 0) return undefined;

  const properties: Record<string, DataSchema> = {};
  const required: string[] = [];
  for (const parameter of parameters) {
    if (Object.hasOwn(properties, parameter.name)) {
      throw new Error(
        `Duplicate API operation input parameter: ${parameter.name}`,
      );
    }
    properties[parameter.name] = projectOperationParameterSchema(parameter);
    if (parameter.required === true) required.push(parameter.name);
  }

  return {
    type: "object",
    properties,
    ...(required.length === 0 ? {} : { required: [...required].sort() }),
  };
}

/*** Preserve one parameter's schema reference plus parameter-specific description/default metadata. */
function projectOperationParameterSchema(
  parameter: DataOperationParameter,
): DataSchema {
  const schema = projectSchemaSlotAsSchema(parameter) ?? {};
  return {
    ...schema,
    ...(parameter.description === undefined
      ? {}
      : { description: parameter.description }),
    ...(parameter.default === undefined ? {} : { default: parameter.default }),
  };
}

/*** Preserve exactly one portable schema slot when the operation already owns one. */
function projectSchemaSlot(
  slot: DataSchemaSlot | undefined,
): DataSchemaSlot | undefined {
  if (slot?.schema !== undefined) return { schema: slot.schema };
  if (slot?.schemaRef !== undefined) return { schemaRef: slot.schemaRef };
  return undefined;
}

/*** Convert a schema slot to an embeddable schema while preserving authored schema references. */
function projectSchemaSlotAsSchema(
  slot: DataSchemaSlot | undefined,
): DataSchema | undefined {
  if (slot?.schema !== undefined) return slot.schema;
  if (slot?.schemaRef !== undefined) return { ref: slot.schemaRef };
  return undefined;
}

/*** Reject API definitions whose endpoint operations collide in the projected capability namespace. */
function assertUniqueCapabilityIds(capabilities: readonly Capability[]): void {
  const seen = new Set<Capability["id"]>();
  for (const capability of capabilities) {
    if (seen.has(capability.id)) {
      throw new Error(
        `Duplicate projected API capability id: ${capability.id}`,
      );
    }
    seen.add(capability.id);
  }
}
