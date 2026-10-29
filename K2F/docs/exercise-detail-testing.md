# Exercise detail modal — K2F-20 / K2F-160–162

The client workout opens exercise details in a modal without leaving the workout
screen. Instructions and coach recommendations currently come from the assigned
workout mock in `src/workouts/mockWorkout.ts`. Editing recommendations belongs to
a later coach-side workout assignment story; no coach editor is included here.
The demonstration frame is a local **Video coming soon** placeholder, not a
playable video. Embedded YouTube playback is future work.

## Android acceptance checks

With Expo Go and `npx expo start` running from `K2F`, open the client dashboard's
assigned workout. Check the following at about 390 dp, at 320 dp with 1.5× font
scale, and at tablet width:

1. Open **View Details** for each of the four exercises. The modal shows the
   selected name, sets, reps, imperial weight, written instructions and the
   demonstration placeholder. Bench Press and Seated Cable Row show the sample
   coach recommendation; the other two omit that optional section.
2. Scroll to the bottom of the modal, close it, and open another exercise. The
   selected content changes and the workout stays at its previous scroll position.
3. Toggle an unfinished exercise's completion checkbox, record the percentage,
   open and close its modal with both **Close** and Android Back, and verify the
   checkbox and percentage have not reset. The modal should not change set or
   exercise counts.
4. Navigate back to client Home and reopen the assigned workout. Workout
   completion is currently local state and resets on a full route revisit; durable
   workout-session persistence is outside K2F-20. Add/Remove Set, Add/Remove
   Exercise, and Finish Workout are existing non-functional prototype controls,
   so entered set data cannot yet be tested.

Automated emulator smoke coverage is in `tests/exercise-modal-smoke.py`; run it
with `python3 tests/exercise-modal-smoke.py` after connecting an emulator and
starting Expo on port 8081. It exercises the modal for all four mock exercises,
checks navigation and the displayed workout progress after closing.

## Verification results (Android emulator, Expo Go)

- At 1080×2400/420 dpi (~411 dp), 840×2400/420 dpi (320 dp) with font scale
  1.5, 1024×2400/420 dpi (~390 dp), and 1600×2400/420 dpi (~610 dp), the
  smoke test opened all four exercise modals. It verified their names,
  instructions, demonstration placeholders, and optional recommendation sections.
- Toggling Bench Press changed workout progress from 50% to 25%. Closing each
  modal (including Android Back for Incline Dumbbell Press) kept progress at
  25%; toggling Bench Press again returned it to 50%.
- Navigating to Home and reopening the workout reset progress to the original
  50% fixture, confirming that route-revisit persistence is not implemented.
  This is distinct from the modal open/close acceptance criterion.
- Expo Go reloaded to the dashboard selector when emulator dimensions changed;
  the client dashboard and workout were reopened before each responsive run.
