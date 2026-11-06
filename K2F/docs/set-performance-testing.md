# K2F-32 — Per-set workout logging (K2F-166–168)

## Behavior and scope

- Exercise cards stay compact. **View Details** opens the existing instructions,
  demonstration placeholder, and recommendations. **View Sets** opens the separate
  logging modal, with the original coach prescription shown as read-only.
- Prescribed `sets`, `reps`, and `weight` remain separate from `actualSets`.
  Each performed row has a stable ID, actual reps, actual weight in lb, and a
  completion flag. Gray input placeholders show targets without recording them.
- Checking a set fills untouched fields with the prescribed targets and records
  the set as complete. Entered values, including explicit zeroes, are retained.
  All performed sets checked completes the exercise. Unchecking or editing a
  completed set makes the exercise incomplete until all sets are reconfirmed.
  The exercise-level checkbox confirms/unchecks all performed sets consistently.
- Add Set appends an unconfirmed row. Remove Set removes the last row, even below
  the prescribed count; zero rows is supported and never considered complete.
  Surviving rows retain their IDs and entries. These actions do not edit targets.
- Empty values mean unrecorded. Reps accept nonnegative whole numbers; weight
  accepts nonnegative decimals. Invalid values are rejected with inline feedback.
  Bodyweight/no prescribed weight uses a zero-added-weight placeholder. Unknown
  nonnumeric prescriptions (for example, a resistance-band label) are not converted
  into a fabricated numeric weight.
- Logging uses the existing active workout state. Pause checkpoints include row
  counts, values, and completion flags; legacy checkpoints are initialized without
  losing their entries. A new workout clears actual entries. Inputs and set controls
  are disabled before Start, while paused/saving, and after ending.
- This is a UI/local-state implementation, not Firebase synchronization or a coach
  performance-review feature. Instruction/recommendation editing remains separate.

## Automated checks

From `K2F`:

```bash
node --test tests/set-performance.test.mjs tests/workout-progress.test.mjs tests/workout-timer.test.mjs
npx tsc --noEmit
npx eslint src/components/ExerciseSetEntries.tsx src/components/ExerciseSetsModal.tsx src/workouts/setPerformance.ts src/workouts/workout.ts src/workouts/workoutSession.ts 'src/app/client/home/workout/[workoutId].tsx'
```

The tests cover prescription immutability, independent rows, stable values through
add/remove, zero and blank inputs, invalid numeric entries, bodyweight defaults,
legacy-row migration, local serialization, target confirmation, custom values,
completion synchronization, and reset behavior. Existing progress/timer tests
remain passing. Full-project lint has existing failures outside these changes.

## Android evidence

- On the normal 1080×2400/420 dpi emulator, entered Incline Dumbbell Press set 1
  as 8 reps / 37.5 lb and set 2 as 10 reps / 40 lb. Added a fourth row and removed
  rows below the prescribed three, retaining those two values. The prescription
  and existing details modal remained 3 × 10 @ 40 lb.
- Following the modal-layout adjustment, confirmed Bench Press's untouched rows.
  Gray 8/135 targets became actual values, all three rows showed checked states,
  and closing the modal showed the exercise completed with 3 of 3 sets complete.
- In the new Incline modal, confirming the edited two rows kept 8/37.5 and 10/40.
  Adding a third row left the first two confirmed and the new row unconfirmed.
- Paused, left through the dashboard, reopened, and used View Sets. Accessibility
  assertions verified set 1's 37.5 lb, its checked state, the third row's unchecked
  state, and disabled inputs while paused.
- Opened and scrolled the new modal at 320 dp with font scale 1.5, approximately
  390 dp at normal scale, and tablet width (~610 dp). Verified the restored entry
  and inspected screenshots. Compact inputs/buttons stack; Close remains fixed.
- Actual typing was exercised at normal phone size before moving the same editor
  into its modal. Invalid/empty/bodyweight handling is covered by logic tests;
  a complete keyboard/paste matrix in the new modal is still a manual follow-up.

UIAutomator cannot reliably reach idle while the workout clock ticks. Interactive
running-session checks used screenshots and taps; paused-session assertions used
accessibility dumps. Do not report the earlier completion smoke runner as a full
per-set logging test.
