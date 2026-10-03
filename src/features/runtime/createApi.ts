import type { InternalRestApiDefinition } from '@ankhorage/contracts';

import type { Api, ApiOperationHandlerRegistry } from '../../types/api.js';
import { executeApiOperationAsync } from './executeApiOperationAsync.js';

interface CreateApiInput {
  readonly definition: InternalRestApiDefinition;
  readonly handlers: ApiOperationHandlerRegistry;
}

/*** Bind one portable internal API definition to its executable operation handlers. */
export function createApi(input: CreateApiInput): Api {
  return {
    definition: input.definition,
    executeAsync: (dispatchInput) =>
      executeApiOperationAsync({
        definition: input.definition,
        handlers: input.handlers,
        input: dispatchInput,
      }),
  };
}
