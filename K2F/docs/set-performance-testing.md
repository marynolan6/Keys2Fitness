# Per-set workout logging

## K2F-34 — Record and review actual performance (Sprint 4)

| Subtask | Behavior |
| --- | --- |
| K2F-181 — inputs | In **Log sets**, the checkbox sits beside the set heading. The labeled reps and weight boxes sit below it and stack on narrow or large-text layouts. Gray placeholders show the prescription, including on added rows. Checking a set fills only its blank fields; checking an exercise does the same for its unconfirmed sets. Custom entries, including zero, are preserved. A missing weight stays unrecorded. |
| K2F-182 — preservation and review | Entries survive closing the editor, switching exercises and pause/reopen. Each active exercise has a compact log preview; the finish/early-end confirmation shows the recorded rows for all exercises. **Keep Workout** returns without finalizing. |
| K2F-183 — result | The review, ended session and history use one text row per set, such as `Set 1 · 8 reps, 135 lb`. Unconfirmed entries are labeled. Skipped rows keep their original numbers; missing actuals say “not recorded.” Old archives are not filled from targets. |

Client Home lists each assignment ID once, with the active workout first and its **Continue** action intact. Separately assigned copies of the same plan retain their dates and open independently. A legacy title matching its linked template’s coach note exactly is presented as a note alongside the template name; the stored assignment is preserved.

**Verification (Nov 25, 2026):** `npm run test:workouts` passed 116 tests, including cross-exercise edits, pause/reopen and archived results. On Android, `tests/workout-completion-smoke.py` removed all three Bench Press sets and added three new ones. Review and history showed **7 reps / 127.5 lb** (custom), **8 reps / 135 lb** (both hints accepted), and **8 reps / 0 lb** (custom zero). Canceling the first finish kept the log; ending a second attempt early did not increase the completion count. The sandbox restored the original workout records and preview client.

**Demo 1.0.3, Android:** In Incline Dumbbell Press, the two input boxes appeared below each set heading. They sat side by side at 390 and 800 dp and stacked at 320 dp with 1.5× text. Checking untouched suggestions and reopening the paused log showed `Set 1 · 10 reps, 40 lb`. Entering only a zero weight before checking the next set showed `Set 2 · 10 reps, 0 lb`. The walkthrough restored the workout fixtures and display settings. iOS and spoken screen-reader output were not tested.

## Original K2F-32 behavior and verification (K2F-166–168)

The notes below describe the earlier K2F-32 implementation. The current behavior is summarized above.

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
