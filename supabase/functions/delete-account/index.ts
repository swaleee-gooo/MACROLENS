import { handleDeleteAccountRequest } from './handler.ts';

Deno.serve((request) => handleDeleteAccountRequest(request));
