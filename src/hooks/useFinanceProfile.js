import { useState } from 'react';
import { storage } from '../data/storage.js';

export function useFinanceProfile() {
  const [profile, setProfile] = useState(() => storage.getProfile());

  function saveProfile(p) {
    storage.saveProfile(p);
    setProfile(p);
  }

  return { profile, saveProfile };
}
