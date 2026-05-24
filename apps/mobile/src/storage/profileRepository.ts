import type { UserProfile } from '../domain/types';
import type { StorageAdapter } from './mealRepository';

const PROFILE_KEY = 'macrolens.profile.v1';

export type ProfileRepository = {
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;
  clearProfile(): Promise<void>;
};

export function createProfileRepository(storage: StorageAdapter): ProfileRepository {
  return {
    async getProfile() {
      const raw = await storage.getItem(PROFILE_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    },

    async saveProfile(profile) {
      await storage.setItem(PROFILE_KEY, JSON.stringify(profile));
    },

    async clearProfile() {
      if (storage.removeItem) {
        await storage.removeItem(PROFILE_KEY);
        return;
      }

      await storage.setItem(PROFILE_KEY, '');
    },
  };
}
