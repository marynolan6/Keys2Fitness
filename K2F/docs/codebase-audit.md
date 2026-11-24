# Sprint 4 codebase audit

Base: `cdf0292` on `main`. Keys2Fitness runs one local workout store per device. The coach can browse several demo clients on that device. Firebase accounts and weight measurements use a separate data source.

The inventory covered all 302 tracked files, including 144 TypeScript source files, 32 test files and helpers, and 39 Markdown files. The review traced Expo routes and imports, searched tests and config for callers, checked package consumers, and checked local documentation links. Launch, authentication, messaging, workout storage, coach activity, nutrition, and setup received a closer review. Design documents, screenshots, licenses, and third-party skill text were inventoried, not rewritten.

## Changes

| Finding | Change and evidence |
| --- | --- |
| Opening the coach dashboard scanned every workout archive once **per client**. The card counted up to three workouts of any age, but its detail list showed the past seven days. | A scoped batch read supplies one list to both views. The regression test uses two clients, four archives, repeated attempt IDs, and an unrelated storage key. It checks one key scan, four reads, the time boundaries, and both completion outcomes. |
| An edit could land after assignment confirmation read the template but before it wrote the client's copy. | The queued write checks the template timestamp against the revision used to build the copy. An integration test inserts an edit between lookup and commit and verifies that no stale assignment is written. |
| Leaving Messages before the initial read finished could overwrite saved read markers. The screen also searched for the first unread message inside every message row. | Messages now merges IDs using the shared storage queue and computes the divider index once. Tests cover quick blur/refocus, repeated IDs, separate keys, corrupt data, and read/write failures. |
| The root route started the door animation while redirecting to Login, which started it again. The old `/client/workout` route had its own hard-coded plan. | Login owns the animation. The old workout URL opens the selected client's real assignment list, including its empty state. |
| An unused composer, a commented-out widget, its sample conversations, and unreachable message loading/error branches remained in the app. Nutrition filtered the same food log twice. | Removed the unused message code after checking callers. Nutrition now calculates totals from the same daily entries it displays. Coach profile actions reuse the existing button, and the static schedule now identifies itself as sample data. |
| Four direct dependencies had no app or config consumer. The checkout also had unused Expo starter images and an image editor recovery file. | Removed `@react-native-vector-icons/entypo`, `expo-device`, `expo-image`, and `expo-web-browser`. The lockfile lost 12 package entries. Removing 15 unused assets reduced the tracked checkout by 1,284,670 bytes. That number measures files in Git, not app download size. |
| The Android setup guide repeated the WSL configuration and recommended downgrading Expo Go to SDK 57. The old test instructions missed some suites. | The guide now uses SDK 58 and explains the Windows `adb.exe` shim once. `npm test` runs every Node test. The app README, root README, and Cline setup point to the same prerequisites. |

## Follow-up findings

1. **Legacy workout completion:** [`initializeSetPerformance`](../src/workouts/setPerformance.ts) seeds missing rows from prescribed sets. A paused legacy checkpoint can have `completed: true` without a recorded row count. Decide how to display that exercise-level completion without claiming a specific number of sets before changing the migration.
2. **Account provisioning:** [signup](../src/app/auth/signup.tsx) creates the Firebase account before writing its profile. If the profile write fails, starting signup again can report that the email is already in use. Test recovery with an authorized Firebase test project. The repository does not contain the deployed access rules.
3. **Unread badges:** the [tab badge](../src/components/MessageCount.tsx) counts static mock flags. Visiting a conversation now preserves the read markers, but the badge does not consume them. Choose a shared source for the badge and conversation when integrating message delivery.

## Review and verification

Ponytail's installed audit and diff-review prompts guided the inspection. The pstack subtraction pass checked callers before deleting code; Unslop was applied to contributor instructions, comments, and UI copy. The first Thermo-Nuclear pass caught an unnecessary break to the single-client history API. The final pass traced both single-client and coach-wide reads, queued writes, routes, and failure cases against the tests.

- `npm test`: 142 Node tests passed. `npm run test:workouts`: 110 of those tests cover workouts.
- `python3 -B tests/workout-sandbox-test.py`: five tests passed.
- `npm run lint` and `npx tsc --noEmit` passed. The baseline had 30 lint errors and three warnings.
- `npm ci --dry-run --offline --ignore-scripts` validated lockfile resolution. Expo exported the Android and web bundles. No live Firebase account, production deployment, or iOS simulator was used for this audit.
- On Android, the coach activity card and modal agreed for two clients and for an empty history. The old workout link opened the selected client's empty assignment list. Nutrition and the login redirect worked at 390 dp, 320 dp with 1.5× text, and 800 dp. Messages retained old and new read markers after leaving and reopening the conversation. The test restored the original workout data, message preference, and display settings.
- The coach profile opened Alex's workout list and returned to the correct profile at all three sizes. An unknown ID showed the missing-client screen. One run hit an Expo Go runtime startup error after a display change; these checks passed after restarting Expo Go between display changes.
