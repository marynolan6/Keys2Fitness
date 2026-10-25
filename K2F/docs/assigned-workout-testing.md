# Assigned Workout Dashboard — K2F-46

Implementation covers K2F-145 (card), K2F-146 (summary), and K2F-147 (navigation).
The prototype assignment is in `src/workouts/mockWorkout.ts`; both Home and
workout details use this record. Sprint 2 acceptance explicitly permits static
workouts as UI filler; backend assignment loading belongs to a later phase.

## Android acceptance checks

Run `npx expo start` from `K2F`, open the client Home tab, and check:

1. **Card:** Above the goal card, Assigned workout shows Upper Body Strength,
   Current workout, Week 5, Day 3, 4 exercises, and 45 min. The card uses the
   shared blue/white theme and text wraps on narrow screens or larger font sizes.
2. **Navigation:** Tap anywhere on the assigned-workout card. The details title,
   schedule, and exercises match the assignment. Use the stack back button or
   Android Back to return to Home. Repeat through the Workout quick-access card.
3. **Upcoming:** Temporarily change the mock status to `upcoming`; Home and
   details should both say Upcoming workout. For a realistic upcoming fixture,
   also set all exercise `completed` flags to `false`; changing only the status
   retains the current mock's 50% completion state.
4. **Optional information:** Temporarily omit `scheduleLabel`, `durationMinutes`,
   and `notes`. The card retains the title, status, and exercise count without
   empty separators or undefined text; details hide the notes toggle.
5. **No assignment:** Temporarily set `mockAssignedWorkout` to `null`. Home shows
   No workout assigned yet and omits the Workout quick-access action.
6. **Invalid ID:** Open `/client/home/workout/unknown` through a development
   deep link. It should show Workout unavailable instead of another workout;
   Back to dashboard returns to Home.
7. **Responsive layout:** On Android, test 320 dp width, approximately 390 dp,
   and a tablet width. At each size inspect Home, the assigned-workout card,
   goal card, quick access, workout details, and exercise details. Repeat at
   1.5× font scale: all labels and actions must wrap without clipping or
   overlapping, cards must stay within the window, and buttons must remain
   reachable while scrolling. Verify notes, details, and back navigation.

Restore mock changes after checking. Exercise completion remains local to the
detail screen, as in the existing prototype.

### Verification results (Android emulator, Expo Go)

- `npx expo lint`, `npx tsc --noEmit`, `git diff --check`, and
  `npx expo export --platform android` passed.
- At the emulator's normal 1080×2400/420 dpi setting (about 411 dp wide),
  Home showed the current assigned workout with the correct title, schedule,
  count and duration. Tapping the card opened matching details; Android Back
  returned to Home. The Workout quick-access tile opened the same workout.
- At 840×1867/420 dpi (320 dp wide), Home and details fit inside the viewport,
  text wrapped, and the card still opened the matching workout. At that width
  with Android font scale 1.5, the card and details remained readable and the
  action remained tappable. At 1600×2560/420 dpi (about 610 dp wide), Home
  and workout details remained within the centered content column.
- With the temporary `upcoming` fixture and schedule, duration, and notes
  omitted, the card displayed **Upcoming workout**, title and exercise count
  without stray separators. Details showed the same title and status and hid
  the Notes toggle. The original fixture was restored after testing.
- With the temporary `null` fixture, Home displayed the empty state and omitted
  the Workout quick-access tile. Navigating to an unknown workout ID displayed
  **Workout unavailable**; **Back to dashboard** returned to Home. The original
  fixture was restored after testing.

These checks establish the acceptance criteria for the agreed static-data UI
prototype, not backend/client-auth integration. The Add/Remove Set, Add/Remove
Exercise, and Finish Workout controls in the existing detail prototype are
visual placeholders; their behavior is outside K2F-46/145–147.

## Static checks

```bash
npx expo lint
npx tsc --noEmit
```
