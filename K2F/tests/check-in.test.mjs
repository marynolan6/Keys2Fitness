import assert from "node:assert/strict";
import test from "node:test";
import { sortCheckInsNewestFirst, buildCheckInRows, groupCheckInsByMonth } from "../src/checkins/checkIn.ts";

const checkIn = (id, date, weightKg, measurements = {}) => ({
  id, date, weightKg, ...(Object.keys(measurements).length ? { measurements } : {}),
});

test("sortCheckInsNewestFirst puts newest dates first", () => {
  const input = [
    checkIn("a", "2026-10-01", 70),
    checkIn("c", "2026-10-03", 72),
    checkIn("b", "2026-10-02", 71),
  ];
  const sorted = sortCheckInsNewestFirst([...input]);
  assert.deepEqual(sorted.map((c) => c.id), ["c", "b", "a"]);
  // original is not mutated
  assert.deepEqual(input.map((c) => c.id), ["a", "c", "b"]);
});

test("sortCheckInsNewestFirst breaks ties by id", () => {
  const input = [
    checkIn("b", "2026-10-03", 70),
    checkIn("a", "2026-10-03", 71),
  ];
  const sorted = sortCheckInsNewestFirst(input);
  assert.deepEqual(sorted.map((c) => c.id), ["b", "a"]);
});

test("buildCheckInRows marks latest and first, computes weight change", () => {
  const input = [
    checkIn("a", "2026-10-01", 70),
    checkIn("b", "2026-10-03", 72),
    checkIn("c", "2026-10-02", 71),
  ];
  const rows = buildCheckInRows(input);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].isLatest, true);
  assert.equal(rows[0].isFirst, false);
  assert.equal(rows[0].weightChange, 1); // 72 - 71
  assert.equal(rows[1].isLatest, false);
  assert.equal(rows[1].isFirst, false);
  assert.equal(rows[1].weightChange, 1); // 71 - 70
  assert.equal(rows[2].isLatest, false);
  assert.equal(rows[2].isFirst, true);
  assert.equal(rows[2].weightChange, null);
});

test("buildCheckInRows computes measurement change since the earlier check-in", () => {
  const input = [
    checkIn("a", "2026-10-01", 70, { waistCm: 80 }),
    checkIn("b", "2026-10-03", 72, { waistCm: 78 }),
    checkIn("c", "2026-10-02", 71, {}),
  ];
  const rows = buildCheckInRows(input);
  const waistRows = rows.map((r) => r.measurements.find((m) => m.key === "waistCm"));
  assert.deepEqual(waistRows[0].value, 78);
  assert.equal(waistRows[0].change, -2); // 78 - 80
  assert.equal(waistRows[1], undefined); // row c has no waist
  assert.equal(waistRows[2].value, 80);
  assert.equal(waistRows[2].change, null); // no earlier waist
});

test("groupCheckInsByMonth groups rows by month (newest month first)", () => {
  const rows = buildCheckInRows([
    checkIn("a", "2026-10-01", 70),
    checkIn("b", "2026-10-15", 71),
    checkIn("c", "2026-11-01", 72),
  ]);
  const months = groupCheckInsByMonth(rows);
  assert.equal(months.length, 2);
  assert.equal(months[0].title, "November 2026");
  assert.equal(months[0].rows.length, 1);
  assert.equal(months[1].title, "October 2026");
  assert.equal(months[1].rows.length, 2);
});

test("groupCheckInsByMonth handles empty input", () => {
  assert.deepEqual(groupCheckInsByMonth([]), []);
});
