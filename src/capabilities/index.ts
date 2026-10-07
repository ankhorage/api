import type { Capability } from "@ankhorage/contracts/capabilities";

/**
 * Static API package capabilities.
 *
 * Executable API operations are dynamic and are projected from authored API definitions by
 * `projectApiCapabilities`; they are intentionally not duplicated in this static catalog.
 */
export const CAPABILITIES = [] as const satisfies readonly Capability[];
