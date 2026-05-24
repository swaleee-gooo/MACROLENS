import { describe, expect, it } from 'vitest';
import { buildBadgesViewModel } from './badgesViewModel';

describe('buildBadgesViewModel', () => {
  it('unlocks streak and protein badges', () => {
    const vm = buildBadgesViewModel({ streakDays: 7, proteinTargetDays: 7, scanCount: 3 });

    expect(vm.unlocked.map((badge) => badge.id)).toContain('protein-7');
    expect(vm.unlocked.map((badge) => badge.id)).toContain('streak-7');
    expect(vm.locked.length).toBeGreaterThan(0);
  });
});
