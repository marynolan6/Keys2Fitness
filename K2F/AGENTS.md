This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Theme & Design

- **Required for every new or modified screen/component:** use tokens from `src/theme.ts` (`@/theme`) for color, gradient, spacing, radii, typography, touch targets, and layout breakpoints. Do not hardcode colors or duplicate theme values in UI styles. Add genuinely reusable tokens to the shared theme; review impact on all consumers when changing existing tokens.
- Follow the visual hierarchy and blue/white palette in `design-references/`. Use `ThemedBackground` for gradient screens and the shared surface, primary, muted, and border tokens for their content; do not introduce an alternate palette or one-off gradient.
- **Bottom navigation standard:** client and coach layouts must share `AppTabBar` and `AppQuickAccessMenu`, using `navigation` tokens in `src/theme.ts`. Keep the same white rounded surface, subtle border, active icon pill, spacing, safe-area handling, and raised dark-blue center plus button across roles; only destinations, labels, identity, and icon symbols differ. The raised area must overlap scrolling content transparently (no solid spacer above the bar), and the full circle must remain tappable. Keep four visible tabs with the plus between the second and third; hide extra routes from the bar and expose them through the role-appropriate menu. Preserve the shared compact/large-text behavior and omit logout from the quick-access menu.
- Display user-facing measurements in imperial units (feet/inches for height and pounds for weight) unless a story explicitly requires another unit system. Keep conversion at the presentation boundary when backend data uses metric units.
- Responsive behavior is required: use `useWindowDimensions()` and `isCompactLayout(width, fontScale)` from the theme when deciding between columns and stacked controls. Cards must fit within the window; avoid fixed widths/heights and text nesting inside `Text` for layout. Allow text to wrap, use scrolling for long content, and ensure controls remain usable at 320 dp width and 1.5× font scale, as well as normal phone and tablet sizes.
- Interactive elements must have accessible roles/labels, visible pressed states, and touch areas at least `layout.minTouchTarget` (48 dp) in both dimensions. Ensure text has readable contrast on the actual background at every gradient stop.
- Before calling a UI story Done: run lint and typecheck; verify the screen on an Android emulator at 320 dp, ~390 dp, and tablet width plus 1.5× font scale; test empty/optional data and navigation/back; document what was actually tested. Mock data does not prove a client-specific assignment: a story requiring the *client's assigned workout* needs an authenticated assignment source or an explicitly agreed prototype-only scope.

## Workout Architecture

- **Required for new or substantially modified workout features:** keep business rules in pure domain functions and application services, and route files focused on presentation and navigation. Extend the existing architecture as the feature is touched; keep unrelated legacy refactors out of the change.
- Use controller hooks and explicit reducer states for workflows involving restoration, validation, saving, retries or coordinated transitions. Follow `useWorkoutSession` / `useWorkoutEditor`; preserve drafts and recorded progress when operations fail, and guard duplicate submissions and stale async results.
- Keep simple presentation state, such as menu visibility or the selected modal, in `useState` when sufficient. Small components do not require their own controller, service or reducer. Introduce an abstraction to separate a concrete responsibility or enable meaningful reuse/testing; avoid adding layers, classes or state libraries solely to match a pattern.
- Services depend on the domain ports in `src/workouts/workoutRepositories.ts`. Domain functions, reducers, services and repository contracts must remain independent of React, React Native, Expo Router, Firebase and AsyncStorage. Keep navigation in the presentation layer and storage primitives in adapters.
- Wire concrete storage, author identity, business clocks/IDs and client-directory implementations in the composition roots. Screens and controller hooks invoke application use cases through these boundaries; business operations must not acquire their own concrete dependencies.
- Handle persisted format changes through explicit validation/migrations in `workoutMigrations.ts`. Preserve existing keys, assignment snapshots and recorded performance; unsupported/corrupt data must not be silently replaced. Keep read-time migrations and writes ordered.
- For workflow changes, run `npm run test:workouts` and add meaningful reducer/application integration coverage, including applicable failure/retry and persistence compatibility cases. Run lint and TypeScript checks, and report what actually passed and any existing failures.
- These Markdown rules guide agent work and code review. TypeScript contracts and tests provide executable checks; dedicated import-boundary lint rules and CI enforcement are follow-up work. Do not claim those automated gates exist until they are configured and verified. See `docs/workout-architecture.md` for examples, scope and the Android smoke driver.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
