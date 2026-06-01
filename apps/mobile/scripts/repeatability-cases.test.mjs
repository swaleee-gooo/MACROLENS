import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateBenchmarkCasesForRelease } from './benchmark-case-validation.mjs';

describe('repeatability case file', () => {
  it('contains at least 10 executable HTTPS same-photo cases for the release gate', () => {
    const cases = JSON.parse(readFileSync('scripts/repeatability-cases.json', 'utf8'));

    const result = validateBenchmarkCasesForRelease({
      cases,
      minCases: 10,
      requireImageUrls: true,
      gateName: 'repeatability',
    });

    expect(result).toEqual({ passed: true, failures: [] });
  });
});
