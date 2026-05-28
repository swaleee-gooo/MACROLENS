import { describe, expect, it } from 'vitest';
import { searchFoodEntries } from './foodSearch';

describe('food search', () => {
  it('returns popular foods when the query is empty', () => {
    const results = searchFoodEntries('', 3);

    expect(results).toHaveLength(3);
    expect(results[0].name).toBe('Chicken breast, grilled');
  });

  it('matches foods by name and alias', () => {
    const results = searchFoodEntries('poulet', 5);

    expect(results.map((result) => result.name)).toContain('Chicken breast, grilled');
  });
});
