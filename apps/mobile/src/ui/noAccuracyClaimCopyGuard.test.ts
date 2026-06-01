import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const forbiddenClaims = [
  /\baccurate\b/i,
  /\baccuracy\b/i,
  /\bprecise\b/i,
  /\bprecision\b/i,
  /\bpr(?:e|\u00e9)cis(?:e|ion)?\b/i,
];
const roots = [join(process.cwd(), 'src')];

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

describe('visible product accuracy claims', () => {
  it('does not promise accuracy or precision in visible app source', () => {
    const files = roots
      .flatMap(listFiles)
      .filter((path) => /\.(ts|tsx)$/.test(path))
      .filter((path) => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'));
    const source = files.map((path) => readFileSync(path, 'utf8')).join('\n');

    for (const forbiddenClaim of forbiddenClaims) {
      expect(source).not.toMatch(forbiddenClaim);
    }
  });
});
