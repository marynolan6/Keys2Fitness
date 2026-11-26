# K2F-129 — Weight over time

Open **Client → Progress → Weight over time**. The chart uses the same sample check-ins as Client Profile. Its date windows end on the displayed sample date, **October 3, 2026**. Account weight entries and goal editing continue to use Firestore separately.

| Subtask | Acceptance check |
| --- | --- |
| K2F-211 — Line chart | Check-ins are plotted oldest to newest with actual calendar spacing and pounds. The chart label summarizes the latest reading and change. **Show readings** exposes individually labeled date/value rows, newest first, ten at a time. Changing the range collapses the list. |
| K2F-212 — Time ranges | **30 days** starts Sep 4 (5 readings), **90 days** starts Jul 6 (6), and **All time** starts Sep 1 (6). The highlighted button and its accessibility selection state update together. The latter two ranges share readings but have different date axes. |
| K2F-213 — Limited data | No readings shows guidance. If a selected window is empty but older readings exist, it suggests **All time**. One reading shows its date, weight, one point and an explanation. Multiple readings on one day are shown without implying a trend across dates. |

[Android chart preview](images/weight-progress-chart.png)

## Verification

From `K2F/`, run `npm run test:progress` for chronological ordering, proportional spacing, inclusive boundaries, leap days, invalid data and sparse/flat series. The full Node test suite, TypeScript check, changed-file ESLint and Expo web export passed.

The three controls, their selected states, axis dates, reading counts and displayed changes were checked in Expo Go on Android at **390 dp**, **320 dp with 1.5× text**, and **800 dp**. Single-entry, no-entry and range-empty → All time recovery were also exercised using temporary in-memory sample data. The original samples and emulator display settings were restored. iOS and spoken screen-reader output were not manually tested.
