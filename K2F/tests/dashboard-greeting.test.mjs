import assert from "node:assert/strict";
import test from "node:test";
import { dashboardPeriod } from "../src/utils/dashboardGreeting.ts";

test("dashboard greetings change at local noon, 6 pm, and the next midnight", () => {
  for (const [hour, minute, greeting, next] of [
    [0, 0, "Good morning", 12], [11, 59, "Good morning", 12],
    [12, 0, "Good afternoon", 18], [17, 59, "Good afternoon", 18],
    [18, 0, "Good evening", 24], [23, 59, "Good evening", 24],
  ]) {
    const clock = dashboardPeriod(new Date(2026, 11, 31, hour, minute));
    assert.equal(clock.greeting, greeting);
    assert.equal(clock.next.getTime(), new Date(2026, 11, 31, next).getTime());
  }
});
