# K2F-33 — Finish, confirm, and record workouts

Branch: `spencer/sprint-4/K2F-33/confirm-workout-completion`

This branch is based on `spencer/general-updates/architecture-refinement` (commit `74fbb10`), which had not yet been merged into main when work started. Merge that architecture work first, or account for the dependent commits when reviewing this branch.

## Story coverage

- **K2F-178:** Finish Workout becomes available in a started running or paused workout after every required exercise and performed set is complete. Checking the final exercise does not finalize the session automatically.
- **K2F-179:** Finish opens Confirm workout completion? with Confirm completion and Keep Workout. Cancellation (including Android Back) leaves the timer and recorded progress untouched. Confirmation saves before displaying success. Failed saves retain the confirmation and editable session state for retry.
- **K2F-180:** Successful confirmation records a completed outcome, displays explicit success feedback, changes the dashboard card to Workout completed, and adds a durable history entry. Workout activity appears on the dashboard and Progress tab with completed counts and total active time. Individual records expose the dated result, prescriptions, and actual performed sets.

## Outcome and history rules

- Completed and ended-early are separate outcomes; early ends are shown in history but excluded from completed counts and completed active-time totals.
- The existing Pause → End Workout route remains available for incomplete sessions and always requires confirmation.
- Starting a new attempt creates a new session ID, clears completion/performance as before, and preserves all earlier history. The title and exercises in history are snapshots; changing a template cannot rewrite those records.
- Only started, nonempty workouts with all required exercise IDs and confirmed sets pass the service's finish guard. Checking a box still records prescribed defaults for untouched set fields, as in existing logging behavior.
- A finalized attempt has one history entry. Duplicate confirmations and retries do not duplicate totals; late autosaves for a finalized attempt cannot reopen it.
- Checkpoint finalization and history append share a single AsyncStorage write under the existing per-workout key. There is no separate history write that can succeed while finalization fails or vice versa.
- History is filtered by the selected demo client. Current local assignments provide the client ID; the original mock workouts belong to demo client 1. This is the previously agreed on-device prototype, not authenticated cross-device/Firebase workout history.
- History-load failures show a retry message rather than misleading zero totals. Corrupt/future session envelopes are not overwritten. Since totals must be complete, archive-read errors fail explicitly rather than silently omitting records.

## Storage compatibility

The library stays at schema 2. Workout checkpoints advance to **schema 3**:

```text
keys2fitness:workout-session:<workoutId>
  { schemaVersion: 3, data: <latest checkpoint or null>, history: <finished attempts> }
```

V1/unversioned and v2 checkpoints are migrated without inventing history or marking old ended sessions successfully completed. Legacy active attempts receive a stable identity when opened. New attempts carry an ID and start timestamp; finalized ones additionally carry outcome and finish timestamp. Clearing the current checkpoint preserves its existing history.

## Automated verification

```bash
npm run test:workouts
npx tsc --noEmit
```

All **58 workout tests** pass, including 8 new completion/history scenarios: finish eligibility, atomic recording and restart restoration, early-end exclusion, duplicate confirmations/stale autosaves, repeated attempts and checkpoint clearing, write-failure retry, v2 ended migration, and corrupt-history preservation. Existing reducer, library, migration and end-to-end application tests remain passing.

TypeScript and changed-workout-file ESLint pass. Full-project Expo lint still reports the existing 33 errors and 2 warnings in login, client progress, coach check-ins, root index and DoorOpeningIntro. The new Progress import/render adds no new lint failures; its existing effect lint failure remains.

## Android verification

Used the connected Expo Go emulator with a newly assigned, uniquely named one-exercise Bench Press fixture (Alex Morgan). No existing workout records were reset.

- Start, confirm the exercise, Pause, Finish, Keep Workout: confirmation cancels without losing checked sets or paused state.
- Finish → Confirm completion: success feedback appears; Progress lists the completed workout and its recorded 8 reps / 135 lb confirmed sets.
- Start New Workout → Pause → End Workout → End Anyway: a second, early-ended attempt is retained without increasing completed totals.
- A third complete attempt verified Finish from a running clock, cancellation, successful confirmation and totals after restarting Expo Go.
- Switching the demo client to Spencer showed an empty history; switching back restored Alex's completed records.
- Confirmation/cancellation checked at ~390 dp, 320 dp, 320 dp with 1.5× font scale, and 800 dp tablet width. History totals and scrollable record details checked at ~390 dp, 320 dp/1.5×, and tablet width; the detail close action remains available.
- Emulator size, density and font scale restored after verification.

The initial smoke driver missed the newly split Pause/Finish button using old coordinates; it was corrected to locate the actual control and the remaining flow passed. UIAutomator may still require retries while the clock ticks.

`tests/workout-completion-smoke.py` reproduces the flow with a newly created one-exercise Bench Press fixture. It retains local test assignment/history records, removes its reusable template after a successful run, and compares completed totals against a baseline. `--resume-title` can resume verification of an already-created paused fixture. The original architecture smoke driver was updated to confirm Finish when complete, or early End when exercises remain. K2F-39 subsequently added explicit assignment confirmation to both drivers.

iOS/web, assistive-technology interactions, injected device-storage failures and a full keyboard matrix were not manually tested. Failure/retry, malformed data, empty workouts and duplicate finalization are covered by isolated logic/integration tests.
