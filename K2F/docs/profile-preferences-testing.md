# Profile Preferences Acceptance Testing

This checklist covers `K2F-18` and subtasks `K2F-241`, `K2F-242`, and
`K2F-243`. The profile prototype stores edits locally with AsyncStorage until
the authenticated profile API is available.

## Static checks

Run from `K2F`:

```bash
npm run lint
npx tsc --noEmit
node --test tests/profile.test.mjs
git diff --check
npx expo export --platform android
```

## Profile and preferences

1. Open the client Profile tab.
2. Confirm current name, email, height, age, coach updates, and weekly summary are visible.
3. Tap Edit and confirm the permitted fields and preference switches are clearly identified.
4. Change each profile field and both preference switches.
5. Tap Save changes and confirm `Profile and preferences saved.` appears.
   Confirm changes to height and age also update the Profile progress statistics,
   and changing the name updates the Home greeting.
6. Navigate to Home, return to Profile, and confirm every saved value remains.
7. Fully reload the app and confirm the values remain after AsyncStorage reload.
8. Tap Edit, change values, tap Cancel, and confirm the previously saved values remain.

## Validation

Verify each invalid value shows a field-level message and prevents saving:

- Empty name.
- Invalid email.
- Height below 24 inches or above 98 inches.
- Fractional height (the editor stores whole inches).
- Non-integer age, age below 13, or age above 120.

After each failed validation, confirm the last saved values are unchanged.

## Save failure

Temporarily make `saveProfile` reject in `src/profile/profileStorage.ts`, then:

1. Edit a saved profile value.
2. Tap Save changes.
3. Confirm `Your changes could not be saved. Your existing information is unchanged.` appears.
4. Confirm the previously saved profile remains visible after leaving and returning to Profile.
5. Restore the rejection test and verify the normal save path again.

## Responsive and navigation checks

On Android, repeat the profile flow at 320 dp, approximately 390 dp, and tablet
width. Repeat at 1.5x font scale. Confirm fields, switches, feedback, keyboard
scrolling, and buttons remain reachable without clipping or overlap. Verify
Android Back and tab navigation preserve the saved values.

## Acceptance mapping

- `K2F-241`: current information, editable fields, and available preferences are visible.
- `K2F-242`: validation, valid saves, cancel behavior, and saved values after return are covered.
- `K2F-243`: success feedback, save-error feedback, and preservation of existing values are covered.

## Verification results

- `npm run lint`, `npx tsc --noEmit`, `git diff --check`, and
  `npx expo export --platform android` passed on the profile-preferences branch.
- `node --test tests/profile.test.mjs` exercises validation, trimmed values,
  malformed stored data, and legacy centimeter-height migration.
- On the Android emulator at 1080x2400 / 420 dpi (approximately 411 dp wide),
  the client dashboard opened successfully and the Profile tab displayed the
  saved profile, imperial height, imperial weight, and imperial body measurements.
- The Edit flow displayed all fields and switches. Scrolling exposed both
  actions without clipping; tapping Save changes displayed the successful-save
  confirmation.
- At 320 dp and 1.5x font scale, Profile and Edit fields/switches/actions fit
  inside the viewport and are reachable by scrolling. The Progress statistics
  switch to two columns so their labels remain readable. At approximately
  390 dp and tablet width the Profile display and spacing render without
  clipping. The Home card and goal also fit at tablet width.
- Device-level invalid-save, forced-save-failure, changed-values-after-relaunch,
  and changed-name-on-Home checks remain unverified. Do not claim those were
  tested on-device from this run; complete steps above during PR review.
