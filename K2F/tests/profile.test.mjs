import assert from "node:assert/strict";
import test from "node:test";

import { defaultProfile, normalizeProfile, restoreProfile, validateProfile } from "../src/profile/profile.ts";

test("rejects invalid profile fields and accepts valid imperial measurements", () => {
  assert.deepEqual(validateProfile(defaultProfile), {});
  const errors = validateProfile({
    ...defaultProfile,
    fullName: "  ",
    email: "invalid",
    heightInches: "24.5",
    age: "12",
  });
  assert.deepEqual(Object.keys(errors).sort(), ["age", "email", "fullName", "heightInches"]);
  assert.ok(validateProfile({ ...defaultProfile, heightInches: "99" }).heightInches);
  assert.ok(validateProfile({ ...defaultProfile, age: "30.5" }).age);
  assert.ok(validateProfile({ ...defaultProfile, age: "" }).age);
});

test("trims fields before saving and does not modify the original draft", () => {
  const draft = { ...defaultProfile, fullName: "  Alex Smith ", email: " alex@example.com " };
  const normalized = normalizeProfile(draft);
  assert.equal(normalized.fullName, "Alex Smith");
  assert.equal(normalized.email, "alex@example.com");
  assert.equal(draft.fullName, "  Alex Smith ");
});

test("restores saved preferences and migrates legacy centimeter height", () => {
  const restored = restoreProfile({
    fullName: "Alex Smith",
    email: "alex@example.com",
    heightCm: "168",
    age: "30",
    preferences: { coachUpdates: false, weeklySummary: true },
  });
  assert.equal(restored.heightInches, "66");
  assert.equal(restored.preferences.coachUpdates, false);
  assert.deepEqual(restoreProfile(restored), restored);
});

test("invalid stored data falls back to defaults rather than breaking the screen", () => {
  assert.deepEqual(restoreProfile(null), defaultProfile);
  assert.deepEqual(restoreProfile({ preferences: null, heightCm: "bad" }), defaultProfile);
  assert.deepEqual(restoreProfile({ fullName: 7, preferences: { coachUpdates: "no" } }), defaultProfile);
  assert.deepEqual(restoreProfile({ fullName: " ", heightInches: "0", age: "121" }), defaultProfile);
});
