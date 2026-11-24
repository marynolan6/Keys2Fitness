<p align="center">
  <img src="K2F/assets/images/K2F-Logo.png" alt="Keys2Fitness logo" width="300" />
</p>

<h1 align="center">Keys2Fitness</h1>
<p align="center">Team 404 · Senior Project</p>

Keys2Fitness is a React Native app for a personal fitness coaching business. Coaches prescribe workouts and nutrition targets. Clients record sets, meals, and weight measurements. Expo targets Android and iOS and provides a web preview.

## Contents

- [About the project](#about-the-project)
- [Team](#team)
- [Features and implementation status](#features-and-implementation-status)
- [App screenshots](#app-screenshots)
- [Technology and architecture](#technology-and-architecture)
- [Entity relationship diagram](#entity-relationship-diagram)
- [Getting started](#getting-started)
- [Testing and quality](#testing-and-quality)
- [Next-semester roadmap](#next-semester-roadmap)
- [Services and costs](#services-and-costs)
- [Project documentation](#project-documentation)

## About the project

A coach can save a reusable plan, select clients, and confirm an assignment. Each client receives a copy that survives edits to the template. Clients can pause a workout, resume it, and review the reps and weight they recorded.

To try both roles on one device, assign a workout from the coach's library and open the demo client preview. Cross-device assignment is on the [roadmap](#next-semester-roadmap).

## Team

| Team member | Role |
| --- | --- |
| Spencer Le Bleu | Team lead / developer |
| Mary Nolan | Developer |
| Simrandeep Kaur | Developer |
| Jaden Saechao | Developer |
| Jubreen Dhillon | Developer |
| Anthony Thompson | Developer |

**Client:** Keys2Fitness personal fitness coaching business

**Course instructor:** Kenneth Elliott

## Features and implementation status

The project is a working UI prototype with selected Firebase-backed features. **Local/demo data and Firebase-backed data are currently separate sources.** Selecting a demo workout client does not switch the signed-in Firebase account.

| Area | Current implementation |
| --- | --- |
| Accounts and login | Firebase email/password signup and login; a Firestore user role determines the destination dashboard. Persistent native login sessions and centralized authorization still need integration work. |
| Coach dashboard and client list | Client summaries, activity, profiles, and navigation using clearly labeled demo data. |
| Workout library | Search reusable templates and assigned workouts by name or exercise. Open an item for its prescription and notes, edit a template, or change a recommendation on a client's copy. |
| Exercise prescriptions | Sets, repetitions, optional weight in pounds, optional rest duration, instructions, alternatives, and validation. |
| Workout assignment | Review the workout and named recipients, confirm or cancel, and see saved assignment status. Independent copies are available to the selected demo clients on the same device. |
| Client-specific recommendations | Edit an existing assigned exercise's recommendation independently of reusable instructions and prescriptions, scoped to the client, workout, and exercise. |
| Workout tracking | Log reps and pounds per set, review the entries before finishing, and see those same values in history. A pinned indicator shows completed/remaining exercises and restored progress; 100% is reserved for all exercises complete. |
| Workout history | Open Progress or choose Workout history from the + menu to review completed workouts, recorded sets, and active time saved on this device. |
| Profiles and preferences | Client profile/preferences persist locally. Coach profile editing is currently a local UI prototype. |
| Goals and weight measurements | Authenticated Firestore reads/writes for the current weight goal and weight entries, including entry editing/deletion. Dashboard goal summaries also include mock data. |
| Weight progress chart | Client Progress plots sample check-in weights in pounds over 30 days, 90 days, or all time. [Chart preview](K2F/docs/images/weight-progress-chart.png) |
| Messaging | Conversation UI, search, local message composition, and on-device read markers. End-to-end coach/client message delivery is not yet connected. |
| Check-ins | Demo check-in/history views and coach navigation. |
| Nutrition | Client-scoped demo calorie/macro targets, coach tips, dated food logging and intake comparison. Coach edits update the shared in-memory client plan without rewriting logged food. |
| Media and notifications | Sample exercise-video and form-check views; production media workflows and notifications remain integration work. |

## App screenshots

The team captured these screens in Expo Go on Android with demo data. Select an image to enlarge it.

<table>
  <tr>
    <th>Coach dashboard</th>
    <th>Workout library</th>
    <th>Exercise prescription editor</th>
  </tr>
  <tr>
    <td><a href="K2F/docs/images/coach-dashboard.png"><img src="K2F/docs/images/coach-dashboard.png" alt="Coach dashboard with active clients and recent demo activity" width="240" /></a></td>
    <td><a href="K2F/docs/images/workout-library.png"><img src="K2F/docs/images/workout-library.png" alt="Workout template library filtered to strength plans, with create, duplicate, edit, and delete controls" width="240" /></a></td>
    <td><a href="K2F/docs/images/prescription-editor.png"><img src="K2F/docs/images/prescription-editor.png" alt="Bench Press prescription editor showing sets, reps, pounds, rest seconds, and instructions" width="240" /></a></td>
  </tr>
  <tr>
    <th>Client workout</th>
    <th>Exercise details</th>
    <th>Client messaging prototype</th>
  </tr>
  <tr>
    <td><a href="K2F/docs/images/client-workout.png"><img src="K2F/docs/images/client-workout.png" alt="Client workout with progress, a recorded ended session, and exercise completion controls" width="240" /></a></td>
    <td><a href="K2F/docs/images/exercise-details.png"><img src="K2F/docs/images/exercise-details.png" alt="Bench Press details with prescription, reusable instructions, and a client-specific coach recommendation" width="240" /></a></td>
    <td><a href="K2F/docs/images/client-messages.png"><img src="K2F/docs/images/client-messages.png" alt="Client conversation prototype with sample coach messages and a message composer" width="240" /></a></td>
  </tr>
</table>

See the [screenshot notes](K2F/docs/images/README.md) for capture context. Original UI mockups are available in [design references](K2F/design-references).

## Technology and architecture

| Technology | Purpose |
| --- | --- |
| React Native + Expo SDK 58 | Shared mobile application and development tooling |
| React 19 + TypeScript | Component UI and typed application/domain models |
| Expo Router | File-based navigation for coach and client flows |
| Firebase Authentication | Email/password account creation and sign-in |
| Cloud Firestore | Current user documents, weight goals, and weight measurements; additional backend integration is planned |
| AsyncStorage | Local workout library, assignments, session checkpoints/history, profile preferences, and read markers |
| Git + GitHub | Feature branches, pull requests, and team code review |
| Figma + Jira | UI design, user stories, subtasks, and sprint planning |

### Application structure

```text
Screens and reusable components
             ↓
Controller hooks and explicit workflow reducers
             ↓
Application services and pure domain functions
             ↓
Repository interfaces
             ↓
Local storage adapters / Firebase integrations
```

The workout subsystem separates prescription data from performed sets, preserves assigned workout snapshots, and serializes local storage operations. Its repository boundaries provide a place to introduce remote persistence while retaining the tested domain behavior. Some earlier screens still call Firebase directly; the layered structure is not yet uniform across the whole app.

```text
Keys2Fitness/
├── README.md                 Project overview and roadmap
└── K2F/                      Expo application — run npm commands here
    ├── assets/images/        Logo and application image assets
    ├── design-references/    Original screen mockups
    ├── docs/                 Architecture, setup, and verification notes
    ├── src/
    │   ├── app/              Expo Router screens and layouts
    │   ├── components/       Reusable UI
    │   ├── hooks/            Workflow controllers
    │   ├── workouts/         Workout domain, services, reducers, and storage
    │   ├── clients/          Demo client directory and state
    │   ├── messages/         Conversation UI, search, and read state
    │   ├── goals/            Goal calculations and sample data
    │   ├── profile/          Profile validation and local persistence
    │   ├── checkins/         Check-in models and sample data
    │   └── lib/              Firebase initialization and local storage queue
    └── tests/                Logic/integration tests and Android smoke drivers
```

More detail: [Workout architecture](K2F/docs/workout-architecture.md) · [State-machine audit](K2F/docs/implicit-state-machines.md)

## Entity relationship diagram

**Conceptual ERD — draft for backend integration and team review.** This diagram describes the core coaching/workout relationships using the current domain models. It is not a claim that every entity below is already a Firestore collection. In the local prototype, exercise and performed-set records are nested in workout/session JSON; workout clients use demo IDs rather than authenticated user IDs.

```mermaid
erDiagram
    USER ||--o{ WORKOUT_ASSIGNMENT : receives
    USER ||--o| CURRENT_GOAL : tracks
    USER ||--o{ WEIGHT_ENTRY : records
    WORKOUT_TEMPLATE ||--|{ TEMPLATE_EXERCISE : contains
    WORKOUT_TEMPLATE ||--o{ WORKOUT_ASSIGNMENT : copied_into
    WORKOUT_ASSIGNMENT ||--|{ ASSIGNED_EXERCISE : snapshots
    WORKOUT_ASSIGNMENT ||--o{ WORKOUT_SESSION : attempted_as
    WORKOUT_SESSION ||--|{ SESSION_EXERCISE : records
    SESSION_EXERCISE ||--o{ PERFORMED_SET : contains

    USER {
        string uid PK
        string email
        string role
    }
    WORKOUT_TEMPLATE {
        string id PK
        string title
        string updatedAt
    }
    TEMPLATE_EXERCISE {
        string id
        string name
        int sets
        int reps
        number weightLb
        int restSeconds
        string instructions
    }
    WORKOUT_ASSIGNMENT {
        string id PK
        string clientId FK
        string templateId FK
        string assignedAt
    }
    ASSIGNED_EXERCISE {
        string id
        string instructions
        string recommendation
    }
    WORKOUT_SESSION {
        string sessionId PK
        string workoutId FK
        string outcome
        number startedAt
        number finishedAt
    }
    SESSION_EXERCISE {
        string id
        boolean completed
    }
    PERFORMED_SET {
        string id
        string actualReps
        string actualWeightLb
        boolean completed
    }
    CURRENT_GOAL {
        string title
        number startWeightLb
        number targetWeightLb
        string startDate
    }
    WEIGHT_ENTRY {
        string id PK
        string date
        number weightLb
    }
```

`USER → WORKOUT_ASSIGNMENT` is a target integration relationship: the demo-client directory still needs to be linked to authenticated accounts. Template deletion preserves existing assigned snapshots, so `templateId` is a provenance reference rather than an enforced SQL foreign key. Nested exercise/set IDs are scoped by their parent template, assignment, or session; they are not necessarily globally unique database keys. Optional fields and draft/unstarted states are simplified in this conceptual view.

The current Firestore paths used in code are:

```text
users/{uid}
users/{uid}/goals/current
users/{uid}/weightEntries/{entryId}
```

Coach/client linking, conversations, notifications, nutrition, and media storage require further backend modeling. Replace or extend this draft with the team's approved ERD as those designs are finalized.

## Getting started

### Prerequisites

- Use Node.js 24.12 or newer on the Node 24 LTS line. The tests and Expo export also run on Node 22.23.2, but several locked Firebase packages require Node 24.12 or newer.
- npm and Git.
- An Android emulator or a phone with an Expo Go version compatible with SDK 58. An iOS simulator requires macOS and Xcode.
- Access to an authorized Firebase project for account and Firestore-backed features.

### Install and run

```bash
git clone https://github.com/marynolan6/Keys2Fitness.git
cd Keys2Fitness/K2F
npm ci
npm start
```

Scan the QR code with Expo Go, or use the development-server shortcuts for an available emulator/simulator.

```bash
npm run android   # Start Expo for Android
npm run ios       # Start Expo for iOS
npm run web       # Start the web preview
```

For emulator and WSL networking instructions, see [Android development setup](K2F/docs/android-setup.md).

### Firebase and demo data

Firebase initialization currently lives in [`K2F/src/lib/firebase.ts`](K2F/src/lib/firebase.ts). To use your own authorized project, configure its web-app connection values there, enable Email/Password authentication, and enable Cloud Firestore. The current code does not read Firebase settings from an `.env` file.

- New signups create a `users/{uid}` document with the `client` role.
- A coach test account needs a corresponding user document with `role: "coach"`, provisioned by the team/project administrator. There is no in-app role-changing feature.
- Live signup, login, goals, and measurements depend on the Firebase project's configuration and access rules.
- Workout templates and demo-client assignments are stored on the device. They do not automatically synchronize to another phone or Firebase user.
- This repository does not currently include deployed Firestore security-rule or backend-function configuration. Production authorization is part of the integration roadmap.

## Testing and quality

Run these commands from `K2F/`:

```bash
npm test
python3 -B tests/workout-sandbox-test.py
npx tsc --noEmit
npm run lint
npm run check:branding
```

`npm test` runs every Node test in `K2F/tests`. For a workout-only run, use `npm run test:workouts`. The Python command checks fixture cleanup without a device. The [Android smoke drivers](K2F/docs/smoke-test-cleanup.md) exercise the UI and restore workout data after each run. See the [repository audit](K2F/docs/codebase-audit.md) for the checks run on this branch.

## Next-semester roadmap

These are proposed CSC 191 milestones. The team and client still need to confirm scope and sprint numbers against the Jira backlog.

| Sprint | Proposed focus | Expected outcome |
| --- | --- | --- |
| **5** | Authenticated coach/client linking, role enforcement, native session persistence, and Firestore access rules | Real account identities replace preview-only client selection in the integrated workflow; access checks are tested. |
| **6** | Remote workout templates, assignments, performed-set checkpoints, and completion history | A coach assigns a plan and the intended client accesses it on another device, preserving snapshot and completion semantics. |
| **7** | Private messaging, read state, and push notifications | Coach/client conversations use shared backend data; notification permissions and delivery are tested. |
| **8** | Nutrition workflow and agreed media/check-in integrations | Replace prioritized placeholders with working client/coach flows and finalize the related storage model. |
| **9** | iOS stability, cross-platform regression, performance, release preparation, and handoff | A verified release candidate, updated documentation, deployment instructions, and a client demonstration. |

## Services and costs

The current app uses Firebase Authentication and Cloud Firestore through the Firebase client SDK; it does not require a separately hosted custom API server for its existing local workout flows. Cloud messaging, media storage, and any backend functions are planned integrations rather than completed services.

| Cost area | Planning basis |
| --- | --- |
| Development and builds | Expo provides local development tooling and optional hosted EAS services. Build quotas and paid-plan needs depend on the selected plan. |
| Authentication and database | Firebase charges/quotas depend on the product, plan, operations, storage, and traffic. Estimate actual users and usage before setting a production budget. |
| Media and backend processing | Revisit storage, transfer, and compute costs when video/photo and backend-function requirements are finalized. |
| App distribution | Apple and Google developer enrollment fees are separate from backend and build costs. |

**Budget status:** a workload-based production estimate still needs team/client review. Development within a free allowance is not a guaranteed zero-cost production deployment.

Official references: [Expo pricing](https://expo.dev/pricing) · [Firebase pricing](https://firebase.google.com/pricing) · [Apple Developer enrollment](https://developer.apple.com/programs/enroll/) · [Google Play registration](https://support.google.com/googleplay/android-developer/answer/6112435)

## Project documentation

### Ponytail coding and review

Start OpenCode from the repository root (restart existing sessions). The project config loads the official Ponytail **5.3.3** plugin and the app’s engineering instructions. Use `/ponytail-help` to see commands, `/ponytail-review` before a PR, or `/ponytail-audit` for a repository-wide review. Verify findings against the code and run the checks required by [the project instructions](K2F/AGENTS.md).

For Cline, open `K2F/` in VS Code and enable `02-ponytail.md` as described in [Cline setup](K2F/docs/cline-setup.md). Cline uses the rules-only integration; the slash commands above are for OpenCode. When upgrading, update both the plugin pin in `opencode.json` and the [upstream Cline rule](https://github.com/DietrichGebert/ponytail/blob/7801d061243d7b753bad0e0b3c057cd250b11755/.clinerules/ponytail.md) together ([MIT license](K2F/docs/third-party/ponytail-LICENSE.txt)).

### Reference guides

For **every code change**, follow the [shared workflow](K2F/AGENTS.md#required-workflow-for-every-code-change). Use Ponytail and pstack’s [Subtract Before You Add](https://github.com/cursor/plugins/blob/7a583913eb1b8d1a0ee76753d1a2cf072e7b54f9/pstack/skills/principle-subtract-before-you-add/SKILL.md) during implementation. Run two passes of [Thermo-Nuclear Code Quality Review](https://github.com/cursor/plugins/blob/7a583913eb1b8d1a0ee76753d1a2cf072e7b54f9/cursor-team-kit/skills/thermo-nuclear-code-quality-review/SKILL.md) on the code, then use pstack’s [Unslop](https://github.com/cursor/plugins/blob/7a583913eb1b8d1a0ee76753d1a2cf072e7b54f9/pstack/skills/unslop/SKILL.md) on the writing. All rubrics are available inside `K2F/`. If your agent does not discover repository instructions, set `K2F/AGENTS.md` as its always-on project instruction file before starting a coding session.

- [Workout architecture and persistence](K2F/docs/workout-architecture.md)
- [Workout builder verification](K2F/docs/workout-builder-testing.md)
- [Assignment flow verification](K2F/docs/workout-assignment-testing.md)
- [Prescription and recommendation verification](K2F/docs/workout-prescription-testing.md)
- [Workout completion/history verification](K2F/docs/workout-completion-testing.md)
- [Per-set performance and review verification](K2F/docs/set-performance-testing.md)
- [Completed-workout browsing and state-machine verification](K2F/docs/workout-history-testing.md)
- [Weight progress chart verification](K2F/docs/weight-progress-chart.md)
- [Assigned nutrition and workout progress verification](K2F/docs/nutrition-and-workout-progress.md)
- [Automatic smoke-test cleanup and recovery](K2F/docs/smoke-test-cleanup.md)
- [Application state-machine audit](K2F/docs/implicit-state-machines.md)
- [Theme and UI standards](K2F/docs/theme-standards.md)
- [Required screen branding and review checks](K2F/docs/theme-standards.md#required-screen-branding)
- [Android environment setup](K2F/docs/android-setup.md)
- [Original UI design references](K2F/design-references)
- [Contributor/agent development instructions](K2F/AGENTS.md)
