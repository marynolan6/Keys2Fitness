# Keys2Fitness Theme Usage Guide

This guide explains how to use the shared visual theme in the Keys2Fitness Expo application.

## Source Of Truth

The shared theme lives in:

```text
K2F/src/theme.ts
```

This file is the source of truth for reusable visual values such as:

- Colors
- Spacing
- Border radii
- Typography sizes
- Success and error colors

Do not create slightly different copies of these values inside individual screens unless a design reference requires a deliberate exception.

## Importing Theme Values

Use the project alias when importing the theme:

```tsx
import { colors, radii, spacing, typography } from "@/theme";
```

The alias is configured in `K2F/tsconfig.json`.

## Using Colors

Use named colors instead of hard-coded hex values:

```tsx
const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
  },
});
```

Current design colors include:

```text
colors.background     Main blue workout background
colors.surface        White cards and panels
colors.surfaceMuted   Light blue secondary controls
colors.primary        Blue accent for data and icons
colors.primaryDark    Dark blue labels and action text
colors.text           Main dark text
colors.textMuted      Supporting text and subtitles
colors.border         Dividers and card edges
colors.controlBorder  Input and checkbox boundaries
colors.progressTrack  Empty portion of progress bars
colors.achieved       Confirmed or achieved state
colors.danger         Destructive or error state
```

## Using Spacing

Use the shared spacing scale for padding, margins, and gaps:

```tsx
const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  buttonText: {
    paddingHorizontal: spacing.md,
  },
});
```

Available values:

```text
spacing.xs   4
spacing.sm   8
spacing.md   16
spacing.lg   24
spacing.xl   32
```

## Using Border Radii

Use the named radius values so controls and cards have a consistent shape:

```tsx
const styles = StyleSheet.create({
  checkbox: {
    borderRadius: radii.control,
  },
  button: {
    borderRadius: radii.button,
  },
  card: {
    borderRadius: radii.card,
  },
});
```

## Using Typography

Use the shared sizes for common text roles:

```tsx
const styles = StyleSheet.create({
  title: {
    fontSize: typography.title,
  },
  heading: {
    fontSize: typography.heading,
  },
  label: {
    fontSize: typography.label,
  },
  body: {
    fontSize: typography.body,
  },
});
```

For new UI, use `textStyles.page`, `section`, `metric`, `body`, `label`, `meta`, and `eyebrow` from `@/theme`. They include size, weight, line height, and foreground. Use the metric style for values people compare.

## Button Conventions

Use `ActionButton` for actions. Its tested foreground/background pairs live in `actionColors` in `src/theme.ts`. `BuilderButton` is the same component exported under its existing name for workout screens.

```text
Primary action       actionColors.primary
Secondary action     actionColors.secondary
Destructive action   actionColors.danger
Disabled action      actionColors.disabled
```

Example:

```tsx
<ActionButton label="Log sets" onPress={openSetEditor} />
<ActionButton label="Exercise details" secondary onPress={openDetails} />
```

## What Belongs In The Theme

Add a value to `src/theme.ts` when it is reused across multiple screens or represents a product-wide design decision. Good candidates include:

- Brand colors
- Standard surface and text colors
- Common spacing values
- Card, button, and control radii
- Standard text sizes
- Shared status colors

Do not add values only used once unless they are clearly part of the design system. Screen-specific layout values can remain in that screen's `StyleSheet`.

## Updating The Theme

When a Figma or PDF reference establishes a new global color or spacing rule:

1. Update `K2F/src/theme.ts`.
2. Replace hard-coded copies in affected screens.
3. Check client and coach screens for visual consistency.
4. Run lint and typecheck.
5. Describe the theme change in the pull request.

Avoid renaming existing theme values casually. A shared name such as `colors.primary` should have one consistent meaning across the app.

## Verification

Run these commands from the `K2F` directory:

```bash
npx expo lint
npx tsc --noEmit
```

Then check at least one client screen and one coach screen at a mobile width. Confirm that primary, secondary, card, text, and error states remain visually consistent.

## Commit And Pull Request Guidance

The theme source file belongs in the Keys2Fitness repository and should be included in the commit or pull request that introduces it:

```text
K2F/src/theme.ts
```

The external guide belongs in:

```text
DorkWitAFork/guides/Keys2Fitness_Theme_Usage_Guide.md
```

Because that guide is outside the Keys2Fitness Git repository, it will not be included in the application commit or pull request unless the guides directory has its own repository or review process.

Recommended application commit scope:

```bash
git add K2F/src/theme.ts
git commit -m "Add shared design theme"
```

If the same pull request also updates screens to use the theme, include those screen files in the same feature branch and explain the migration in the PR description.
