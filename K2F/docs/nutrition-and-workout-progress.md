# K2F-125 and K2F-47 — Sprint 4 acceptance review

Branch: `spencer/sprint-4/K2F-125-K2F-47/nutrition-workout-progress`, based on `683a8f0` from `origin/main`.

## What was already present

Nutrition already calculated food totals, provided daily navigation, and allowed food entry. It used one generic goal object, recreated its food list when remounted, and had no client-specific coach-tip source or coach update path. Workout progress already followed exercise completion and session checkpoints, but scrolled offscreen, could round an incomplete workout to 100%, and trusted an exercise flag even when performed sets disagreed.

## K2F-125 — Coach-assigned macro goals and tips

| Criteria / subtask | Implementation and evidence |
| --- | --- |
| K2F-154 — calorie/macro targets | Client **Menu → Nutrition** shows Calories (kcal), Protein (g), Carbohydrates (g), and Fat (g), with separately labeled logged intake and current target. Blank targets say **Not assigned**, not zero. |
| K2F-155 — coach tips | The same screen labels the tips as the current plan for the named client. Spencer and Alex have distinct sample guidance. Jordan has no tip and displays **No coach tips for this plan yet.** Cleared tips stay cleared. |
| K2F-156 — integration/navigation | Goals, intake comparison, tips, date controls and food log appear together. The nutrition client picker uses the existing selected mock-client context. Leaving through the menu and returning retains the client, plan and logged food. |
| Client-specific assignment | Shared state is keyed by demo-client ID. Unknown clients get an unavailable state rather than another client's plan. The nutrition picker is available even when no workouts have been assigned. |
| Coach updates / K2F-229 handoff | **Coach → Client List → client profile → Nutrition targets and tips → Edit targets and tips** edits the shared mock plan. **Preview nutrition as [client]** opens the corresponding read-only client plan. Changes are published only on Save; Cancel discards the draft. Stale editor revisions are rejected. |
| Totals/history separation | Plan saves replace only the scoped targets/tip. Food quantities, nutrition values, previous-day totals and other clients' state are preserved. A new target changes the comparison against those totals. The daily view explicitly compares current targets with food for the selected day. |
| Missing versus explicit zero | All targets may be unassigned, or a plan may have only some targets. Explicit zero remains a visible zero target, without dividing by zero. Missing targets show no misleading progress bar. |

The client screen offers food logging but no target/tip editing. Goal editing is on the coach route. The shared `nutritionRepository` is **in memory for this app session**; restarting/reloading JavaScript resets its sample data. The existing preview-client preference remains on-device. This is the requested same-app prototype flow, not Firebase assignments, production authorization, cross-device propagation, or a historical target-version archive.

[Nutrition target preview](images/nutrition-targets.png)

## K2F-47 — Workout completion progress

| Subtask | Implementation and evidence |
| --- | --- |
| K2F-169 — indicator | The shared indicator is pinned above the workout's scrolling content and is also visible inside the set-logging modal. It shows the completed/total exercise count, remaining exercises, percentage and a bounded bar. |
| K2F-170 — immediate/restored updates | Completing all performed sets completes that exercise. Editing a confirmed set or adding an unfinished set reverses its contribution. State updates immediately from the session reducer, and pause/reopen restores the same count and percentage. |
| K2F-171 — completion state | **All exercises complete**, the completion accent and 100% appear only when every required exercise is complete. Empty workouts stay at 0%. An incomplete fraction that rounds up is capped at 99%; completion never exceeds 100%. |

When performed rows exist, they determine completion rather than a stale exercise-level flag. Legacy exercise-only completion remains supported. A new session starts at 0% rather than inheriting demo-plan checkmarks. Showing all exercises complete is still distinct from confirming and saving the workout: merely checking the final set never finalizes the attempt.

[Pinned progress preview](images/workout-progress.png)

## Automated verification

Run from `K2F/`:

```bash
npm run test:nutrition
npm run test:workouts
npm run test:progress
npx tsc --noEmit
npx expo lint
```

- **135 Node tests pass**, including 8 nutrition cases, 6 progress-domain cases and 2 progress integration cases. The full workout suite now has 105 tests.
- Nutrition tests cover client isolation, coach publication, unchanged historical food, missing/partial/zero targets, no-tip states, scoped food edits, invalid input, stale saves and calendar-day boundaries.
- Progress coverage includes 0/partial/100%, reversal, stale aggregate flags, 199/200 items staying below 100%, pause/reopen, immutable completion and fresh demo sessions.
- TypeScript and changed-file ESLint pass. A missing play-icon style in `PendingVideoWidget` on the base branch was restored to clear its existing TypeScript error.
- Full-project lint retains **30 existing errors and 3 warnings** in DoorOpeningIntro, the root index, and useRecentClientActivity.
- Expo web export passes; no new dependency was needed.

## Android verification performed

Expo Go / SDK 58, Android 17 emulator:

- Followed the actual coach profile button, edited and canceled a draft, then saved Alex's goal and tip. Previewed the client and confirmed the new target/tip alongside unchanged food values. Removed a macro target and verified **Not assigned**.
- Added a client food entry, compared today with yesterday, and navigated Home → Nutrition. The selected client, updated plan and food remained correct.
- Switched Spencer → Jordan → Alex: distinct goals/tips/food did not leak between clients. Tested a fully unassigned plan, missing tips and an invalid client route.
- Checked every nutrient label/unit, coach guidance, food log, coach form and preview controls at **390 dp / 1×**, **320 dp / 1.5×**, and **800 dp / 1×**.
- The enhanced completion smoke driver checked 0% before starting, immediate 100% inside the set editor, confirmed completion/history, and a new attempt returning to 0% before early ending.
- A two-exercise checkpoint verified 50% with one remaining exercise, visibility after scrolling, the set-modal indicator, and reopening at all three sizes. Final completion restored at 100%.

The shared smoke sandbox removed test assignments/sessions/history and restored the original preview choice. Nutrition fixtures reset on the cleanup reload; original size, density and font scale were restored. Test runs did not write Firebase data. iOS, spoken screen-reader output, and cross-device behavior were not manually tested.
