import { isCapabilityId, type Capability } from "@ankhorage/contracts/capabilities";
import type { ApiDefinition, DataSchemaSlot } from "@ankhorage/contracts/data";

/*** Project every canonical API operation into the shared capability namespace. */
export function resolveApiOperationCapabilities(
  definition: ApiDefinition,
): readonly Capability[] {
  const capabilities = Object.values(definition.endpoints).flatMap((endpoint) =>
    Object.values(endpoint.operations).map((operation) => {
      const id = `api.${definition.id}.${operation.id}`;
      if (!isCapabilityId(id)) {
        throw new Error(`API operation capability id is invalid: ${id}`);
      }

      const input = projectDataSchemaSlot(operation.request);
      const output = projectDataSchemaSlot(operation.response);
      return {
        id,
        owner: "@ankhorage/api",
        access: ["invoke"],
        binding: { kind: "api", bindableAs: ["target"] },
        label: operation.name ?? operation.id,
        ...(operation.description === undefined ? {} : { description: operation.description }),
        ...(input === undefined ? {} : { input }),
        ...(output === undefined ? {} : { output }),
      } satisfies Capability;
    }),
  );

  const ids = capabilities.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`API definition ${definition.id} projects duplicate capability ids.`);
  }

  return capabilities.sort((left, right) => left.id.localeCompare(right.id));
}

/*** Copy only the portable schema-slot fields from richer operation request/response metadata. */
function projectDataSchemaSlot(slot: DataSchemaSlot | undefined): DataSchemaSlot | undefined {
  if (slot?.schema === undefined && slot?.schemaRef === undefined) return undefined;
  return {
    ...(slot.schema === undefined ? {} : { schema: slot.schema }),
    ...(slot.schemaRef === undefined ? {} : { schemaRef: slot.schemaRef }),
  };
}
