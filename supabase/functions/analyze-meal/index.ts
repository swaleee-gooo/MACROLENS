import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createRateLimiter } from '../_shared/rateLimit.ts';
import { handleAnalyzeMealRequest } from './handler.ts';

const checkRateLimit = createRateLimiter('analyze-meal', Deno.env);

serve((request) => handleAnalyzeMealRequest(request, { env: Deno.env, checkRateLimit }));
