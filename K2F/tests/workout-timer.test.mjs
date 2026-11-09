import assert from "node:assert/strict";
import test from "node:test";
import { elapsedWorkoutTime, formatWorkoutTime, initialWorkoutTimer, transitionWorkoutTimer } from "../src/workouts/workoutTimer.ts";

test("time begins only on Start and paused time is excluded across resume", () => {
  assert.equal(elapsedWorkoutTime(initialWorkoutTimer, 50000), 0);
  const running = transitionWorkoutTimer(initialWorkoutTimer, "start", 1000);
  assert.equal(elapsedWorkoutTime(running, 6000), 5000);
  const paused = transitionWorkoutTimer(running, "pause", 6000);
  assert.equal(elapsedWorkoutTime(paused, 100000), 5000);
  const resumed = transitionWorkoutTimer(paused, "resume", 100000);
  assert.equal(elapsedWorkoutTime(resumed, 103000), 8000);
  assert.equal(elapsedWorkoutTime(transitionWorkoutTimer(resumed, "end", 103000), 200000), 8000);
});

test("a restored paused timer preserves elapsed time without counting time away", () => {
  const saved = JSON.parse(JSON.stringify({ status: "paused", elapsedMs: 120000, runningSince: null }));
  assert.equal(elapsedWorkoutTime(saved, 999999), 120000);
  const ended = transitionWorkoutTimer(saved, "end", 999999);
  assert.equal(ended.status, "ended");
  assert.equal(ended.elapsedMs, 120000);
  assert.equal(transitionWorkoutTimer(ended, "resume", 1000000), ended);
});

test("duplicate or invalid transitions do not restart the timer", () => {
  assert.equal(transitionWorkoutTimer(initialWorkoutTimer, "pause", 1000), initialWorkoutTimer);
  const running = transitionWorkoutTimer(initialWorkoutTimer, "start", 1000);
  assert.equal(transitionWorkoutTimer(running, "start", 5000), running);
});

test("formats minutes and hours, including a background interval without drift", () => {
  assert.equal(formatWorkoutTime(0), "00:00");
  assert.equal(formatWorkoutTime(65000), "01:05");
  assert.equal(formatWorkoutTime(3661000), "01:01:01");
  const running = transitionWorkoutTimer(initialWorkoutTimer, "start", 1000);
  assert.equal(formatWorkoutTime(elapsedWorkoutTime(running, 3662000)), "01:01:01");
});

test("starting a new workout after ending resets elapsed time", () => {
  assert.deepEqual(transitionWorkoutTimer({ status: "ended", elapsedMs: 20000, runningSince: null }, "start", 90000), {
    status: "running", elapsedMs: 0, runningSince: 90000,
  });
});
