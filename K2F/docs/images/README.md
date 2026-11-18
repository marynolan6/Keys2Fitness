# README screenshots

These PNGs are captures of the running Android app in Expo Go, using the project's demo data. They show the implemented UI, rather than Figma mockups.

| File | View |
| --- | --- |
| `coach-dashboard.png` | Coach dashboard and active-client summary |
| `workout-library.png` | Workout library filtered to strength plans |
| `prescription-editor.png` | Coach exercise-prescription editor |
| `client-workout.png` | Client workout and completion controls |
| `exercise-details.png` | Exercise instructions and client-specific coach recommendation |
| `client-messages.png` | Client conversation prototype |
| `branded-login.png` | Figma-inspired welcome mark, wordmark and login card |
| `client-home.png` | Compact brand header and a single dated assignment list |
| `weight-progress-chart.png` | K2F-129: six sample check-ins on Client Progress with All time selected (390 × 844 dp) |
| `workout-history-empty.png`, `workout-history-list.png` | Empty and populated workout history cards, cropped from the 390 dp Android view using temporary demo records |

The original six captures are from `e97c283` at 1080 × 2400 and normal font scale. The login and Home previews are from the K2F-34 branch at 390 × 844 dp and normal font scale. On Home, the two entries with the same plan name have different assignment dates. Workout data is local, and messages are sample/local UI data.

To refresh an image, navigate to the corresponding screen with demo data and capture it with Android's screenshot tool or `adb exec-out screencap -p`. Preserve the real UI and avoid including credentials or test-workout names. The root README uses relative paths to these files.
