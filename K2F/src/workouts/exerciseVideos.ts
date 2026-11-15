// K2F-71: Demonstration videos for the exercise details modal
// Keyed with exerciseKey() from coachTips.ts ("Bench Press" -> "bench-press") so
// assigned copies, which get new exercise IDs, still find their video.

export type ExerciseVideo = {
  uri: string;
  // True while we only have placeholder footage, so the UI can say so
  isSample: boolean;
};

// Demo data until the client gives us real exercise videos.
// These are free CC0 sample clips from MDN, NOT exercise footage.
const sampleClip = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const demoVideos: Record<string, ExerciseVideo> = {
  "bench-press": { uri: sampleClip, isSample: true },
  "incline-dumbbell-press": { uri: sampleClip, isSample: true },
  "seated-cable-row": { uri: sampleClip, isSample: true },
  "hammer-curl": { uri: sampleClip, isSample: true },
  // Lower body exercises have no video yet, to check the unavailable state (K2F-279)
};

export function getExerciseVideo(key: string): ExerciseVideo | null {
  return demoVideos[key] ?? null;
}
