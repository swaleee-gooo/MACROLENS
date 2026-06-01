import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateBenchmarkCasesForRelease } from './benchmark-case-validation.mjs';

describe('nutrition benchmark case file', () => {
  it('keeps the full 50-case benchmark machine-readable', () => {
    const cases = JSON.parse(readFileSync('scripts/nutrition-benchmark-cases.json', 'utf8'));

    const result = validateBenchmarkCasesForRelease({
      cases,
      minCases: 50,
      requireImageUrls: false,
      gateName: 'nutrition',
    });

    expect(cases).toHaveLength(50);
    expect(result).toEqual({ passed: true, failures: [] });
  });

  it('has HTTPS image URLs for every case required by the release nutrition gate', () => {
    const cases = JSON.parse(readFileSync('scripts/nutrition-benchmark-cases.json', 'utf8'));

    const result = validateBenchmarkCasesForRelease({
      cases,
      minCases: 50,
      requireImageUrls: true,
      gateName: 'nutrition',
    });

    expect(result).toEqual({ passed: true, failures: [] });
  });
});
