import type { StorageAdapter } from './mealRepository';

const ENTITLEMENT_KEY = 'macrolens.entitlement.v1';

export type EntitlementState = {
  isPremium: boolean;
  source: 'none' | 'local_dev' | 'store';
  productId: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
};

export type EntitlementRepository = {
  getEntitlement(): Promise<EntitlementState>;
  saveEntitlement(state: EntitlementState): Promise<void>;
  clearEntitlement(): Promise<void>;
};

const lockedState: EntitlementState = {
  isPremium: false,
  source: 'none',
  productId: null,
  expiresAt: null,
  updatedAt: null,
};

function normalizeEntitlementState(raw: Partial<EntitlementState>): EntitlementState {
  return {
    isPremium: Boolean(raw.isPremium),
    source: raw.source === 'local_dev' || raw.source === 'store' ? raw.source : 'none',
    productId: raw.productId ?? null,
    expiresAt: raw.expiresAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export function createEntitlementRepository(storage: StorageAdapter): EntitlementRepository {
  return {
    async getEntitlement() {
      const raw = await storage.getItem(ENTITLEMENT_KEY);
      if (!raw) {
        return lockedState;
      }

      try {
        return normalizeEntitlementState(JSON.parse(raw) as Partial<EntitlementState>);
      } catch {
        return lockedState;
      }
    },

    async saveEntitlement(state) {
      await storage.setItem(ENTITLEMENT_KEY, JSON.stringify(state));
    },

    async clearEntitlement() {
      if (storage.removeItem) {
        await storage.removeItem(ENTITLEMENT_KEY);
        return;
      }

      await storage.setItem(ENTITLEMENT_KEY, '');
    },
  };
}
