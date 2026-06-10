import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createRateLimiter } from '../_shared/rateLimit.ts';
import { handleScanNutritionLabelRequest } from './handler.ts';

const checkRateLimit = createRateLimiter('scan-nutrition-label', Deno.env);

serve((request) => handleScanNutritionLabelRequest(request, { env: Deno.env, checkRateLimit }));
