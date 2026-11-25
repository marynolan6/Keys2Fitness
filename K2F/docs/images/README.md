# README screenshots

These PNGs show the running Android app with demo data. Most were captured in Expo Go.

| File | View |
| --- | --- |
| `coach-dashboard.png` | Coach greeting, four equal-size overview tiles, and the latest demo check-in |
| `workout-library.png` | Workout library filtered to strength plans |
| `prescription-editor.png` | Coach exercise-prescription editor |
| `client-workout.png` | Client workout and completion controls |
| `exercise-details.png` | Exercise instructions and client-specific coach recommendation |
| `client-messages.png` | Client conversation prototype |
| `branded-login.png` | Figma-inspired welcome mark, wordmark and login card |
| `client-home.png` | Shared brand header, local-time greeting, and the selected client's workout |
| [Client Home, Recent Messages](client-recent-messages.png) | Bottom of Home at 390 dp. The primary button opens Messages. Its touch target measured 48 dp high at 390 dp, 320 dp with 1.5× text, and 800 dp. |
| `weight-progress-chart.png` | K2F-129: six sample check-ins on Client Progress with All time selected (390 × 844 dp) |
| `workout-history-empty.png`, `workout-history-list.png` | Empty and populated workout history cards, cropped from the 390 dp Android view using temporary demo records |
| `nutrition-targets.png` | K2F-125: Alex's assigned daily targets and same-day intake (390 dp) |
| [Nutrition date controls](nutrition-date-controls.png) | Previous day and disabled Next day on Today, cropped from the standalone 1.0.4 demo at 390 dp |
| `workout-progress.png` | K2F-47: progress remains pinned while scrolling through a two-exercise demo session (390 dp) |

The two dashboard previews show the Sprint 4 branding update at 390 × 844 dp and normal font scale. The login preview is from K2F-34. The workout library, prescription editor, client workout, exercise details, and messaging captures date to `e97c283`. Workout data is local, and conversations use demo messages.

To refresh an image, navigate to the corresponding screen with demo data and capture it with Android's screenshot tool or `adb exec-out screencap -p`. Preserve the real UI and avoid including credentials or test-workout names. The root README uses relative paths to these files.
