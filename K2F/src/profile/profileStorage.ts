import AsyncStorage from "@react-native-async-storage/async-storage";

import { defaultProfile, EditableProfile, restoreProfile } from "./profile";

const PROFILE_STORAGE_KEY = "k2f.profile.preferences";

export async function loadProfile(): Promise<EditableProfile> {
  const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
  if (!stored) return defaultProfile;

  try {
    return restoreProfile(JSON.parse(stored));
  } catch {
    return defaultProfile;
  }
}

export async function saveProfile(profile: EditableProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
