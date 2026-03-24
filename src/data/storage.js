const PROFILE_KEY = 'wm_profile';
const ONBOARDED_KEY = 'wm_onboarded';
const SCHEMA_VERSION = 1;

export const storage = {
  getProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  },
  saveProfile(profile) {
    const toSave = { ...profile, updatedAt: new Date().toISOString(), version: SCHEMA_VERSION };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(toSave));
  },
  isOnboarded() {
    return localStorage.getItem(ONBOARDED_KEY) === 'true';
  },
  setOnboarded(val) {
    localStorage.setItem(ONBOARDED_KEY, String(val));
  },
  clearAll() {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(ONBOARDED_KEY);
  }
};
