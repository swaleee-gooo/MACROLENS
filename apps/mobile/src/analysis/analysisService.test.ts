import { describe, expect, it } from 'vitest';
import { analysisResultSchema } from './analysisSchema';
import { createMockAnalysisService } from './mockAnalysisService';

describe('mock analysis service', () => {
  it('returns schema-valid meal analysis for a local image', async () => {
    const service = createMockAnalysisService();
    const result = await service.analyzeMealPhoto({
      imageUri: 'file://croissant-bowl.jpg',
      userId: 'local-user',
    });

    expect(() => analysisResultSchema.parse(result)).not.toThrow();
    expect(result.meal.mealName).toBe('Poulet, riz et legumes');
    expect(result.meal.confidence).toBe('medium');
    expect(result.uncertaintyReasons).toContain('portion_size_estimated_from_photo');
  });
});
