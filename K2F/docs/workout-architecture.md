# Workout application architecture

Branch: `spencer/general-updates/architecture-refinement`

The workout features use a functional domain core, controller hooks, application services, and domain-level repository ports. Composition roots connect those ports to local persistence, the demo client directory, and the current coach display name.

```text
Screens / reusable UI
  ├─ useWorkoutEditor  → workoutEditorReducer
  └─ useWorkoutSession → workoutSessionReducer
           │
           ▼
  WorkoutLibraryService / WorkoutSessionService
           │
           ▼
  WorkoutLibraryRepository / WorkoutSessionRepository (interfaces)
           │
           ▼
  Local adapters → validation / migrations → ordered storage queue → AsyncStorage
```

## Responsibilities

| Layer | Files | Responsibility |
| --- | --- | --- |
| Presentation | Coach editor and client workout route | Render fields, cards and dialogs; handle navigation and presentation-only modal state |
| Controllers | `src/hooks/useWorkoutEditor.ts`, `src/hooks/useWorkoutSession.ts` | Drive async workflows, invoke services, coordinate loading/saving/retry, and adapt state for the view |
| Reducers | `workoutEditorReducer.ts`, `workoutSessionReducer.ts` | Pure, testable state transitions; retain drafts/progress on failures; reject inappropriate edits |
| Domain | `workoutLibraryModel.ts`, `workoutSessionModel.ts`, timer/set-performance/lookup helpers | Validation and transformations, prescription/performance separation, assignment snapshots, timer rules and labels |
| Application | `workoutLibraryService.ts`, `workoutSessionService.ts` | Save/assign/duplicate plans, validate selected clients, restore/resume workouts, and persist timer transitions |
| Ports | `workoutRepositories.ts` | Domain operations and atomic plan/assignment commit expectations, independent of JSON or AsyncStorage |
| Local adapters | `workoutLibraryRepository.ts`, `workoutSessionStore.ts` | Persist/read domain records, expose a reactive library read model, and apply storage migrations |
| Composition roots | `workoutLibraryStore.ts`, `workoutSession.ts` | Supply concrete adapters, client directory, IDs, time and author identity; expose application facades to existing callers |

The library screen can call the application facade directly for its simpler actions. The two more complex editor/session workflows have their own controllers. Modal visibility and scrolling remain presentation concerns.

## Applying the standards

The required agent instructions live in [`../AGENTS.md`](../AGENTS.md). Apply them to new or substantially modified workout features, improving existing modules incrementally as they are touched. Keep unrelated legacy refactors out of feature work.

Use the smallest structure that clearly separates responsibilities:

| Situation | Preferred approach |
| --- | --- |
| Menu visibility, selected modal or another simple local UI concern | Component state with `useState` |
| Loading, restoring, validating, saving and retrying a coordinated screen workflow | Controller hook with explicit reducer states |
| A calculation, validation rule or data transformation | Pure domain function |
| Assigning a workout, continuing a session or another business operation | Application service/use case using repository ports |
| Durable reads/writes and storage-format changes | Adapter with validation, ordered operations and explicit migrations |
| Behavior crossing assignment, client display data and recorded progress | Application integration coverage, supplemented by native UI verification |

Small components do not need a controller or a full set of layers. New abstractions should separate a concrete responsibility or enable meaningful reuse/testing. Existing simple actions can continue to call the application facade directly. Maintain the dependency direction: domain functions, reducers, services and ports stay independent of React, native UI, routing, Firebase and AsyncStorage; composition roots supply concrete implementations and business clocks, IDs and identity.

### Guidance and executable enforcement

`AGENTS.md` supplies required working instructions; this document provides rationale and examples. Agents should verify the changed dependency boundaries, appropriate async states, preservation of data on failure, persistence compatibility and relevant integration behavior before reporting completion.

Current executable checks include TypeScript repository contracts, the workout test command, and the project's existing ESLint configuration. These checks support the standards, but do not by themselves enforce every architectural dependency rule. Dedicated import-boundary lint rules and CI wiring for lint/typecheck/workout tests remain follow-up work. Report actual command results and existing failures accurately; describe a check as CI-enforced only after its configuration and execution have been verified.

## Explicit workflow states

The session reducer distinguishes **loading**, **load-error**, **ready**, and **transitioning**. Its checkpoint state separately distinguishes **saved**, **saving a particular revision**, and **error**. An acknowledgement for an older edit cannot mark newer edits saved. Pause/End failures retain the previous timer and recorded values.

The editor reducer distinguishes **editing**, **saving**, **saved**, and **error**. Save failures preserve the draft, alternatives and selected clients. Both controllers guard duplicate submissions. Completion navigation is delivered once from the active editor view, including when React Activity hides and later reactivates a tab.

The session hook consumes each explicit Continue request once per mounted screen, so reactivating a previously paused view does not re-consume the same resume intent. Service-level timer transitions remain pure and preserve an already-running clock's starting point.

## Dependency boundaries

- Services depend on domain repository interfaces, a client-directory port, and injected ID/time/author providers. They do not import React, Firebase, AsyncStorage or navigation.
- Repository adapters handle storage primitives; the domain interfaces expose operations such as template/assignment lookup and `saveWorkoutPlan`, not `getItem`/`setItem`.
- Saving a reusable template and its client assignments is one adapter commit. A future remote adapter must preserve that atomicity and independent assignment snapshots.
- Current demo preview preferences are part of the local library read model. Real authenticated ownership/client mapping and a Firebase adapter are future integration work, not implemented by this refactor.

## Storage migrations

Existing keys are retained:

- Library: `keys2fitness:workout-library:v1` (the historical key name stays stable).
- Sessions: `keys2fitness:workout-session:<workoutId>`.

`workoutMigrations.ts` reads the previous library `{ version: 1, ... }` format and unversioned session checkpoints, validates them, and upgrades them to an envelope:

```json
{ "schemaVersion": 2, "data": { "...": "domain fields" } }
```

The library domain model no longer carries a storage version. Canonical session models always have a timer; the redundant legacy `paused` flag is interpreted during migration and omitted from new records. Old paused checkpoints without a timer resume at their previously supported zero elapsed-time default. Recorded rows, values, completion flags, IDs, notes, and available timing metadata are preserved.

- Valid old records are upgraded once, before a successful load is published.
- Corrupt or unsupported future schemas are not overwritten. Explicit workout loads show an error; active-session scanning skips invalid unrelated records while still propagating I/O failures.
- Failed migration writes retain the original record and can be retried.
- Reads/migrations and writes share a queue, preventing an old read-time migration from overwriting a newer checkpoint.

K2F-33 subsequently advances session envelopes to schema 3 with a `history` array alongside the latest checkpoint. The library remains schema 2. A domain repository finalization operation commits the checkpoint and one immutable history entry in a single local write, keyed by attempt ID for idempotency. Clearing/restarting a checkpoint preserves earlier attempts. See [completion verification](workout-completion-testing.md) for outcome rules and compatibility.

K2F-38 subsequently advances the **library to schema 3** for optional rest/weight and per-assigned-exercise recommendation overrides. V1 and V2 libraries migrate while preserving their existing assignments; session envelopes remain schema 3 and continue accepting V2 checkpoints. The recommendation controller uses explicit load/edit/save/retry states, and its repository operation merges only the scoped recommendation atomically. See [prescription verification](workout-prescription-testing.md).

K2F-292 adds request/client-scoped history loading and key-based read-only record selection in `useWorkoutHistory` / `workoutHistoryReducer`, plus explicit demo-client selection in `useWorkoutPreview` / `workoutPreviewReducer`. The history use case enforces client scoping and chronological order independently of the adapter. Existing session envelopes and immutable records are reused without a schema change. See [history verification](workout-history-testing.md) for the acceptance criteria, lifecycle transitions and current checks.

## Verification

```bash
npm run test:workouts
npx tsc --noEmit
npx expo lint
```

All **50 workout tests** pass. This includes prior behavior tests, reducer failure/ordering tests, v1-to-v2 migration tests, and application integration tests spanning editor state → coach assignment → client note data → recorded sets → restart → dashboard Continue. A domain-only repository test verifies services do not require the local adapter's observable-state or key-value API.

TypeScript and changed-file ESLint pass. Full-project lint retains the existing 33 errors and 2 warnings in login, progress, coach check-ins, root index and DoorOpeningIntro.

### Android integration smoke test

Start Expo and connect the emulator. The default source is the seeded Upper Body Strength template; an existing template with Bench Press can also be supplied:

```bash
adb reverse tcp:8081 tcp:8081
python3 tests/workout-flow-smoke.py --source "Builder Demo Plan"
```

Use `--base-url exp://YOUR-TUNNEL-HOST` when using a tunnel. The driver duplicates the supplied template, creates a uniquely named local test assignment for Alex, edits both note types, verifies their client display, exercises Start/checkpoint/Continue/Pause/Resume/End, deletes the test template, and checks that its assigned copy and ended session remain available during the assertion. A shared sandbox then restores the pre-run workout baseline, including removing the assigned copy and history, even when the test fails. See [automatic smoke cleanup](smoke-test-cleanup.md).

The full flow passed on the normal connected Android emulator using Builder Demo Plan. The timer-sensitive portions use captured control positions because UIAutomator can otherwise fail to become idle while the clock ticks. An earlier run timed out at that automation boundary; its local test workout was ended, and the corrected driver completed successfully.

This is a behavior/architecture refinement; screen styles and the shared navigation design are retained. iOS/web, screen-reader interactions, and the full native smoke flow at alternate window sizes were not rerun. Automated migration tests use isolated storage fixtures rather than corrupting or replacing the emulator's saved data.
