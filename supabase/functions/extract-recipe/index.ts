import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createRateLimiter } from '../_shared/rateLimit.ts';
import { handleExtractRecipeRequest } from './handler.ts';

const checkRateLimit = createRateLimiter('extract-recipe', Deno.env);

serve((request) => handleExtractRecipeRequest(request, { env: Deno.env, checkRateLimit }));
