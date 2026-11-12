# K2F-39 — Confirm workout assignment

Branch: `spencer/sprint-5/K2F-39/confirm-workout-assignment`

Base: `main` at `3ef3742`, including merged PRs #41 and #42.

## Audit and scope

The existing workout library already selected templates and clients, persisted independent assignment snapshots, and exposed the latest assignment in demo-client Home. Both library and editor assigned immediately. There was no assignment confirmation, persistent recipient status in the library, or client-facing list of earlier assignments.

This implements the story within the previously agreed **on-device prototype**. Client selection uses the existing demo client directory and preview identity. AsyncStorage persists the assignments on this device. It does not deliver assignments between independently authenticated devices; production delivery requires an authenticated assignment repository and client identity integration. Screens and confirmation explicitly identify the local scope. A “completed workout” here means a finished, valid coach-built plan, not a client's completed workout session.

## Acceptance criteria

| Work item | Coverage |
| --- | --- |
| K2F-208: choose a workout | Saved templates remain selectable; filtering no longer silently switches the selected workout. The selection is shown above the assignment action. |
| K2F-208: choose a client | Existing single/multi-client selection remains available, including preselection when entering from a client's profile. Selected client names are shown explicitly. |
| K2F-208: show the pairing | Review displays the workout name, exercise/duration summary, and each selected recipient's name. |
| K2F-209: confirm or cancel | Both editor and library require Confirm assignment. Cancel assignment or Android Back closes the review without saving. |
| K2F-209: cancellation leaves assignment unchanged | Opening/canceling review performs no assignment write. Editor draft, recipients and prescriptions remain available. |
| K2F-209: confirming completes assignment | Confirmation invokes the application service, and success appears only after persistence. Pending submits are guarded and review retains errors for retry. |
| K2F-210: correct client receives workout | Persisted snapshots are filtered by the selected demo client; another client's assignment IDs remain unavailable in the client workout route. |
| K2F-210: coach sees assignment | Library cards show named recipients and links to their assignments. The client's coach workout page shows recipient and assignment timestamp. |
| K2F-210: client can open workout | Your assigned workouts lists all selected-client copies, including earlier ones, with date/time and individual Open actions. The existing current/active workout card remains available. |

The library review freezes a copy of the selected plan/recipients. If its template is edited or deleted, or a recipient becomes unavailable, confirmation fails explicitly. Template assignment validates that the selected plan is complete before saving. Failed writes publish no false assignment. Existing assignment snapshots, exercise notes, performance, and history formats are preserved; this feature requires no storage migration.

## Automated checks

```bash
npm run test:workouts
npx tsc --noEmit
npm run lint
```

- **63 workout tests pass**, including five added assignment scenarios: review/cancel without writes; confirmed assignment/restart/client isolation; write failure and retry; stale template/deleted template/unavailable client rejection; editor confirmation freezing/cancellation/failure preservation.
- TypeScript passes.
- Changed-file ESLint passes.
- Full-project Expo lint still reports the existing **33 errors and 2 warnings** in login, Progress, coach check-ins, root index, and DoorOpeningIntro. None are introduced by this feature.

## Android verification performed

Used the connected Expo Go emulator with uniquely named Bench Press fixtures for Alex Morgan:

- Editor assignment review showed the exact workout and Alex's name. Both Cancel assignment and Android Back returned to the retained draft. Confirmation persisted the assignment and opened the correct workout from coach preview.
- Duration and coach notes were left blank in the new assignment fixture, exercising optional data.
- Switching client Home to Spencer showed the empty coach-built assignment state. Switching back to Alex restored the assigned workout.
- Library cancellation and confirmation passed. A second assignment of the same plan retained both copies in Your assigned workouts. Their separate dated actions were verified, including opening the earlier copy.
- Coach-side assignment visibility survived force-stopping/restarting Expo Go.
- Library confirmation controls and the client assignment list were reachable at approximately **390 dp**, **320 dp**, **320 dp / 1.5× font scale**, and **800 dp tablet width**. Emulator size, density and font scale were restored afterward. Changing density restarted the app; the layout driver needed to reopen the route after startup.
- The complete assignment smoke driver passed again after its repeated-copy check and automatic template cleanup were added.
- A second acceptance review found that the retained library could keep Alex selected when reopened from Spencer's profile. The library workflow and editor form are now keyed by their client entry context. Targeted Android checks passed Alex → Spencer → Alex in both screens. A two-client review showed both names, and cancellation retained both checked selections. The smoke driver now includes the client-context regression check; that appended check was verified separately rather than rerunning the entire fixture flow.
- The completion smoke driver's new self-contained fixture setup passed assignment, completion cancellation, successful completion and recorded-set history. Its 300-second shell run expired before the remaining early-end/cleanup steps; those were resumed manually and passed. The original architecture driver was updated to confirm assignment, but was not rerun in this change.

The assignment smoke test is `python3 -B tests/workout-assignment-smoke.py`. It uses the default demo directory with Spencer initially having no coach-built assignments. It now runs inside the [shared smoke sandbox](smoke-test-cleanup.md), restoring the original library, assigned copies, sessions and preview client after success or failure. The completion driver creates its own one-exercise plan instead of depending on Builder Demo Plan and uses the same automatic cleanup.

During that earlier review, older `Assignment smoke …` and `Completion smoke …` reusable templates were removed through the library's confirmed Delete action, leaving four saved templates. Their retained assigned copies/history were subsequently removed by the shared smoke-cleanup change. An input-driver timing issue encountered during the earlier cleanup was resolved by allowing controlled text fields to process deletion before typing replacement text.

iOS, web, screen-reader operation, injected device-storage failures, and empty/error directory screens were not manually verified. Relevant failure/retry, storage compatibility, invalid/missing clients and empty-library behavior are covered by the workout logic/integration suite.

## Second acceptance review result

K2F-208, K2F-209 and K2F-210 meet their listed acceptance criteria within the local demo-client scope described above. The review traced both assignment entry points through confirmation and persistence, checked cancellation and failure/retry behavior, verified the client route's ownership guard and all-assignment access, and confirmed coach-visible recipient status. The retained-client-selection issue was corrected and verified. All 63 tests, TypeScript and changed-file ESLint passed again after the correction; the library still contains four saved templates, with no new test templates created by this review.
