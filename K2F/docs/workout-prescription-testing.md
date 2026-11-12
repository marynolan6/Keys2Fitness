# K2F-38 — Exercise prescriptions and client recommendations

Branch: `spencer/sprint-4/K2F-38/edit-exercise-prescriptions`

Base: `origin/main` at `02dae0d` (after merged PR #43).

## Audit result

The base implementation already edited and validated template sets, repetitions, weight, generic instructions, and default coach notes. It did not store/edit/display rest duration, allow optional blank weight, or provide an editor for an existing client's assigned-exercise recommendation. The latter could only be supplied when making a new assigned copy or read from static demo tips.

This branch completes those missing paths within the story's explicitly allowed **fall UI / local-data scope**. Firebase cross-device persistence and authenticated coach/client linking are outside this story.

## Acceptance coverage

| Work item | Implementation |
| --- | --- |
| K2F-205: edit each prescription field | Workout editor controls cover sets, reps, pounds, rest in seconds, and instructions. Each row retains its exercise ID and named accessibility labels. |
| K2F-205: optional data does not block saving | Weight and rest can be blank; instructions and notes can also be empty. Zero pounds explicitly means bodyweight/no added weight; zero rest means no rest. |
| K2F-205: edit an existing client recommendation | Coach → client profile → View Workouts → Edit recommendation for the named exercise. The editor displays client, assigned workout, exercise, existing recommendation, and separate read-only instructions/prescription. |
| K2F-205: client switching loads the right text | The coach client-workout screen is keyed by client ID; the recommendation editor is keyed by client/assignment/exercise. Switching context unmounts the old draft and loads the corresponding stored/default recommendation. |
| K2F-206: reject invalid numeric inputs near the field | Sets: whole 1–50; reps: whole 1–200; weight: optional 0–2000 lb including decimals; rest: optional whole 0–3600 seconds. Field-specific errors render beside the affected control. Editing a field clears its old error without clearing another row's errors. Service-level validation also rejects invalid prescriptions. |
| K2F-207: prescriptions save/reload on the correct exercise | Template edits persist and restore all prescription values and row IDs. Rest is copied into new assignments and displayed in the library, coach assignment, client workout/details/sets, and recorded history when present. |
| K2F-207: recommendations save/reload without cross-client overwrite | A dedicated repository command matches client ID, assignment ID and exercise ID and changes only the recommendation. Other clients, copies of the same workout, other exercise rows, reusable instructions/prescriptions and session performance remain separate. |
| K2F-207: preserve existing local data | Explicit library V1/V2 → V3 migration retains assignment snapshots, notes and IDs. Session schema stays V3, including support for old V2 checkpoints. Unsupported/corrupt records are not overwritten. |

Rest is an exercise-level recovery prescription applying after sets / before proceeding to the next exercise. This story adds the editable/displayed prescription, not an automatic rest countdown.

## Storage and behavior

- Library key remains `keys2fitness:workout-library:v1`; its envelope is now schema **3**. Older missing rest stays missing; no arbitrary rest default is invented.
- `restSeconds` is optional on templates and assigned/session exercise snapshots. Blank weight is not coerced to a prescribed zero; explicit zero remains bodyweight.
- A new optional `recommendation` on an assigned exercise overrides legacy/default `coachNotes` and demo tips. An explicit empty string removes the recommendation and suppresses fallback, so clearing the editor actually stays cleared.
- Recommendation reads and writes go through application services and domain repository ports. The adapter rechecks the full scope inside the queued update and publishes only after the write succeeds.
- Optimistic comparison rejects stale edits to the same recommendation. Concurrent edits to different rows merge rather than replacing a captured whole-workout snapshot.
- Load failures expose retry; failed saves retain the draft; pending saves block edits and duplicate submissions. Cancel/Android Back closes without saving when no save is pending. Lifetime guards prevent old async responses from updating a replacement editor.
- Template prescription changes apply to that reusable plan and future assigned copies. Existing assignment prescriptions remain snapshots; the recommendation editor updates the selected existing copy directly without rewriting its prescription or workout progress.

## Automated verification

```bash
npm run test:workouts
npx tsc --noEmit
node --test tests/coach-tips.test.mjs
```

- **72 workout tests pass**, including nine new prescription/recommendation cases: row-specific validation and optional values; prescription save/edit/clear/reload; client/workout/exercise isolation and performance preservation; explicit recommendation clearing; invalid scope rejection; failed-write retry; concurrent/stale edits; V2 migration/corrupt-data protection; reducer load retry/edit guards.
- The **7 existing coach-tip tests** pass, preserving legacy/default behavior.
- TypeScript and changed-file ESLint pass.
- Full-source ESLint retains the existing **33 errors and 2 warnings** in login, Progress, coach check-ins, root index and DoorOpeningIntro.

## Android verification performed

Used the connected Expo Go emulator and a uniquely named local `Prescription smoke K2F38 …` fixture containing Bench Press and Plank:

- Entered invalid decimal rest and verified the inline whole-number error. Corrected it to 120 seconds.
- Saved and reopened 4 sets, 12 reps, 142.5 lb, 120-second rest, and updated reusable Bench Press instructions. Plank saved with blank weight/rest/instructions.
- Assigned the saved plan to Alex Morgan and Spencer.
- Opened Alex's existing recommendation, changed it, canceled, and reopened to verify the original text remained. Saved an Alex-only recommendation.
- Opened Spencer's copy of the same exercise and saved different text. Switched client context with an editor open, then verified Alex's own text reloaded.
- Opened the client workout's exercise details and verified prescribed rest, generic instructions and Alex's recommendation were displayed independently.
- Force-stopped/restarted Expo Go and verified the saved recommendation reloaded. Cleared it, saved, reopened to confirm it stayed empty, then restored the fixture's Alex text.
- Checked recommendation-field access, Save/Cancel controls, and template rest controls at approximately **390 dp**, **320 dp**, **320 dp with 1.5× font scale**, and **800 dp tablet width**. Size, density and font scale were restored afterward.
- Removed the reusable smoke template through the library's confirmed Delete action. The library returned to **four saved templates**. The local assigned copies remain available for inspection.

`tests/workout-prescriptions-smoke.py` provides create/recommendation/cleanup phases with `--title` for resuming a fixture. Its default all-phases run deletes the reusable test template after success; `--keep-template` allows layout inspection before explicit cleanup.

Verification was completed through phased/resumed runs, not one uninterrupted invocation. The initial UI driver missed an offscreen catalog item and sent a keyboard-dismiss key that closed a modal; it now searches the catalog and supports filling modal fields without that key. A read-only recommendation assertion and layout driver also needed to distinguish visible modal content/footer controls from the driver's stricter generic scroll bounds. These were automation issues; the relevant native steps were subsequently verified. The complete revised all-phases driver was not rerun end-to-end after those driver adjustments.

iOS/web, screen-reader operation, device-level injected storage failures, and the full keyboard matrix were not manually verified. Failure/retry, stale-write protection, scope rejection, old formats, corrupt records and preservation of unrelated data are covered by the isolated workout suite.
