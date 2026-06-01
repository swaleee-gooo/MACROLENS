import { describe, expect, it } from 'vitest';
import { validateBenchmarkCasesForRelease } from './benchmark-case-validation.mjs';

function caseWithUrl(index) {
  return {
    id: `case-${index}`,
    label: `Case ${index}`,
    category: 'test',
    imageUrl: `https://example.com/case-${index}.jpg`,
    marketingEligible: false,
  };
}

describe('validateBenchmarkCasesForRelease', () => {
  it('blocks a repeatability release run with fewer than 10 same-photo cases', () => {
    const result = validateBenchmarkCasesForRelease({
      cases: Array.from({ length: 9 }, (_, index) => caseWithUrl(index + 1)),
      minCases: 10,
      requireImageUrls: true,
      gateName: 'repeatability',
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain('repeatability_requires_at_least_10_cases');
  });

  it('passes release validation when all required cases have unique ids and HTTPS image URLs', () => {
    const result = validateBenchmarkCasesForRelease({
      cases: Array.from({ length: 10 }, (_, index) => caseWithUrl(index + 1)),
      minCases: 10,
      requireImageUrls: true,
      gateName: 'repeatability',
    });

    expect(result).toEqual({ passed: true, failures: [] });
  });

  it('blocks release validation when a benchmark case is missing a real image URL', () => {
    const cases = Array.from({ length: 10 }, (_, index) => caseWithUrl(index + 1));
    cases[4] = { ...cases[4], imageUrl: null };

    const result = validateBenchmarkCasesForRelease({
      cases,
      minCases: 10,
      requireImageUrls: true,
      gateName: 'nutrition',
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain('nutrition_case_5_missing_https_image_url');
  });
});
