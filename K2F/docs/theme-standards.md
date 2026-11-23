# Theme standards

Use the shared blue/white palette, screen gradient, typography, spacing, radii, and touch-target tokens from `src/theme.ts`. App screens use `ThemedBackground`; reusable visual rules belong in the theme rather than role-specific copies.

## Required screen branding

Every new or modified client and coach tab, section, and detail screen must show one [`K2FBrand`](../src/components/K2FBrand.tsx) at the top of its content, before the page title or greeting. This applies to loading, empty, error, and unavailable-item views as well as populated screens. Use [`BrandedPage`](../src/components/BrandedPage.tsx) for a simple page; it supplies the brand, heading, scroll area, and safe spacing. A screen with a custom scroll container places `K2FBrand` itself.

- **Welcome and account creation:** `variant="welcome"` centers the larger mark above the serif name, with a white form card on the shared gradient. This follows the welcome-screen design reference.
- **Section header:** use the bundled `assets/images/K2F-Logo.png` beside `KEYS2FITNESS`. Pass `coach` for coach routes, including client detail views opened by a coach. The shared header uses a 40 dp mark and an 18 sp base wordmark. Allow system font scaling and wrapping. Do not shrink, crop, or create a separate logo for a tab.
- **Placement and accessibility:** keep the logo clear of the status bar and notches. A native navigation bar may sit above it. The logo and name form one accessible image called `Keys2Fitness` or `Keys2Fitness, coach`. Use the shared `PageTitle` for the main heading or greeting. It supplies heading semantics and wraps long titles. Section headings inside cards remain ordinary headings.
- **Messaging exception:** the Messages tabs and individual conversations show the list title or participant name instead of a brand row. Redirects have no screen content, and task dialogs do not repeat their parent screen's header. Keep the brand out of the bottom tab bar.
- **Dashboards:** use `DashboardGreeting` with the device's local clock: morning before noon, afternoon until 6 pm, evening until midnight. Use the signed-in coach's first name or `Coach`. The client keeps its selected demo/profile name. Coach overview tiles share the tallest tile's natural height and the same column width. Stack them on compact or large-text layouts without truncating counts or actions.
- **Coach tile icons:** use ▶ for Videos to Review, 💬 for Recent Messages, 👥 for Active Clients, and 📊 for Client Activity. Center each icon in a 48 dp circle. Show the count once in the summary below the title. Labels and counts follow the device's text size.
- Change sizing in [`src/theme.ts`](../src/theme.ts), not in individual screens.

### Check on every code change

Run `npm run check:branding` from `K2F/` before handoff. The **Screen branding** GitHub Actions workflow runs the same check on pushes and pull requests. It exports the web screens, discovers the routes, and checks for one shared logo and wordmark, the right role/variant, and one accessible `PageTitle` after the brand. It rejects a section mark smaller than 40 dp or a base wordmark smaller than 18 sp. Messaging is checked for a heading and no brand row. New rendered routes participate without adding a snapshot.

For UI changes, also inspect the affected screens on Android at 320 dp with 1.5× text, about 390 dp, and tablet width. Check safe areas, title wrapping, empty/loading/error states, and navigation back. On coach Home, compare all four cards, open each action, and check the check-in preview. Record what you ran. The export checks initial markup; it cannot detect a clipped native label or a missing brand in a later state.

Android previews: [Coach dashboard](images/coach-dashboard.png) · [Client dashboard](images/client-home.png) · [Welcome](images/branded-login.png).

**Sprint 4 verification:** the export check passed on 26 content screens. Android measured all four coach tiles at 164 × 153 dp on a 390 dp phone, 272 × 183 dp on a 320 dp phone with 1.5× text, and 265 × 135 dp at 800 dp tablet width. The four tile actions, check-in link, workout library link, unavailable workout/client views, back navigation, and messaging exceptions were checked in Expo Go. The greeting test covers local midnight, noon, and 6 pm.

## Bottom navigation

Client and coach navigation must have the same visual treatment. Both layouts render `AppTabBar` with a `role` prop and share `AppQuickAccessMenu`. Role-specific destinations and identity do not change the bar's styling.

- White surface, rounded top corners, subtle border, and muted active-icon pill.
- Four visible tabs, retaining the existing role-specific icon symbols and order.
- Raised circular dark-blue plus button centered between tabs two and three, with a white plus and shared shadow/pressed treatment.
- Use the `navigation` theme tokens for corner radius, overlap, center spacing, button size/radius, color, elevation, and shadow opacity. Continue using the common color, typography, spacing, and touch-target tokens for other details.
- The area above the white surface is transparent and overlaps the scrolling screen. Do not recreate an opaque strip to disguise the button's protrusion. The button is a sibling of the bar so its whole raised circle is tappable.
- Respect bottom and horizontal safe-area insets, maintain at least 48 dp touch targets, and keep the center button usable at all supported widths/font scales.
- At narrow widths with large text, hide the visual tab labels while preserving full accessibility labels. The scrollable quick-access menu always provides full-size text labels.
- Show extra destinations only in the menu, not as additional bottom tabs. Preferences and Account settings remain associated with the coach Profile tab.
- Menus share the rounded white panel, identity/avatar row, current-route highlight, blue icons, and chevrons. X, backdrop, and Android Back dismiss the menu. Do not include logout.

### Role destinations

| Role | Visible tabs | Quick-access items |
| --- | --- | --- |
| Client | Home, Progress, Messages, Profile | Home, Workout, Workout history, Nutrition, Messages, Progress, Profile |
| Coach | Home, Client List, Messages, Profile | Home, Workout Library, Check-ins, Messages, Profile, Preferences, Account settings |

Nutrition opens the daily nutrition screen. Client Workout opens the active or assigned workout for the preview client. Check-ins is an existing root-stack destination; Android Back returns to the coach screen. Coach identity uses Firebase's display name when available, otherwise “Coach”; it must not reuse the locally saved client profile.
