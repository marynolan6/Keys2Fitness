# K2F-292 — Completed workout history

Branch: `spencer/sprint-4/K2F-292/completed-workout-history`

## Scope and existing behavior

Sprint 4 uses the **selected demo client and existing on-device completion archive** from K2F-32/K2F-33. Firebase history synchronization and authenticated account/client mapping remain backend integration work.

K2F-33 already supplied immutable attempt records, chronological repository reads, completion totals, and a basic history/detail modal in Home and Progress. This story extends those components and the existing session service rather than creating a second archive or rebuilding the set-entry controls.

## Acceptance coverage

| Story/subtask | Implementation |
| --- | --- |
| K2F-296 — history list | Quick-access **Workout history** opens `/client/history`; Home and Progress retain the shared history section. Completed workouts are the default, newest first, with date, title and outcome. **All finished workouts** also exposes ended-early records without counting them as completed. |
| K2F-297 — recorded results | Each record opens a read-only detail modal with title, finish date, active time, exercise completion and individual actual sets/reps/pounds. Targets are labeled separately. Zero, blank, decimal and missing actual-set values remain distinct. |
| K2F-298 — empty/missing/responsive | Clear no-history, unavailable-record, missing-exercise, missing-set and load-error/retry feedback. Client/workout/attempt lookup has no fallback to another client's record or a live workout. Narrow layouts stack controls and recorded values; long content scrolls above the persistent Back action. |

Both **Back to workout history** and Android Back close the detail and retain the same list, filter, expansion and scroll position. Leaving the history route closes its detail; returning does not reopen an old modal. Client changes reset the filter, expansion and selection.

### SDK 58 navigation

The installed Expo Router maps `href: null` to `hidden: true`, which redirects this history tab to the first visible route. The history route therefore has a title but no `href: null`; the shared `AppTabBar` already displays only its four icon-allowlisted destinations. Native menu navigation was verified after this adjustment.

## State-machine corrections

- **History loading:** `idle → loading → ready | error`; Retry returns to idle and starts a fresh request. Reducer completions require both the current client and request ID. Effect cleanup also invalidates async callbacks on blur, client changes, retry or unmount.
- **History selection:** explicit list/detail view containing a `(workoutId, sessionId)` key, not a cached record object. Lookup additionally requires the selected client. Missing keys produce unavailable-record feedback. Loading errors cannot leave old detail data visible.
- **History navigation:** Back preserves list controls; leaving the route closes the detail and invalidates pending loads. A library that has not restored successfully does not trigger a read for its default/previous client.
- **Demo-client selection:** `closed → choosing → saving → closed | error`; failure retains the chooser for retry. Saving rejects duplicate selection/dismissal. An immediate submission lock and active-view scope prevent duplicate writes and stale completion feedback after navigation.

Reducers and history projections live under `src/workouts/`, independent of React, Expo and storage. Controller hooks call composition-root application facades. `WorkoutHistoryDetails` renders the archived snapshot directly and never initializes target-based performance rows or invokes session editing/timer operations.

The broader [application audit](implicit-state-machines.md) is a historical inventory at its pinned source snapshot; this change addresses the history and demo-client workflows touched by K2F-292.

## Automated verification

Run from `K2F/`:

```bash
npm run test:workouts
node --test tests/coach-tips.test.mjs tests/profile.test.mjs
npx tsc --noEmit
npx expo lint
```

`tests/workout-history.test.mjs` adds **14 regression tests** covering:

- Client isolation, completed-only filtering and stable chronological order, including a domain-only repository returning mixed/unsorted records.
- Exact client/workout/attempt lookup, invalid IDs, repeated attempts and colliding IDs.
- Recorded zero/decimal/blank values and sparse archived exercises without manufactured performance rows.
- Stale success/failure across client changes and overlapping requests for the same client; error/retry/clear behavior.
- Back/list-state preservation, route-leave invalidation, reset selection and missing-record lookup after reload.
- Demo-client pending/dismissal guards, failure/retry and stale-completion reset behavior.
- Persistence round-trips with multiple completed attempts and a separate active attempt; browsing leaves modern stored checkpoints/history unchanged.
- Legacy ended-session compatibility, corrupt-record preservation and recovery from storage failures.

Final branch verification: **94 workout tests** (including 8 smoke-cleanup regressions), **7 coach-tip tests**, **4 profile tests**, **5 Python cleanup lifecycle tests**, TypeScript and changed-file ESLint pass. Full-project lint retains the existing **33 errors and 2 warnings** in login, Progress, coach check-ins, root index and DoorOpeningIntro. See [automatic smoke cleanup](smoke-test-cleanup.md) for fixture restoration and recovery.

The existing K2F-33 completion smoke driver's history assertions now use the updated recorded-set layout and Back label.

## Android verification performed

Expo Go, SDK 58, Android 17/API 37 emulator; UIAutomator-driven interactions with isolated, uniquely named local fixtures:

| Window width | 1.0× font scale | 1.5× font scale |
| --- | --- | --- |
| 320 dp | Passed | Passed |
| 390 dp | Passed | Passed |
| 800 dp | Passed | Passed |

At every size: opened the list and a completed record, scrolled through actual and sparse set results, checked that the Back control stayed within the window with at least a 48 dp target, and used Android Back to return to the list. Long workout titles wrapped in the fixtures.

Additional native checks passed:

- Quick-access menu reaches the history route with four bottom tabs.
- Newest-first completed browsing and isolation from a second client's history.
- Explicit Back preserves expanded-list scroll position.
- Actual `7` reps / `127.5 lb`, explicit `0` reps / `0 lb`, unrecorded values, and an exercise without performed sets.
- All-finished filter and an ended-early record with no exercise details.
- Empty history and switching among Spencer, Alex and Jordan without old detail resurrection.
- A corrupt **test-only** archive produces the error view; removing it and pressing Retry restores the list.
- Leaving history with a detail open, removing that test record, and returning displays the current list without the old modal.
- Existing session/archive keys were compared byte-for-byte before/after. Test-only keys were removed; the original demo client, display size, density and font scale were restored.

The native driver used temporary Hermes/ADB tooling outside the repository. The committed regression tests and manual interaction steps above provide the repeatable project-level coverage. Automated invalid-ID/stale-request checks use isolated fixtures rather than modifying user archives. iOS/web and TalkBack interaction were not manually verified for this story.
