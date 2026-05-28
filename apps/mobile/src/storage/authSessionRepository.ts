import type { MacroLensSession } from '../supabase/client';
import type { StorageAdapter } from './mealRepository';

const AUTH_SESSION_KEY = 'macrolens.auth.session.v1';

export type AuthSessionRepository = {
  getSession(): Promise<MacroLensSession>;
  saveSession(session: MacroLensSession): Promise<void>;
  clearSession(): Promise<void>;
};

export function createAuthSessionRepository(storage: StorageAdapter): AuthSessionRepository {
  return {
    async getSession() {
      const raw = await storage.getItem(AUTH_SESSION_KEY);
      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw) as MacroLensSession;
      } catch {
        return null;
      }
    },

    async saveSession(session) {
      if (!session) {
        await this.clearSession();
        return;
      }

      await storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    },

    async clearSession() {
      if (storage.removeItem) {
        await storage.removeItem(AUTH_SESSION_KEY);
        return;
      }

      await storage.setItem(AUTH_SESSION_KEY, '');
    },
  };
}
