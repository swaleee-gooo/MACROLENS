import { handleLookupPackagedFood } from './handler.ts';

Deno.serve((request) => handleLookupPackagedFood(request));
