import type { UnitSystem } from '../domain/units';
import type { StorageAdapter } from './mealRepository';

const UNIT_SYSTEM_KEY = 'macrolens.unitSystem';

// US-market default: the app launches in imperial (lbs, ft). Existing metric
// profiles keep their stored data untouched — only the display flips, and the
// Settings toggle goes back to metric in two taps.
const DEFAULT_UNIT_SYSTEM: UnitSystem = 'imperial';

export type UnitPreferenceRepository = {
  getUnitSystem(): Promise<UnitSystem>;
  saveUnitSystem(system: UnitSystem): Promise<void>;
};

function normalizeUnitSystem(raw: string | null): UnitSystem {
  return raw === 'metric' || raw === 'imperial' ? raw : DEFAULT_UNIT_SYSTEM;
}

export function createUnitPreferenceRepository(storage: StorageAdapter): UnitPreferenceRepository {
  return {
    async getUnitSystem() {
      return normalizeUnitSystem(await storage.getItem(UNIT_SYSTEM_KEY));
    },

    async saveUnitSystem(system) {
      await storage.setItem(UNIT_SYSTEM_KEY, system);
    },
  };
}
