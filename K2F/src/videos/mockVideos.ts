export type VideoReviewStatus = "pending" | "reviewed";

export type MockVideo = {
  id: string;
  clientId: string;
  clientName: string;
  workoutName: string;
  videoUri: string;
  createdAt: string;
  reviewStatus: VideoReviewStatus;
};

const sampleVideoUri =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export const mockVideos: MockVideo[] = [
  {
    id: "video-1",
    clientId: "1",
    clientName: "Spencer",
    workoutName: "Bench Press",
    videoUri: sampleVideoUri,
    createdAt: "2026-11-03T09:24:00",
    reviewStatus: "pending",
  },
  {
    id: "video-2",
    clientId: "3",
    clientName: "Jordan Lee",
    workoutName: "Back Squat",
    videoUri: sampleVideoUri,
    createdAt: "2026-11-03T08:45:00",
    reviewStatus: "pending",
  },
  {
    id: "video-3",
    clientId: "2",
    clientName: "Alex Morgan",
    workoutName: "Morning Workout",
    videoUri: sampleVideoUri,
    createdAt: "2026-11-03T08:10:00",
    reviewStatus: "pending",
  },
  {
    id: "video-4",
    clientId: "1",
    clientName: "Spencer",
    workoutName: "Deadlift",
    videoUri: sampleVideoUri,
    createdAt: "2026-11-02T14:30:00",
    reviewStatus: "reviewed",
  },
];

export function getPendingVideos() {
  return mockVideos.filter(
    (video) => video.reviewStatus === "pending",
  );
}