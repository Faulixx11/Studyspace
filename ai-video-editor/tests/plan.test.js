import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSegments, buildCaptionTimeline } from "../lib/edit-plan.js";

test("normalizeSegments clamps times and sorts cuts", () => {
  const result = normalizeSegments([
    { start: 7, end: 12 },
    { start: -4, end: 3 }
  ], 10);
  assert.deepEqual(result.map((item) => [item.start, item.end]), [[0, 3], [7, 10]]);
});

test("normalizeSegments removes overlaps and falls back safely", () => {
  const result = normalizeSegments([
    { start: 0, end: 5 },
    { start: 4, end: 8 }
  ], 10);
  assert.deepEqual(result.map((item) => [item.start, item.end]), [[0, 5], [5, 8]]);
  assert.deepEqual(normalizeSegments([], 9).map((item) => [item.start, item.end]), [[0, 9]]);
});

test("captions are remapped to the edited timeline", () => {
  const result = buildCaptionTimeline(
    [{ start: 1, end: 2, text: "First line" }, { start: 8, end: 9, text: "Second line" }],
    [{ start: 0, end: 3 }, { start: 7, end: 10 }]
  );
  assert.equal(result.length, 2);
  assert.equal(result[1].start, 4);
  assert.equal(result[1].end, 5);
});
