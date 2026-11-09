# Coach workout library and builder — local prototype

## Entry points and workflow

- Coach **+ → Workout Library** replaces the menu's Client List shortcut. Client List remains one of the four main tabs.
- Search templates, create a workout, or edit/duplicate an existing template. Three templates are seeded from the existing workout examples on first use only; an intentionally empty saved library stays empty.
- Edit the name, optional duration, and workout-level coach note. Add catalog/custom exercises, edit sets/reps/weight in pounds, instructions, exercise-level coach notes, and an optional alternative exercise name. Add/remove rows independently.
- Keep **Save as reusable template** checked to save a plan for reuse. Select one or more demo clients to assign it, or turn off reusable storage to assign a one-off copy.
- Library assignment uses the selected template and selected clients. Delete opens a confirmation with a cancel action.
- Assigned workouts are independent snapshots. Template edits/deletion never rewrite already assigned notes, prescriptions, IDs, or saved workout progress. Reassigning creates a new workout ID; earlier assignments remain available for session restoration.
- The coach's client-workouts screen reads actual local assignments and provides builder/library links and client previews rather than the old hard-coded plan/completion summary.

## Client display and scope

This is the explicitly agreed device-local prototype, not Firebase assignment synchronization.

- **Demo workout client** on client home identifies whose workout assignments are being previewed. Its picker changes workout preview context and the greeting's first name, not the signed-in account or the other existing demo dashboard widgets.
- Workout-level notes appear in the existing collapsible coach note. Exercise notes appear under Coach recommendation in View Details; the optional alternative has its own section.
- The dashboard, workout route, and client quick-access Workout link use the same assignment source. Active session selection and route access are restricted to the selected demo client's assignment IDs. The original example workouts remain the fallback for demo client 1 only.
- Current and earlier assigned IDs remain resolvable after template deletion, so K2F-48 checkpoints continue to load.
- The local library and preview selection persist in `keys2fitness:workout-library:v1` through AsyncStorage. Existing workout-session keys remain unchanged.
- Authenticated coach ownership, real account-to-client mapping, cross-device sync, and Firebase rules are future integration work.

## Automated verification

```bash
node --test tests/workout-library.test.mjs tests/workout-session.test.mjs tests/set-performance.test.mjs tests/workout-progress.test.mjs tests/workout-timer.test.mjs
npx tsc --noEmit
```

New library tests cover validation; decimal lb/bodyweight and optional notes/duration; multi-client snapshots; note/alternative propagation; reload persistence; independent duplication/editing; deletion preserving assignments; per-client preview isolation; latest versus historical assignment lookup; assignment-only drafts; unavailable clients/templates; corrupt saved data; failed writes; and concurrent save recovery without lost updates.

Changed-file ESLint, TypeScript, and diff checks pass. Full-project Expo lint still reports the existing 33 errors and 2 warnings in login, client progress, coach check-ins, root index, and DoorOpeningIntro.

## Android verification

Used Expo Go on the connected emulator:

- Created a Bench Press workout using the catalog, changed reps/weight to **3 × 8 at 135 lb**, added Push-up as an alternative, and saved/assigned it to Alex Morgan.
- Edited the template, assigned an updated copy with a workout note and a separate exercise note, and opened it through the demo client preview. Verified the workout-level note, exercise recommendation, alternative, and prescription in the client screens.
- Restarted Expo Go: assignment and selected demo client remained available. Switched preview to Spencer and verified Alex's assigned workout was not displayed.
- Started the assigned workout, completed its exercise, left to the dashboard, continued it, paused, and ended it successfully. Client performance remained separate from the template's targets.
- Duplicated a template, independently edited the copy, canceled deletion, then confirmed deletion of that copy. Checked search with no matching results.
- Opened the coach's actual client-workouts list and verified its assigned copy. Opened the coach menu and verified Workout Library replaces Client List there.
- Checked library/editor controls at ~390 dp, 320 dp, 320 dp with 1.5× text, and 800 dp tablet width. Prescriptions, note fields, client selection, and save controls were reachable by scrolling. Tablet prescriptions use columns; phones stack the fields.
- Checked delete confirmation and cancellation at phone widths/large text; rechecked the large-text dialog after making its detail copy scrollable so the actions remain visible.
- Restored the original emulator dimensions, density, and font scale afterward.

The emulator contains a clearly named Builder Demo Plan template and local test assignments. No Firebase workout data was written. iOS/web, screen-reader interaction, injected storage failures, an entirely empty library, and all combinations of invalid form/keyboard input were not manually exercised; persistence/error/empty-data logic is covered by the automated tests.
