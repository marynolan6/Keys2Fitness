import assert from "node:assert/strict";
import test from "node:test";
import { exerciseKey } from "../src/workouts/coachTips.ts";
import { getExerciseVideo } from "../src/workouts/exerciseVideos.ts";

// K2F-71: videos are matched by exercise name, so the right video shows up
// even on an assigned copy that has a different exercise ID

test("an exercise with a demo video gets one", () => {
  const video = getExerciseVideo(exerciseKey("Bench Press"));
  assert.ok(video);
  assert.match(video.uri, /^https:\/\//);
});

test("name spacing and case don't matter", () => {
  assert.deepEqual(getExerciseVideo(exerciseKey("  bench PRESS ")), getExerciseVideo(exerciseKey("Bench Press")));
});

test("an exercise without a video gets null, not another exercise's video", () => {
  assert.equal(getExerciseVideo(exerciseKey("Back Squat")), null);
  assert.equal(getExerciseVideo(exerciseKey("Made Up Exercise")), null);
  assert.equal(getExerciseVideo(""), null);
});

test("placeholder footage is labeled as a sample", () => {
  for (const name of ["Bench Press", "Incline Dumbbell Press", "Seated Cable Row", "Hammer Curl"]) {
    assert.equal(getExerciseVideo(exerciseKey(name))?.isSample, true, name);
  }
});
