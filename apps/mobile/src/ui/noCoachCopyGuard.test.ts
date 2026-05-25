import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const forbidden = ['Coach', 'coach quotidien', 'coach IA', 'Today Coach'];
const roots = [join(process.cwd(), 'src')];

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

describe('visible product positioning', () => {
  it('does not reintroduce coach-first copy in app source', () => {
    const files = roots
      .flatMap(listFiles)
      .filter((path) => /\.(ts|tsx)$/.test(path))
      .filter((path) => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'));
    const source = files.map((path) => readFileSync(path, 'utf8')).join('\n');

    for (const term of forbidden) {
      expect(source).not.toContain(term);
    }
  });
});
