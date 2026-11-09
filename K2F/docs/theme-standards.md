# Theme standards

Use the shared blue/white palette, screen gradient, typography, spacing, radii, and touch-target tokens from `src/theme.ts`. App screens use `ThemedBackground`; reusable visual rules belong in the theme rather than role-specific copies.

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
| Client | Home, Progress, Messages, Profile | Home, Workout, Nutrition, Messages, Progress, Profile |
| Coach | Home, Client List, Messages, Profile | Home, Workout Library, Check-ins, Messages, Profile, Preferences, Account settings |

Nutrition retains its coming-soon message. Client Workout uses the existing dashboard mock assignment. Check-ins is an existing root-stack destination; Android Back returns to the coach screen. Coach identity uses Firebase's display name when available, otherwise “Coach”; it must not reuse the locally saved client profile.
