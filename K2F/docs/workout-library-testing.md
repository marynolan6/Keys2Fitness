# K2F-35 — Coach workout library

Branch: `spencer/sprint-4/K2F-35/workout-library`

Open **Coach → + → Workout Library**. The **All** filter includes reusable templates and the individual workouts assigned to demo clients on this device. The type filters narrow the view, and search matches workout/template names, exercise names, or the recipient's name on assigned workouts. Entering from a client's **Choose from workout library** action starts with Templates and preselects that client for assignment.

| Work item | Coverage |
| --- | --- |
| K2F-196: Build workout library screen | Named cards show both types. Assigned workouts show the recipient and assignment date/time, including one-off workouts and copies whose source template was deleted. |
| K2F-197: Open workout or template details | Tap a card to open its details by type and ID. The screen shows the saved prescription, notes, and optional fields. **Edit template** opens the builder; **Edit recommendation** on an assigned workout updates only that client's exercise. **Back to workout library** returns to the list. |
| K2F-198: Add library empty and loading states | The library shows a loading indicator, load errors with **Retry workout library**, a true empty state with **Create workout**, separate empty-type messages, and a no-matches state with **Clear search**. |

Templates and assignments use the existing on-device repository. Assigned copies retain their prescriptions independently of template edits and deletion. Browsing uses the saved assignment ID, so same-name workouts open their own details. Assignment still uses the explicit **Select for assignment** action, client picker, and confirmation dialog.

## Verification

- `npm run test:workouts`: 108 tests pass, including coverage for searching both types, selecting the correct repeated assignment, opening a one-off assignment and preserving assigned copies after editing/deleting a template and reopening storage.
- `npx tsc --noEmit`, changed-file ESLint, `npx expo export --platform web`, and the five workout sandbox tests pass.
- Full `npm run lint` reports the existing 30 errors and 3 warnings in `DoorOpeningIntro`, the root index route, and `useRecentClientActivity`.

### Android (Expo Go)

- Opened the library from the coach quick-access menu. Verified a slow load, a saved-data error with Retry, and **Create workout** from an empty library using isolated fixtures.
- Opened a one-off workout without a reusable template or prescribed weight. Verified that both the on-screen Back action and Android Back return to the library and preserve its search/filter state.
- Opened and edited a template from its details. Verified that same-name assignments showed their own prescriptions, including bodyweight and zero rest. Saved Alex's recommendation from the assigned-workout details and confirmed the same exercise for Spencer was unchanged.
- Checked both types' cards, details, and management controls at 390 dp, 320 dp with 1.5× text, and 800 dp tablet width.
- Deleted a test template and reopened its assigned workout. Verified **Clear search**, the unavailable-item screen, and its return action.
- Entered the library with Alex preselected, browsed details without changing the selected template, then selected a different template explicitly. Cancel left assignments unchanged; confirmation saved the correct workout for Alex and made its details available in the library.
- Restored the original local workout data and emulator display settings after testing.
