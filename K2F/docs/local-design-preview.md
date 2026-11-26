# Local design review: demo 1.0.5

[Nine screens in the candidate](images/mobile-ui-preview-1.0.5.png) · [Same screens in 1.0.4](images/mobile-ui-review-1.0.4.png) · [Design audit](mobile-ui-design-review.md)

The signed Pixel APK and a six-screen before/after comparison are in Windows Downloads: `Keys2Fitness-Demo-1.0.5.apk` and `Keys2Fitness-Design-Review-1.0.5.png`. Install the APK as an **Update** over the earlier demo. The comparison uses the same phone viewport and existing sample data. Times and activity counts can change between captures.

## Review in this order

1. **Coach Home.** Identify the oldest form check, open it, and return to the queue. The pending count and next client come from the same review store. The four overview actions remain available. On a tablet the latest check-in and library link sit in a second column.
2. **Client Home and active workout.** Find Nutrition by name, then return to the workout. Compare the emphasis of **Log sets**, Pause, and exercise details. The pinned bar still counts completed exercises; the exercise itself reports confirmed sets. The familiar editor accepts prescribed hints on check and keeps a custom value or zero. Review and history still show one row per recorded set.
3. **Nutrition.** Change the day, tap a meal's Add button, and try to save an incomplete entry. Correct the indicated field with the keyboard open. Tap the food row to edit or move it. Try deleting, choose **Keep food**, then confirm deletion. The compact daily summary and four meal groups remain.
4. **Library and progress.** Compare templates before expanding **Assign or manage**. Confirm the template/client pairing or cancel it. In Progress, open **Show readings**, then switch the date range. Each dated weight can be read individually without turning the chart's accessible description into a long list.
5. **Login and messages.** Login is ready immediately. The welcome animation is an optional replay, can be skipped, and is hidden with reduced motion enabled. Compare outgoing message text, unread badges, and Send against the old light blue. The app uses a light theme with dark status icons even if the OS uses its dark appearance.

## Verification

- `npm test`: 189 passing, including food-field validation and regression checks on resting/pressed action color pairs. `npm run test:workouts`: 116 passing. The five Python fixture-cleanup tests, TypeScript, lint, diff check, and branding on all 28 exported content screens passed.
- Android at 320 dp with 1.5× text, 390 dp, and 800 dp: checked dashboard navigation, menu dismissal, template actions, factual roster status, and chart readings. At 390 dp, sending feedback advanced the oldest-video action and changed the queue count. At 320 dp, validated, saved with keyboard open, moved, retained, then deleted a food entry and checked the day totals.
- The Android workout walkthrough removed and re-added all sets, saved custom and prescribed values, canceled and confirmed completion, reopened history, and ended a second attempt early. Library assignment and local message sending were also exercised. Test fixtures, message read markers, and emulator settings were restored.
- The team workflow used native Ponytail, Subtract Before You Add, the two-pass Thermo-Nuclear Review, and Unslop. The shared action component replaces separate button implementations; the workout domain and stored record formats did not change. Native review caught two keyboard layout issues: the modal footer needed to resize, while the chat screen needed to let Android resize its tab scene once.

This is a local Android candidate. No physical Pixel, iOS device, spoken screen-reader session, or study with coaches and clients was used for this review.
