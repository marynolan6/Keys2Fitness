# README screenshots

The six screenshots in the main README gallery and its linked weight chart were captured in the standalone Android demo 1.0.5. They use a separate emulator profile with sample data, a 411 dp phone viewport, and normal text size. Each opens as a 900 × 2000 px PNG.

| File | View |
| --- | --- |
| `coach-dashboard.png` | Form-check inbox with the oldest submission and four dashboard shortcuts |
| `workout-library.png` | Templates filter selected, with a search for “Strength” and the collapsed assignment and management controls |
| `prescription-editor.png` | Bench Press in the workout builder: 3 sets, 8 reps, 135 lb, optional rest, and instructions |
| `client-workout.png` | Upper Body Strength ended early with 2 of 4 exercises completed and three recorded Bench Press sets |
| `exercise-details.png` | Bench Press details sheet with its prescription, instructions, and sample demonstration player |
| `client-messages.png` | Sample conversation with Coach Keys, outgoing message, and empty composer |
| `branded-login.png` | Figma-inspired welcome mark, wordmark and login card |
| `client-home.png` | Shared brand header, local-time greeting, and the selected client's workout |
| [Client Home, Recent Messages](client-recent-messages.png) | Bottom of Home at 390 dp. The primary button opens Messages. Its touch target measured 48 dp high at 390 dp, 320 dp with 1.5× text, and 800 dp. |
| `weight-progress-chart.png` | Six sample check-ins on Client Progress with All time selected and Show readings below the chart |
| `workout-history-empty.png`, `workout-history-list.png` | Empty and populated workout history cards, cropped from the 390 dp Android view using temporary demo records |
| `nutrition-targets.png` | K2F-125: Alex's assigned daily targets and same-day intake (390 dp) |
| [Nutrition date controls](nutrition-date-controls.png) | Previous day and disabled Next day on Today, cropped from the standalone 1.0.4 demo at 390 dp |
| [Nine-screen UI review](mobile-ui-review-1.0.4.png) | Standalone 1.0.4 demo, about 411 dp wide at 1× text. Screens are scaled for side-by-side comparison; labels above the captures are annotations. See the [visual audit](../mobile-ui-design-review.md). |
| [Local 1.0.5 preview](mobile-ui-preview-1.0.5.png) | Same nine routes in the redesigned standalone demo, at the same viewport. See the [review walkthrough](../local-design-preview.md). |
| `workout-progress.png` | K2F-47: progress remains pinned while scrolling through a two-exercise demo session (390 dp) |

The individual Client Home and login previews predate the redesign. The two nine-screen sheets preserve the before-and-after comparison.

To refresh an image, navigate to the corresponding screen with demo data and capture it with Android's screenshot tool or `adb exec-out screencap -p`. Preserve the real UI and avoid including credentials or test-workout names. The root README uses relative paths to these files.
