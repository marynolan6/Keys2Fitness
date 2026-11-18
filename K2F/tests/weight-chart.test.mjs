import assert from "node:assert/strict";
import test from "node:test";
import { buildWeightChart } from "../src/checkins/weightChart.ts";
import { mockCheckIns, sampleCheckInAsOf } from "../src/checkins/mockCheckIns.ts";
import { formatMeasurement } from "../src/goals/goal.ts";

const reading = (date, weightKg = 70, id = date) => ({ id, date, weightKg });

test("the Profile check-ins plot oldest first with real date spacing and the same displayed pounds", () => {
  const input = Object.freeze(mockCheckIns.map((entry) => Object.freeze({ ...entry })));
  const chart = buildWeightChart(input, "all", sampleCheckInAsOf);
  assert.equal(chart.kind, "line");
  assert.deepEqual(chart.points.map((p) => p.id), ["c1", "c2", "c3", "c4", "c5", "c6"]);
  assert.deepEqual(chart.points.map((p) => p.x), [0, 7 / 32, 14 / 32, 21 / 32, 28 / 32, 1]);
  const [first, last] = [chart.points[0], chart.points.at(-1)];
  assert.ok(first.y < last.y); // The lower weight is lower on the chart.
  assert.equal(formatMeasurement(last.weightKg, "kg"), "150.4 lb");
});

test("30 and 90 days include both endpoints; all time includes earlier readings but never future ones", () => {
  const through = "2026-10-03";
  const dates = ["2026-10-04", "2026-10-03", "2026-09-04", "2026-09-03", "2026-07-06", "2026-07-05"];
  const input = dates.map((date) => reading(date));
  for (const [range, start, expected] of [
    [30, "2026-09-04", ["2026-09-04", through]],
    [90, "2026-07-06", ["2026-07-06", "2026-09-03", "2026-09-04", through]],
    ["all", "2026-07-05", ["2026-07-05", "2026-07-06", "2026-09-03", "2026-09-04", through]],
  ]) {
    const chart = buildWeightChart(input, range, through);
    assert.equal(chart.startDate, start);
    assert.equal(chart.endDate, through);
    assert.deepEqual(chart.points.map((p) => p.date), expected);
  }
});

test("the x-axis changes with the selected window even if two ranges contain the same sample readings", () => {
  const ninety = buildWeightChart(mockCheckIns, 90, sampleCheckInAsOf);
  const all = buildWeightChart(mockCheckIns, "all", sampleCheckInAsOf);
  assert.equal(ninety.points.length, all.points.length);
  assert.ok(ninety.points[0].x > all.points[0].x);
});

test("empty, invalid, and out-of-range histories do not draw zero weights or a fabricated trend", () => {
  const invalid = [reading("2026-02-30"), reading("not-a-date"), reading("2026-11-01"),
    ...[undefined, NaN, Infinity, Number.MAX_VALUE, 0, -2].map((weightKg) => ({ ...reading(sampleCheckInAsOf), weightKg }))];
  for (const range of [30, 90, "all"]) {
    for (const input of [[], invalid]) {
      assert.deepEqual(buildWeightChart(input, range, sampleCheckInAsOf), { kind: "empty", hasEarlier: false });
    }
  }
  const older = [reading("2026-06-01")];
  assert.deepEqual(buildWeightChart(older, 90, sampleCheckInAsOf), { kind: "empty", hasEarlier: true });
  assert.equal(buildWeightChart(older, "all", sampleCheckInAsOf).kind, "single");
});

test("one reading has a finite scaled point, including when both date-axis endpoints coincide", () => {
  const input = [reading("2026-04-01"), reading(sampleCheckInAsOf, 68.2)];
  const single = buildWeightChart(input, 30, sampleCheckInAsOf);
  assert.equal(single.kind, "single");
  assert.equal(single.points[0].x, 1);
  const all = buildWeightChart(input.slice(1), "all", sampleCheckInAsOf);
  assert.equal(all.startDate, all.endDate);
  assert.equal(all.points[0].x, 0.5);
  assert.ok(all.points[0].y > 0 && all.points[0].y < 1);
});

test("equal weights on different dates plot a flat line; same-day readings are retained without implying elapsed time", () => {
  const flat = buildWeightChart([reading("2026-10-01"), reading("2026-10-03")], 30, sampleCheckInAsOf);
  assert.equal(flat.kind, "line");
  assert.equal(flat.points[0].y, flat.points[1].y);
  assert.ok(flat.highKg > flat.lowKg);
  const same = buildWeightChart([reading(sampleCheckInAsOf, 72, "b"), reading(sampleCheckInAsOf, 71, "a")], "all", sampleCheckInAsOf);
  assert.equal(same.kind, "same-day");
  assert.deepEqual(same.points.map((p) => [p.id, p.x]), [["a", 0.5], ["b", 0.5]]);
});

test("calendar filtering covers leap days and stays consistent through daylight-saving changes", () => {
  const leap = buildWeightChart([reading("2024-02-28"), reading("2024-02-29"), reading("2024-03-29")], 30, "2024-03-29");
  assert.deepEqual(leap.points.map((p) => p.x), [0, 1]);
  assert.equal(leap.startDate, "2024-02-29");
  const fall = buildWeightChart([reading("2026-10-11"), reading("2026-10-12"), reading("2026-11-10")], 30, "2026-11-10");
  assert.deepEqual(fall.points.map((p) => p.date), ["2026-10-12", "2026-11-10"]);
});
