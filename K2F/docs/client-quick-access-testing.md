# Client quick-access navigation

Branch: `spencer/sprint-3/client-quick-access-menu`

## Behavior

- Rounded, white client tab bar; existing Home, Progress, Messages, and Profile symbol names and order are retained.
- Raised center plus button opens a modal menu with Home, Workout, Nutrition, Messages, Progress, and Profile. No logout action.
- Menu header reads the same locally saved profile name as client home. Initials provide an avatar fallback; no coach identity is assumed.
- Workout opens the existing mock assigned workout detail route, matching the client dashboard. This does not introduce an authenticated workout-assignment source.
- Nutrition displays a coming-soon alert because there is no nutrition destination yet.
- Close button, backdrop, and Android Back dismiss the menu without navigating.
- At narrow widths with large system text, tab labels are visually hidden to prevent mid-word wrapping. Icons keep full accessibility labels; the scrollable menu retains full-size text labels.

## Verified on Android

Used Expo Go on the connected Android emulator with the running Metro server.

- Normal phone layout (~411 dp): rounded bar and plus button render; menu opens.
- ~390 dp: menu fits the window with all six rows visible.
- 320 dp / 1.5× font scale: profile name wraps, menu scrolls to Profile, close remains visible, and icon-only tabs fit.
- 800 dp tablet: panel width is capped, tab bar and menu render correctly.
- Home, Messages, Profile, and Progress menu selections navigate and dismiss the modal.
- Workout opens Upper Body Strength; Android Back returns to the dashboard.
- Nutrition displays the coming-soon alert.
- Close, Android Back, and tapping outside the panel dismiss the menu.
- Scroll-through follow-up: replaced the opaque top spacer with transparent scene overlap and darkened the plus button. Checked the scrolled dashboard on the normal phone layout and verified tapping the raised top edge of the button opens the menu.
- Original emulator size, density, and 1.0 font scale restored afterward.

Progress shows its existing signed-out state when opened without an authenticated session.

## Checks

- Changed-file ESLint passes.
- `git diff --check` passes.
- Full-project TypeScript reports existing ScrollView ref errors in `src/app/client/messages.tsx`; no errors in the changed files.
- Full-project Expo lint reports existing errors in login, progress, coach check-ins, and DoorOpeningIntro, plus unused-import warnings.

## Follow-up manual checks

- iOS and web rendering and keyboard/screen-reader focus behavior were not tested.
- Empty stored profile names and profile-storage failures are handled with fallback names but were not injected into the emulator's saved data.
- Recheck navigation with an authenticated client and populated backend progress data.
