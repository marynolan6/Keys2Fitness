# Application state-machine audit

Source snapshot: **`e260ec3`**, on `spencer/sprint-5/K2F-39/confirm-workout-assignment`.

## Scope and terminology

This is a source audit of the **108 tracked files under `K2F/src`** at that snapshot. The inventory covers routes, components, hooks, message read-state handling, external stores, domain transitions, and persistence adapters. State declarations were cross-checked against their setters, event handlers, effects, async completions, cleanup functions, and rendering conditions. Generated output, dependencies, design PDFs, and hypothetical future features are outside the scope.

An **implicit workflow** here is a stateful interaction whose effective phases and legal transitions have to be reconstructed from several values or from callback/effect ordering, rather than one explicit workflow state and its transition function. The phase names below describe the current implementation; they are not claims that corresponding enums exist.

Important distinctions:

- A named status union and transition reducer are already an **explicit** machine, even without a state-machine library.
- A reducer can coexist with additional **implicit coordination** in refs, local state, and route callbacks. Those are listed separately.
- Open/closed controls and draft eligibility are small stateful interactions. They are inventoried, but their presence does not imply they need a reducer or refactor.
- A pure conditional projection, a temporary loop variable, an ID counter, or an isolated async function is not, by itself, an application state machine.
- Persistence/animation sequencing is identified as a **protocol/timeline** where that description is more accurate than calling it a finite-state UI machine.

No application behavior was changed for this audit. Observations below are source-level findings, not a claim that every race or failure was reproduced on a device.

## 1. Implicit workflows

### W01 — Login validation, authentication, and role routing

Source: [login.tsx:25–128](../src/app/auth/login.tsx#L25-L128), [login.tsx:234–263](../src/app/auth/login.tsx#L234-L263).

- **Encoding:** `fields`, `touched`, `submitAttempted`, `authError`, `isSubmitting`; the independent `showIntro` flag gates the button.
- **Effective phases:** pristine/editing → validation rejected or submitting → Firebase authenticated → role lookup → route replacement; failures return to the form with an authentication error.
- **Events:** field change, blur, submit, authentication resolution/rejection, profile-document resolution/rejection, intro completion.
- **Why implicit:** authenticating and loading the role share `isSubmitting`; validation visibility depends on separate interaction flags. There is no distinct state for an authenticated user whose role lookup failed.
- **Observed detail:** changing a field does not clear `authError`; submit clears it. `finally` resets submitting after either navigation or failure.

### W02 — Account creation across Auth, Firestore, and sign-out

Source: [signup.tsx:20–97](../src/app/auth/signup.tsx#L20-L97).

- **Encoding:** form values, `error`, `success`, `isSubmitting`, sequential awaited operations.
- **Effective phases:** editing → validation rejected or creating Auth user → writing user document → signing out → success/reset/navigation; any awaited failure enters the shared error path.
- **Events:** submit, validation failure, completion/failure of each of the three external operations.
- **Why implicit:** one flag covers several externally observable stages. If Auth creation succeeds and a later step fails, the code has no phase-specific recovery state or rollback operation.
- **Observed detail:** the button is disabled while submitting, but `handleSubmit` itself has no `isSubmitting` early-return guard.

### W03 — Client profile restoration

Source: [client/profile.tsx:43–63](../src/app/client/profile.tsx#L43-L63), [profileStorage.ts:7–16](../src/profile/profileStorage.ts#L7-L16).

- **Encoding:** default `profile`/`draft`, `loading`, `feedback`, `feedbackIsError`.
- **Effective phases:** default values while restoring → restored profile or defaults with load-failure feedback → loading finished.
- **Events:** mount, storage success/failure.
- **Why implicit:** loading and outcome are represented by separate fields. The effect has no active-request cleanup guard.
- **Observed detail:** missing or malformed serialized profile data returns defaults inside `loadProfile`; a storage-read rejection reaches the screen's failure feedback. These are different paths.

### W04 — Client profile/preference edit transaction

Source: [client/profile.tsx:65–120](../src/app/client/profile.tsx#L65-L120), [client/profile.tsx:181–229](../src/app/client/profile.tsx#L181-L229).

- **Encoding:** `profile` versus `draft`, `editing`, `saving`, validation errors, feedback text and error flag.
- **Effective phases:** viewing → editing → validation rejected or saving → saved/viewing; a failed save retains the edit; cancel restores the current profile values.
- **Events:** Edit, field/preference change, Save, Cancel, storage completion/failure.
- **Why implicit:** the legal combinations of editing, saving, validation, and feedback live in handlers and UI disabled conditions rather than a workflow type.
- **Observed detail:** Save and Cancel are disabled during saving, and success commits both `profile` and `draft` after the storage operation resolves.

### W05 — Coach profile local edit mode

Source: [coach/profile.tsx:28–38](../src/app/coach/profile.tsx#L28-L38), [coach/profile.tsx:94–133](../src/app/coach/profile.tsx#L94-L133).

- **Encoding:** `editing` plus the displayed profile/preference fields themselves.
- **Effective phases:** viewing ↔ editing; field changes immediately update the same local values used by the viewing mode.
- **Events:** Edit, field/switch change, Cancel, Save changes.
- **Why included:** the labels suggest an edit/save/cancel transaction, but its actual lifecycle is a local mode switch.
- **Observed detail:** Cancel and Save both close editing; Cancel does not restore previous values, and neither action persists a coach profile. There is no separate draft, validation, or saving phase here.

### W06 — Logout confirmation and execution, implemented twice

Source: [client/profile.tsx:129–157](../src/app/client/profile.tsx#L129-L157), [coach/profile.tsx:40–68](../src/app/coach/profile.tsx#L40-L68).

- **Encoding:** native `Alert` callback state plus `loggingOut` in each screen.
- **Effective phases:** idle → confirmation open → canceled/idle or signing out → login navigation; failure logs an error and returns to idle.
- **Events:** Log out, native Cancel/dismiss, confirm, `signOut` completion/failure.
- **Why implicit:** confirmation is held by the native dialog while execution is held by a React boolean. Success leaves `loggingOut` true and relies on navigation to leave the screen.
- **Multiplicity:** this is one workflow pattern with two independent implementations, not a shared logout controller.

### W07 — Progress authentication and parallel subscription coordination

Source: [client/progress.tsx:67–150](../src/app/client/progress.tsx#L67-L150), [client/progress.tsx:316–341](../src/app/client/progress.tsx#L316-L341).

- **Encoding:** `userId`, `authReady`, `loading`, shared `error`, `goal`, `entries`; two Firestore subscriptions and their cleanup callbacks.
- **Effective phases:** waiting for Auth → signed out or subscribed for a user → goal/history callbacks update data or errors → unsubscribe when identity changes/unmounts.
- **Events:** Auth callback, goal snapshot/error, weight-history snapshot/error, identity change, effect cleanup.
- **Why implicit:** Auth readiness and two independent resources are collapsed into one loading flag and error string.
- **Observed details:** goal success/error clears `loading`; the weight-history callbacks do not. Existing `goal` and `entries` are not cleared and `loading` is not restarted when `userId` changes. These facts matter when modeling identity changes and partial readiness.

### W08 — Weight measurement create/edit form

Source: [client/progress.tsx:73–77](../src/app/client/progress.tsx#L73-L77), [client/progress.tsx:168–222](../src/app/client/progress.tsx#L168-L222), [client/progress.tsx:421–478](../src/app/client/progress.tsx#L421-L478).

- **Encoding:** `adding`, `editingEntryId`, `weight`, `formError`, `saving`, current `entries`.
- **Effective phases:** closed → creating or editing an existing entry → validation rejected or saving → closed/reset; save failure retains the form with an error.
- **Events:** Add, Edit, input, Save/Update, Cancel, Firestore completion/failure.
- **Why implicit:** create versus edit and open versus saving are independent fields; operation type is chosen inside `saveWeight`.
- **Observed detail:** only the Save/Update button is disabled by `saving`. Cancel, input, and list Edit actions are not guarded by that flag. A pending completion resets/closes the form without a request-identity check.

### W09 — Weight measurement deletion

Source: [client/progress.tsx:224–247](../src/app/client/progress.tsx#L224-L247).

- **Encoding:** captured `entryId` and signed-in user in native `Alert` callbacks; shared page error; Firestore subscription supplies the updated list.
- **Effective phases:** idle → confirm delete → canceled or deletion pending → list updated externally; failure sets the page error.
- **Events:** Delete, native confirmation/cancel, delete success/failure, subsequent subscription update.
- **Why implicit:** neither confirmation target nor in-flight deletion is modeled in React state. There is no per-entry deletion-pending state.

### W10 — Weight-goal create/edit form

Source: [client/progress.tsx:78–83](../src/app/client/progress.tsx#L78-L83), [client/progress.tsx:249–314](../src/app/client/progress.tsx#L249-L314), [client/progress.tsx:346–395](../src/app/client/progress.tsx#L346-L395).

- **Encoding:** `editingGoal`, three draft fields, `goalError`, `savingGoal`, current `goal` and Auth-derived `userId`.
- **Effective phases:** closed → initialized draft → validation rejected or saving → goal updated/form closed; failure leaves the form open.
- **Events:** Set goal/Edit, input, Save goal, Cancel, Firestore completion/failure.
- **Why implicit:** form mode, validity, save progress, and current goal are independently maintained.
- **Observed detail:** Cancel and fields remain available during a save, and the completion has no form/request-identity check. The goal subscription can also update `goal` independently of the save handler.

### W11 — Conversation read-marker hydration and blur-time persistence

Source: [MessageReadState.tsx:23–85](../src/messages/MessageReadState.tsx#L23-L85), used by [client/messages.tsx:48–52](../src/app/client/messages.tsx#L48-L52).

- **Encoding:** `readMessageIds`, `readStateLoaded`, mirrored refs, focus callback's `active` flag, persisted storage key.
- **Effective phases:** focus/read pending → stored read IDs loaded or read failure treated as loaded → unread evaluation enabled → blur/unmount computes viewed incoming IDs and writes their union with known IDs.
- **Events:** focus, storage success/failure, messages/read-ID updates, blur/unmount or storage-key/viewer change cleanup.
- **Why implicit:** UI readiness, latest values, focus lifetime, and persistence are split across state, refs, and cleanup.
- **Observed details:** `readStateLoaded` is not reset to false on each focus. The blur-time write is fire-and-forget without a rejection handler. If cleanup happens before hydration resolves, the union uses the IDs currently in the ref; the late hydration result is discarded.
- **Do not infer:** there is no server-backed delivery/acknowledgment state machine here.

### W12 — Dashboard greeting hydration on focus

Source: [client/home/index.tsx:28–48](../src/app/client/home/index.tsx#L28-L48).

- **Encoding:** default/stored first name, focus effect, closure-local `active`; selected demo-client name can override the displayed greeting.
- **Effective phases:** fallback name → focus-triggered read → saved name or fallback; blur invalidates the pending UI update.
- **Events:** focus, profile-read success/failure, blur, selected demo-client/data change.
- **Why implicit:** there is no named hydration status; the lifecycle is encoded by the effect and its liveness flag. This is a small async workflow, not a high-complexity business machine.

### W13 — Dashboard active/assigned workout restoration and retry

Source: [client/home/index.tsx:33–36](../src/app/client/home/index.tsx#L33-L36), [client/home/index.tsx:50–102](../src/app/client/home/index.tsx#L50-L102).

- **Encoding:** `sessionState` contains `active`, `assigned`, `loading`, `error`, `clientId`; `sessionRetry`, focus, library status, and effect liveness complete the state.
- **Effective phases:** waiting for focus/library readiness → loading active and assigned sessions together → ready with active/assigned/no session or load failure → retry.
- **Events:** focus/library/client change, both reads completing, rejection, retry, cleanup.
- **Why implicit:** loading/error flags coexist with nullable results and source identity, rather than a discriminated result state.
- **Observed detail:** stale UI updates are guarded by cleanup and client identity; library and session failures have different retry actions. Active/assigned/empty display modes are derived from this result, not extra independent machines.

### W14 — Quick-access menu identity lifecycle

Source: [AppQuickAccessMenu.tsx:48–62](../src/components/AppQuickAccessMenu.tsx#L48-L62).

- **Encoding:** `name`, role, menu visibility, profile-read liveness flag or Firebase unsubscribe callback.
- **Effective phases:** hidden → visible with fallback/previous identity → client profile hydrated or coach Auth subscription updated → hidden/cleanup.
- **Events:** menu open/close, role change, profile success/failure, Auth callback.
- **Why implicit:** there is no identity-loading state; role-dependent resource setup and teardown define the lifecycle.

### W15 — Quick-access workout resolution before navigation

Source: [AppQuickAccessMenu.tsx:96–111](../src/components/AppQuickAccessMenu.tsx#L96-L111).

- **Encoding:** pending async event-handler execution, captured library/client information, native error alert, parent menu visibility.
- **Effective phases:** menu open → resolving active session → close/navigate to active workout, assigned workout, or Home; rejection shows an alert.
- **Events:** Workout press, session-read completion/failure, menu dismissal while the read is pending.
- **Why implicit:** there is no resolving state, duplicate-press guard, or completion invalidation tied to menu closure. A lookup can complete after the menu has been dismissed.

### W16 — Library non-assignment operations sharing one operation host

Source: [coach/workouts/index.tsx:28–50](../src/app/coach/workouts/index.tsx#L28-L50), [coach/workouts/index.tsx:67–68](../src/app/coach/workouts/index.tsx#L67-L68), [coach/workouts/index.tsx:89–94](../src/app/coach/workouts/index.tsx#L89-L94), [coach/workouts/index.tsx:106–126](../src/app/coach/workouts/index.tsx#L106-L126).

Three operation paths use the same `act` helper:

1. **Duplicate:** idle → duplicating → new template selected/success feedback, or shared error.
2. **Delete:** `deleteTarget` selected/confirmation open → canceled, or deleting → target cleared/success feedback; failure keeps the target and shows the shared error.
3. **Preview navigation:** idle → persisting preview-client identity → navigate to client Home, or shared error. Two buttons invoke this same operation pattern.

- **Encoding:** `working`, `feedback`, `error`, `deleteTarget`, `selectedId`, plus `busy` derived from `working` and the separate assignment review.
- **Why implicit:** the active operation kind is not represented; phase and operation identity are reconstructed from the initiating handler and modal target.
- **Boundary:** library **assignment** has its own explicit reducer; it is not another wholly implicit operation in this row.

### W17 — Coach preview of a specific assigned workout

Source: [coach-client/[clientId]/workouts.tsx:21–22](../src/app/coach-client/[clientId]/workouts.tsx#L21-L22), [coach-client/[clientId]/workouts.tsx:53–62](../src/app/coach-client/[clientId]/workouts.tsx#L53-L62).

- **Encoding:** `previewing`, `error`, captured assignment/client IDs, pending preview-identity write.
- **Effective phases:** idle → preview identity saving → workout navigation; failure sets an error; `finally` resets previewing.
- **Events:** Preview, persistence success/failure, navigation.
- **Why implicit:** a boolean and callback chain stand in for the preview workflow; no request identity or active-view check is attached to completion.

### W18 — Demo-client selection and persistence

Source: [DemoWorkoutClientPicker.tsx:14–41](../src/components/DemoWorkoutClientPicker.tsx#L14-L41).

- **Encoding:** `open`, `busy`, `error`, external `previewClientId`, directory availability.
- **Effective phases:** closed → choosing → saving client selection → closed with new selection; failure keeps the chooser open with an error.
- **Events:** Change client, choose recipient, save success/failure, Close/Android Back.
- **Why implicit:** visibility, save progress, and failure are independent values. Directory-unavailable is an external condition rendered inside the chooser.
- **Observed detail:** row selection and modal dismissal are disabled while busy. The operation changes local workout preview identity, not the authenticated account.

## 2. Explicit machines with additional implicit coordination

These findings are narrower than saying that the entire workout feature is implicit.

### H01 — Editor review visibility, in-flight guard, and result delivery

Source: [useWorkoutEditor.ts:18–61](../src/hooks/useWorkoutEditor.ts#L18-L61), [workoutEditorReducer.ts:4–13](../src/workouts/workoutEditorReducer.ts#L4-L13), [coach/workouts/editor.tsx:30–35](../src/app/coach/workouts/editor.tsx#L30-L35), [coach/workouts/editor.tsx:93–96](../src/app/coach/workouts/editor.tsx#L93-L96).

- **Explicit core:** `editing | confirming | saving | saved | error` and reducer actions.
- **Implicit remainder:** `reviewClients !== null` controls review visibility separately; `pending.current` guards submission; `deliveredResult.current` tracks whether the saved result has been handed to navigation.
- **Actual composite path:** request review populates recipients and dispatches confirming → confirm sets pending/saving → failure dispatches error while recipients keep the modal open → retry, or cancel clears recipients; success leaves a saved result for an effect to deliver once.
- **Why it matters:** an error from assignment confirmation and another editor error share the same reducer status but differ in review visibility. That distinction exists in hook-local state, not the reducer alone.

### H02 — Workout finish/early-end confirmation around the session reducer

Source: [workout/[workoutId].tsx:55–73](../src/app/client/home/workout/[workoutId].tsx#L55-L73), [workout/[workoutId].tsx:190–198](../src/app/client/home/workout/[workoutId].tsx#L190-L198), [workout/[workoutId].tsx:314–339](../src/app/client/home/workout/[workoutId].tsx#L314-L339).

- **Explicit pieces:** `confirmation` explicitly names `null | finish | end`; session transitions and checkpoint status are reducer-driven; timer transitions are explicit.
- **Implicit remainder:** the full confirmation lifecycle is the product of local confirmation kind, session `transitioning`, transition error, timer status, and completion eligibility.
- **Transitions:** eligible action opens confirmation → cancel closes it without service mutation → confirm invokes the session service → success closes it; failure leaves it open for retry. Pending disables confirmation/dismissal.
- **Classification:** a partially explicit composition, not a missing timer/session machine.

### H03 — Immediate submission locks and async lifetime/token protocols

Source: [useWorkoutAssignment.ts:7–24](../src/hooks/useWorkoutAssignment.ts#L7-L24), [useWorkoutSession.ts:18–49](../src/hooks/useWorkoutSession.ts#L18-L49), [useWorkoutSession.ts:57–92](../src/hooks/useWorkoutSession.ts#L57-L92); editor equivalents are in H01.

- **Assignment:** `pending.current` provides an immediate unlocked → submitting → unlocked guard alongside the explicit assignment reducer.
- **Session lifetime:** `operationScope.current.active` determines whether an operation's completion is still accepted. Restoration replaces the scope; cleanup invalidates it.
- **Session transition lock:** `transitionPending.current` guards timer transitions and suppresses new checkpoints while a transition is in flight.
- **Resume consumption:** `consumedResumeRequest.current` records unconsumed → consumed status for a particular resume token; it is updated only on an accepted successful restore.
- **Checkpoint effect:** closure-local `active` determines whether an async checkpoint acknowledgment still belongs to the current effect. Revision ordering itself is explicit in the reducer.
- **Classification:** supplemental control protocols. The refs are not evidence that their underlying reducers are absent, nor proof of a bug.

### H04 — Performed-set and exercise completion state partitions

Source: [workout.ts:1–22](../src/workouts/workout.ts#L1-L22), [setPerformance.ts:28–44](../src/workouts/setPerformance.ts#L28-L44), [setPerformance.ts:56–103](../src/workouts/setPerformance.ts#L56-L103).

- **Encoding:** optional/initialized `actualSets`, per-set values and completion flag, aggregate `exercise.completed`.
- **Effective states:** uninitialized → initialized rows, preserving legacy completion when present; entry/confirmation toggles produce unconfirmed, partially confirmed or fully confirmed exercises. Editing a set clears its confirmation. Adding an unfinished set reopens aggregate completion; removing a row recalculates it. Reset returns to fresh unconfirmed rows.
- **Boundary:** the transitions are already implemented as explicit pure helper functions and are called by the session reducer. The *state partition/invariants* are implicit across fields rather than one tagged union.
- **Do not conflate:** all sets/exercises checked is eligibility for workout completion, not successful finalization/history persistence.

### H05 — Workflow reset through React identity

Source: [coach/workouts/index.tsx:15–22](../src/app/coach/workouts/index.tsx#L15-L22), [coach/workouts/editor.tsx:13–22](../src/app/coach/workouts/editor.tsx#L13-L22), [workout/[workoutId].tsx:52](../src/app/client/home/workout/[workoutId].tsx#L52), [ExerciseSetsModal.tsx](../src/components/ExerciseSetsModal.tsx).

The library's client key, editor's template/client key, workout content's workout key, and set-entry component's exercise key define reset boundaries via unmount/remount rather than reset events. These are lifecycle boundaries around existing workflows, not four additional independent business machines.

## 3. Small UI stateful interactions

These complete the inventory of local interaction modes without treating every control as a refactoring problem.

| Interaction | Source and encoding | Current transitions / qualification |
| --- | --- | --- |
| Intro overlay visibility | [app/index.tsx:11–21](../src/app/index.tsx#L11-L21), [auth/login.tsx:42](../src/app/auth/login.tsx#L42) and [258–263](../src/app/auth/login.tsx#L258-L263); `showIntro` | Visible → hidden on animation completion. Root `Redirect` is unconditional: its intro is **not** a gate that waits before routing. Login separately disables its button while its own intro is visible. |
| Quick-access menu visibility | [AppTabBar.tsx:27](../src/components/AppTabBar.tsx#L27), [68–74](../src/components/AppTabBar.tsx#L68-L74); `menuOpen` | Closed → open by plus; close/dismiss/navigation → closed. Identity and async workout resolution are W14/W15, not additional booleans in the tab bar. |
| Conversation search mode | [client/messages.tsx:36–45](../src/app/client/messages.tsx#L36-L45), [85–121](../src/app/client/messages.tsx#L85-L121); `isSearchOpen`, `searchQuery`, derived result presence | Conversation/closed → search open with blank query → result or no-match view for nonblank query; clear returns to blank search, cancel closes and clears. Search does not mutate messages. |
| Message composition and local send eligibility | [client/messages.tsx:34–76](../src/app/client/messages.tsx#L34-L76), [MessageComposer.tsx:16–34](../src/messages/MessageComposer.tsx#L16-L34) | Empty/whitespace draft ↔ sendable draft; Send appends a local mock message and clears the draft. Own typing indicator is derived from the draft. There is **no** sending/sent/failed network protocol. |
| Exercise detail modal selection | [workout/[workoutId].tsx:61–68](../src/app/client/home/workout/[workoutId].tsx#L61-L68), [252–265](../src/app/client/home/workout/[workoutId].tsx#L252-L265), [294–313](../src/app/client/home/workout/[workoutId].tsx#L294-L313) | No selection ↔ selected exercise details; independently no selection ↔ selected exercise sets. Two nullable IDs, not a single mutually exclusive overlay state. Modal components receive their state from the parent. |
| Coach-note sheet and floating affordance | [workout/[workoutId].tsx:63–65](../src/app/client/home/workout/[workoutId].tsx#L63-L65), [119–124](../src/app/client/home/workout/[workoutId].tsx#L119-L124), [282–292](../src/app/client/home/workout/[workoutId].tsx#L282-L292) | Scroll position updates `noteScrolledAway`; floating button appears only when applicable and sheet is closed; press/close toggles `showCoachNote`. `noteCardBottom` stores geometry, not a workflow state by itself. |
| Inline coach-note expansion | [WorkoutCoachNoteCard.tsx:16–48](../src/components/WorkoutCoachNoteCard.tsx#L16-L48); `expanded` | Collapsed ↔ expanded when collapsible. Otherwise always rendered expanded regardless of toggle state. |
| Check-in history expansion | [CheckInHistory.tsx:20–24](../src/components/CheckInHistory.tsx#L20-L24), [53–61](../src/components/CheckInHistory.tsx#L53-L61); `expanded` | Recent four ↔ all rows, with the action only when more than four exist. |
| Workout history expansion and record selection | [WorkoutHistorySection.tsx:18–21](../src/components/WorkoutHistorySection.tsx#L18-L21), [39–52](../src/components/WorkoutHistorySection.tsx#L39-L52), [69–71](../src/components/WorkoutHistorySection.tsx#L69-L71) | Recent three ↔ all records; independently no selected record ↔ detail modal. A selected record is displayed only for its matching preview client. Loading is the explicit history hook, not this modal state. |
| Performed-entry validation feedback | [ExerciseSetEntries.tsx:20–32](../src/components/ExerciseSetEntries.tsx#L20-L32), [47–54](../src/components/ExerciseSetEntries.tsx#L47-L54); field-keyed `errors` | Input updates valid/invalid feedback; invalid input is not forwarded to the domain update. Set toggle clears that row's feedback. Confirmation/completion belongs to H04. |
| Library search and selection | [coach/workouts/index.tsx:28–43](../src/app/coach/workouts/index.tsx#L28-L43), [74–75](../src/app/coach/workouts/index.tsx#L74-L75), [97–104](../src/app/coach/workouts/index.tsx#L97-L104) | Search changes filtered data, selection chooses a template/client set, and review snapshots it. Text/IDs themselves are values, not a separate async machine. Review is explicit; other operations are W16. |
| Exercise-catalog search | [WorkoutBuilderControls.tsx:90–117](../src/components/WorkoutBuilderControls.tsx#L90-L117) | Query determines catalog results/custom-name action. Open/close/add/alternative selection is owned by the explicit editor picker, not the search text input. |

The intro's underlying [DoorOpeningIntro.tsx:21–62](../src/components/DoorOpeningIntro.tsx#L21-L62) also implements a **temporal animation protocol**: initial delay → key insertion → key turn → handle motion → parallel key withdrawal/door swing/backdrop fade → final fade → completion callback. Cleanup stops the sequence; only a finished sequence calls completion. The continuous `Animated.Value`s are not discrete business-state tags, and `Animated.sequence` already expresses the timeline order.

## 4. Persistence protocols that are not separate UI machines

| Protocol | Source | State encoded outside a UI workflow |
| --- | --- | --- |
| Storage serialization and failure recovery | [workoutStorage.ts:14–21](../src/workouts/workoutStorage.ts#L14-L21) | A promise tail orders operations; a failed result rejects to its caller while the caught tail permits later operations. This is a queue protocol, not a missing `loading` UI state. |
| Library load deduplication and commit publication | [workoutLibraryRepository.ts:9–49](../src/workouts/workoutLibraryRepository.ts#L9-L49) | Public load state is explicit; private `loading: Promise \| null` tracks no load/in-flight load. A mutation computes next data, awaits persistence, then publishes ready data. There is no public mutation-in-progress status in this adapter. |
| Session finalization and stale-write rejection | [workoutSessionStore.ts:32–54](../src/workouts/workoutSessionStore.ts#L32-L54), [workoutSessionService.ts:35–59](../src/workouts/workoutSessionService.ts#L35-L59) | Active attempt → final archive/checkpoint commit is coordinated by attempt IDs, history membership and the queue. Re-finalization returns the stored attempt; late checkpoints for an archived ID are ignored. Outcome names/timer states are explicit, but the at-most-once persistence protocol is spread across service and adapter. |
| Read-time migration | [workoutLibraryRepository.ts:21–25](../src/workouts/workoutLibraryRepository.ts#L21-L25), [workoutSessionStore.ts:16–22](../src/workouts/workoutSessionStore.ts#L16-L22), [68–83](../src/workouts/workoutSessionStore.ts#L68-L83), [workoutMigrations.ts](../src/workouts/workoutMigrations.ts) | Read → validate/decode → optional migrated write → return/publish. Queue ordering provides concurrency behavior. The migration functions themselves are pure format transformations with an explicit `migrated` result, not independent interactive machines. |

## 5. Existing explicit machines and scaffolding — not wholly implicit

| Area | Source | Actual explicit states / qualification |
| --- | --- | --- |
| Workout timer | [workoutTimer.ts:1–28](../src/workouts/workoutTimer.ts#L1-L28) | `ready \| running \| paused \| ended`; `transitionWorkoutTimer` guards start/pause/resume/end, including a new attempt after ended. |
| Workout session controller | [workoutSessionReducer.ts:15–60](../src/workouts/workoutSessionReducer.ts#L15-L60) | `loading \| load-error \| ready \| transitioning`, event actions and guarded transitions. H02/H03 describe only coordination around it. |
| Checkpoint substate and revisions | [workoutSessionReducer.ts:4–12](../src/workouts/workoutSessionReducer.ts#L4-L12), [63–86](../src/workouts/workoutSessionReducer.ts#L63-L86) | `saved \| saving \| error`, revision acknowledgments, dirty state derived from revision ordering. It already has explicit transition logic. |
| Editor workflow and picker | [workoutEditorReducer.ts:4–29](../src/workouts/workoutEditorReducer.ts#L4-L29), [39–61](../src/workouts/workoutEditorReducer.ts#L39-L61) | Workflow: `editing \| confirming \| saving \| saved \| error`; picker: closed/add/alternative with target ID. H01 describes the remaining external coordination. |
| Template assignment review/save | [workoutAssignmentReducer.ts:3–24](../src/workouts/workoutAssignmentReducer.ts#L3-L24) | `idle \| review \| saving \| saved`; failure returns to review with an error. No separate error status is necessary to call this explicit. |
| Workout history loading | [useWorkoutHistory.ts:6–32](../src/hooks/useWorkoutHistory.ts#L6-L32) | `loading \| ready \| error`, load/retry actions and client-scoped results. Effect `active` adds request-lifetime coordination. |
| Workout-library public load status | [workoutRepositories.ts:24–27](../src/workouts/workoutRepositories.ts#L24-L27), [workoutLibraryRepository.ts:16–35](../src/workouts/workoutLibraryRepository.ts#L16-L35) | `loading \| ready \| error` discriminated union. Transition calls are inline rather than in a reducer, but the phases are explicitly represented. Private load/commit sequencing is listed above. |
| Coach-client directory and activity status | [clientStore.ts:14–22](../src/clients/clientStore.ts#L14-L22), [44–55](../src/clients/clientStore.ts#L44-L55), [mockClients.ts:6–16](../src/clients/mockClients.ts#L6-L16) | Named `loading \| ready \| error` load status, seeded from preview configuration; `reloadCoachClients` synchronously sets ready demo data. `active \| inactive` is an explicit client status updated through `setClientStatus`; missing means active. These are mock/local APIs, not an implemented network fetch lifecycle. |
| Message-list load scaffold | [client/messages.tsx:16–22](../src/app/client/messages.tsx#L16-L22), [114–124](../src/app/client/messages.tsx#L114-L124) | Named `loading \| ready \| error`, initialized ready. The only setter call is the error UI's retry-to-ready; no current code enters loading/error. Do not report an active message-fetch/retry workflow that does not exist. |

## 6. Exclusions and coverage checks

The scope was enumerated with `git ls-files K2F/src` (108 files). Searches covered both `.ts` and `.tsx`, including the read-state hook located under `messages` rather than `hooks`. State-bearing routes/components/hooks and store/persistence transition sites were then traced through their actual implementations.

Cross-checks against common false positives:

- `getGoalProgress` in [goals/goal.ts:49–82](../src/goals/goal.ts#L49-L82) explicitly derives `no-data | in-progress | achieved` from measurements. Likewise [workoutProgress.ts](../src/workouts/workoutProgress.ts), card labels, counts, search results, check-in grouping, and profile statistics are projections, not separately stored workflow machines.
- Static coach conversation previews/unread flags and `mockCoachTyping` are mock data. Only the client conversation's local draft/send and read-marker behavior currently transition.
- [workout/[workoutId].tsx:271–277](../src/app/client/home/workout/[workoutId].tsx#L271-L277) renders Add Exercise/Remove Exercise buttons without press handlers. There are no add/remove-exercise workflows to audit there. The actual editor's exercise picker and performed-set actions are covered above.
- [preferences.tsx](../src/app/coach/subscreens/preferences.tsx) and [settings.tsx](../src/app/coach/subscreens/settings.tsx) are placeholders. Nutrition opens a coming-soon alert. Password reset, upload, food-entry and other design-reference PDFs do not establish implemented workflows.
- Router/tab navigation is handled by Expo Router's external navigation state. App-specific role lookup, destination resolution and key-based reset boundaries are included above; plain links/back buttons are not each counted as a new implicit app machine.
- [app/_layout.tsx](../src/app/_layout.tsx) is a Stack declaration, not a global authentication-restoration or role-guard state machine. Login's role-based navigation and Progress's Auth subscription must not be mistaken for such a global guard.
- `useRef` for input focus, scroll position, geometry, or a latest callback is not itself a state machine. Operation locks, consumption markers, and lifetime refs are called out where they affect transitions.
- Profile serialization/validation, Firebase initialization, unique-ID counters, migration validators, search loops, and presentation-only components do not add standalone interactive machines.

## 7. Suggested follow-up order

This is prioritization of the audit findings, not a claim that each item is a reproduced defect or needs a new abstraction.

1. **Progress (W07–W10):** represent identity/resource readiness and form operation lifetimes clearly; inspect cancel/edit actions during saves and shared-error ownership.
2. **Auth/account operations (W01, W02, W06):** expose staged outcomes and recovery boundaries for role lookup, partial signup, and sign-out.
3. **Profile transactions (W03–W05):** distinguish load failure, draft, save, and local-only coach edit semantics, especially Cancel behavior.
4. **Read-marker persistence (W11):** make hydration/blur ordering and write-failure handling explicit.
5. **Workout operation hosts and navigation (W13, W15–W18, H01–H03):** review which coordination should live with the existing controllers and which small local state is sufficient.
6. **Keep small display modes simple:** expansion, selection, search input and modal visibility alone are not reasons to introduce another state library or service layer.

## Verification boundary

This audit documents source behavior at the pinned snapshot. It does not establish exhaustive runtime correctness, concurrency proofs, or device reproduction of all observations. The documentation change does not alter runtime code. Source links and line ranges should be rechecked if the application changes after `e260ec3`.

Checks performed for the audit change:

- All **108 source-link targets and referenced line ranges** in this document were validated.
- `npx tsc --noEmit` passed.
- Full-source ESLint retained the existing **33 errors and 2 warnings** in login, client Progress, coach check-ins, root index and DoorOpeningIntro. This documentation-only change introduces no source lint changes.
- No additional device/runtime tests were run for this source inventory.
