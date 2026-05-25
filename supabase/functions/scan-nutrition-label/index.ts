import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { handleScanNutritionLabelRequest } from './handler.ts';

serve((request) => handleScanNutritionLabelRequest(request, { env: Deno.env }));
