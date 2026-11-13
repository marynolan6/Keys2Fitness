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

Captured from source revision `e97c283` at the emulator's standard 1080 × 2400 resolution and normal font scale. Screens may show different demo contexts. Workout data is local, and messages are sample/local UI data; these images do not demonstrate cross-device synchronization.

To refresh an image, navigate to the corresponding screen with demo data and capture it with Android's screenshot tool or `adb exec-out screencap -p`. Preserve the real UI and avoid including credentials or test-workout names. The root README uses relative paths to these files.
