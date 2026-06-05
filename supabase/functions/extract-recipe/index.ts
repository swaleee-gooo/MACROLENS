import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { handleExtractRecipeRequest } from './handler.ts';

serve((request) => handleExtractRecipeRequest(request, { env: Deno.env }));
