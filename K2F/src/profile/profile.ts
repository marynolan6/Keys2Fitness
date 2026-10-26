export type ProfilePreferences = {
  coachUpdates: boolean;
  weeklySummary: boolean;
};

export type EditableProfile = {
  fullName: string;
  email: string;
  heightInches: string;
  age: string;
  preferences: ProfilePreferences;
};

export const defaultProfile: EditableProfile = {
  fullName: "Spencer LeBleu",
  email: "spencer.mo@email.com",
  heightInches: "66",
  age: "29",
  preferences: {
    coachUpdates: true,
    weeklySummary: true,
  },
};

export type ProfileErrors = Partial<Record<"fullName" | "email" | "heightInches" | "age", string>>;

export function validateProfile(profile: EditableProfile): ProfileErrors {
  const errors: ProfileErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const height = Number(profile.heightInches);
  const age = Number(profile.age);

  if (!profile.fullName.trim()) errors.fullName = "Enter your name.";
  if (!emailPattern.test(profile.email.trim())) errors.email = "Enter a valid email address.";
  if (!Number.isInteger(height) || height < 24 || height > 98) {
    errors.heightInches = "Enter a whole-number height between 2'0\" and 8'2\".";
  }
  if (!Number.isInteger(age) || age < 13 || age > 120) {
    errors.age = "Enter an age between 13 and 120.";
  }

  return errors;
}

export function normalizeProfile(profile: EditableProfile): EditableProfile {
  return {
    ...profile,
    fullName: profile.fullName.trim(),
    email: profile.email.trim(),
    heightInches: profile.heightInches.trim(),
    age: profile.age.trim(),
  };
}

export function formatHeightImperial(totalInches: number): string {
  const roundedInches = Math.round(totalInches);
  const feet = Math.floor(roundedInches / 12);
  const inches = roundedInches % 12;
  return `${feet}'${inches}"`;
}

export function centimetersToInches(centimeters: number): number {
  return centimeters / 2.54;
}

export function restoreProfile(value: unknown): EditableProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultProfile;
  const saved = value as Partial<EditableProfile> & { heightCm?: string };
  const legacyHeight = Number(saved.heightCm);
  const heightInches = typeof saved.heightInches === "string"
    ? saved.heightInches
    : typeof saved.heightCm === "string" && Number.isFinite(legacyHeight)
      ? String(Math.round(centimetersToInches(legacyHeight)))
      : defaultProfile.heightInches;

  const restored: EditableProfile = {
    fullName: typeof saved.fullName === "string" ? saved.fullName : defaultProfile.fullName,
    email: typeof saved.email === "string" ? saved.email : defaultProfile.email,
    heightInches,
    age: typeof saved.age === "string" ? saved.age : defaultProfile.age,
    preferences: {
      coachUpdates: typeof saved.preferences?.coachUpdates === "boolean"
        ? saved.preferences.coachUpdates : defaultProfile.preferences.coachUpdates,
      weeklySummary: typeof saved.preferences?.weeklySummary === "boolean"
        ? saved.preferences.weeklySummary : defaultProfile.preferences.weeklySummary,
    },
  };

  const errors = validateProfile(restored);
  return {
    ...restored,
    fullName: errors.fullName ? defaultProfile.fullName : restored.fullName,
    email: errors.email ? defaultProfile.email : restored.email,
    heightInches: errors.heightInches ? defaultProfile.heightInches : restored.heightInches,
    age: errors.age ? defaultProfile.age : restored.age,
  };
}
