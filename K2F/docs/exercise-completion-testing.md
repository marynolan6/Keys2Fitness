# K2F-31 — Exercise completion (K2F-163–165)

Exercise checkboxes update local workout state immediately. Completed cards have
an explicit Completed label and themed accent; other cards say Not complete.
The progress summary reports completed and remaining counts. All exercises
complete produces an explicit complete state; unchecking an exercise reverses it.
An empty assignment is not treated as a completed workout.

This recognizes completion in the workout UI. It does not submit a completed
workout to a backend or implement the existing Finish Workout placeholder.
Cross-visit persistence uses the pause/resume session flow brought in from
origin/main. Exercise completion controls respect paused/loading/saving state.

## Automated checks

Run `node --test tests/workout-progress.test.mjs` from K2F. Coverage includes an
empty workout, unstarted and partial workouts, percentage rounding, completion,
and reversing completion.

## Android acceptance walkthrough

1. Open the assigned workout and toggle each exercise independently. Its label,
   checkmark, card accent, progress percentage, and remaining count should update.
2. Complete all four exercises: expect 100%, zero remaining, and All exercises
   complete. Uncheck one: the complete message disappears immediately.
3. Scroll away and back, and open/close exercise details using Close and Android
   Back. Completion state must remain unchanged within the current workout.
4. Repeat at 320 dp with 1.5× font scale, approximately 390 dp, and tablet width.
   Confirm controls remain reachable and labels wrap without clipping.
5. When combined with pause/resume, verify checkboxes are disabled while paused,
   loading, or saving and that restored completion drives the same summary.

Device checks must be recorded separately from automated logic checks.

## Observed Android results

`python3 tests/exercise-completion-smoke.py` passed on the connected Expo Go
emulator at 420 dpi with these viewport settings:

- 1080×2400 (~411 dp), font scale 1.0
- 1024×2400 (~390 dp), font scale 1.0
- 840×2400 (320 dp), font scale 1.5
- 1600×2400 (~610 dp), font scale 1.0

Each run normalized the sample exercise checkboxes to incomplete, checked all
four individually, asserted completed and remaining counts after each change,
verified All exercises complete, opened Hammer Curl details and dismissed with
Android Back, then unchecked Hammer Curl and verified completion was reversed.
The test restores the sample's two-complete/two-incomplete pattern afterward.
This test deliberately changes the demo workout; do not run against real data.

Resize reloaded Expo Go to login once; the workout was reopened by deep link
before rerunning. The compact test required a longer runner timeout due to
scrolling and accessibility dumps; the completed run passed.

Logic tests, TypeScript, changed-file ESLint, and Android/web exports passed.
Full-project lint has unrelated existing failures.

## Pause/resume integration verification

After integrating the merged session code, the expanded Android test passed at
normal phone width: complete all four exercises, pause, assert the checkbox is
disabled and cannot change completion, leave through Back to Dashboard, reopen
through the assigned-workout card, assert the paused all-complete state restored,
resume, and assert completion remains intact. The modal and reversal checks also
passed afterward. TypeScript, changed-file lint, and all four logic tests passed.
The earlier responsive matrix predates this integration; the pause/resume-specific
walkthrough was rerun at normal phone width only.

## Workout timer and ending a session

- A fresh session shows **Start Workout** and 00:00. Completion controls are
  enabled only while the session is running. Opening details does not stop time.
- The clock measures active time using timestamps. Pause freezes elapsed time;
  paused time is excluded on Resume. Running time includes time spent with the
  app backgrounded until explicitly paused. Paused checkpoints restore the saved
  timer; old paused records without timing data restore at 00:00.
- While paused, equal-width **Resume** and **End Workout** buttons share one row.
  End Workout is available regardless of exercise completion. Only remaining
  incomplete exercises trigger the confirmation. **Keep Workout** cancels;
  **End Anyway** saves the end state without marking incomplete exercises complete.
- Ending leaves the final duration and completion count visible. The ended record
  is retained locally on reopening. **Start New Workout** explicitly starts a new
  attempt, resetting elapsed time and all completion checkboxes. No workout history
  or server submission is added by this change.
- `node --test tests/workout-timer.test.mjs tests/workout-progress.test.mjs`
  checks pause/resume arithmetic, no drift during delayed updates, serialization,
  ended-time freezing, invalid transitions, restarting, formatting, and completion.
- On Android at normal phone size, observed the paused two-button layout, an
  incomplete-exercise confirmation, cancel preserving paused time (05:38), and
  confirmed ending preserving that same duration with zero exercises completed.
  Live ticking prevents the older UIAutomator accessibility-dump smoke test from
  reliably reaching idle while running; that runner timed out, so its previous
  full responsive results are not a timer verification result.

Manual follow-up: run at compact/large-font and tablet sizes, exercise the complete
workout end path (no confirmation), and check pause/reopen/resume timing. Use screen
interaction rather than relying on UIAutomator idle during a running timer.
