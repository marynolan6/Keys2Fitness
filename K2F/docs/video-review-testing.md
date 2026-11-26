# Coach video review queue (K2F-58 / K2F-265, 266, 267)

The coach opens **Video reviews** from the quick-access menu (the plus button) to see client
videos waiting for feedback, play one, and send feedback that marks it reviewed.

Clients can't upload videos yet, so the queue uses sample submissions from
`src/videoReviews/mockVideoSubmissions.ts` (3 waiting, 1 already reviewed). Every clip is the same
labeled CC0 sample, not real client footage. Review state lives in memory
(`src/videoReviews/videoReviewStore.ts`), so it resets when the app restarts. Clients don't see the
feedback anywhere yet; that needs a client-side story.

**Dashboard integration:** Videos to Review opens the same queue as the plus menu. The dashboard count, client-list badge, and profile form checks subscribe to the review store. A profile links each submission to its review screen, including saved feedback after review. The queue and both detail states use the shared coach brand and page title.

Set `PREVIEW_NO_VIDEOS = true` in the mock file to see the empty queue.

## Files

- `src/videoReviews/videoReview.ts`: plain rules (pending/reviewed split and order, completing a review, date label)
- `src/videoReviews/videoReviewStore.ts`: shared in-memory state for both screens
- `src/app/coach-videos/index.tsx`: the queue (K2F-265)
- `src/app/coach-videos/[videoId].tsx`: play and review one video (K2F-266, K2F-267)
- `src/components/VideoPlayerCard.tsx`: player shared with the exercise demonstration video (K2F-71)
- `tests/video-reviews.test.mjs`: 9 unit tests

## Manual checks

1. Coach home, plus button, **Video reviews**. "Awaiting review (3)" lists Spencer and Alex Morgan,
   oldest first, each with exercise, submitted date, note (if any) and an "Awaiting review" badge.
   "Reviewed (1)" below has a green check badge.
2. Open a waiting video. Play video starts it and switches to Pause video. After the clip ends,
   Play video starts it again from the beginning.
3. Send feedback stays disabled while the box is empty or only spaces. Type feedback; the box stays
   above the keyboard. Send shows "Feedback saved. Video marked as reviewed." and the feedback.
4. Back (button or Android Back) returns to the queue. The video moved to Reviewed and the count dropped.
5. Opening a reviewed video shows the saved feedback with no input box.
6. `/coach-videos/unknown` shows "Video not found" with a way back.

## Verified (Nov 18, 2026)

- Web (Expo web): 375 px, 320 px (no sideways scroll), 768 px tablet. Steps 1 to 6.
- Android emulator (Pixel profile, API 36, Expo Go 58): steps 1 to 5 at ~411 dp; queue and review
  screen at 320 dp with 1.5x font; menu, queue, video, Android Back twice to coach home.
- iOS simulator (iPhone 16, Expo Go 58): play, replay after the end, typing with the keyboard open, send.
- Not tested: iOS large text, offline on this screen (same player as K2F-71, which was tested offline),
   real tablet hardware.

## Dashboard integration verified (Nov 25, 2026)

On Android at 390 dp, submitting Alex's Back Squat feedback from the dashboard queue reduced the pending count from 3 to 2 on both the queue and dashboard. Alex's list badge changed from **Review video** to **On track**. The profile's **View feedback for Back Squat** button reopened the saved text. The missing-video screen showed its coach brand, title and Back button at 320 dp / 1.5× text, 390 dp, and 800 dp.

## Fixed along the way

- Android reports the player as "idle" once a clip ends, so the K2F-71 Play button stayed disabled
  after the video finished. The button is now only disabled while the video loads. This also fixes the
  exercise demonstration video.
