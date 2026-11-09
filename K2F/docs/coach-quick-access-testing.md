# Shared coach/client navigation verification

The client-only components are now shared as `AppTabBar` and `AppQuickAccessMenu`. Both role layouts use the same styles and `navigation` tokens from `src/theme.ts`. See [theme standards](theme-standards.md) for the required appearance and behavior.

The subsequent workout-builder update replaces Client List in the coach menu with Workout Library; Client List remains a main tab. See [workout-builder testing](workout-builder-testing.md) for that flow's verification.

## Verified on Android / Expo Go

- Coach bar and menu render at ~390 dp, 320 dp, 320 dp with 1.5× font scale, and 800 dp tablet width.
- The large-text menu scrolls through Account settings; X remains available. Icon-only tabs fit the narrow/large-text layout.
- Tapping the raised top of the plus circle opens the menu at every tested size.
- Home, Client List, Messages, Profile, Preferences, and Account settings menu items navigate and dismiss the modal.
- Direct presses on all four coach tabs navigate and update the selected tab state.
- Preferences and Account settings retain the selected Profile tab. They open the existing placeholder screens; this change does not implement those features.
- Check-ins opens the existing root-stack Recent Check-ins screen. Android Back restores the coach tab bar.
- X, Android Back, and the backdrop dismiss the coach menu.
- Missing authenticated coach/display-name data renders the “Coach” fallback and C avatar instead of client information.
- Client regression: all six client menu entries remain available without coach entries; Profile, Home, Workout, and workout Back navigation work.
- Emulator dimensions, density, and font scale restored to the original values after verification.

Menu-only coach routes are excluded by `AppTabBar`'s visible icon configuration rather than `href: null`: in the installed Expo Router SDK, `href: null` hides/redirects the destination itself. Keep those destinations registered and navigable.

## Checks

- Changed-file ESLint and `git diff --check` pass.
- Full-project Expo lint reports 33 existing errors and 2 existing warnings, in auth/login, client/progress, coach-checkins, root index, and DoorOpeningIntro; none are in the changed navigation files.
- Full-project TypeScript still reports the existing ScrollView ref errors at `src/app/client/messages.tsx:74` and `:78`.

## Not verified

- iOS/web rendering, keyboard focus, and screen-reader interaction.
- A populated Firebase coach display name (the missing-name/signed-out fallback was verified).
- Full behavior of existing destination features beyond opening the screens and returning through navigation.
