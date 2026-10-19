import assert from "node:assert/strict";
import test from "node:test";

import { getAdjacentReelIndex, getReelSwipeDirection } from "@/lib/reel-navigation";

test("left and up advance while right and down return to the previous reel", () => {
  assert.equal(getReelSwipeDirection(-80, 0), 1);
  assert.equal(getReelSwipeDirection(0, -80), 1);
  assert.equal(getReelSwipeDirection(80, 0), -1);
  assert.equal(getReelSwipeDirection(0, 80), -1);
});

test("the 44-pixel swipe threshold is inclusive on both axes", () => {
  for (const sign of [-1, 1] as const) {
    assert.equal(getReelSwipeDirection(sign * 43.999, 0), 0);
    assert.equal(getReelSwipeDirection(0, sign * 43.999), 0);
    assert.equal(getReelSwipeDirection(sign * 44, 0), sign === -1 ? 1 : -1);
    assert.equal(getReelSwipeDirection(0, sign * 44), sign === -1 ? 1 : -1);
  }
});

test("the dominant axis determines direction despite movement on the other axis", () => {
  assert.equal(getReelSwipeDirection(-80, 50), 1);
  assert.equal(getReelSwipeDirection(50, -80), 1);
  assert.equal(getReelSwipeDirection(80, -50), -1);
  assert.equal(getReelSwipeDirection(-50, 80), -1);
});

test("diagonal ties and ambiguous movement do not change reels", () => {
  for (const xSign of [-1, 1]) {
    for (const ySign of [-1, 1]) {
      assert.equal(getReelSwipeDirection(xSign * 80, ySign * 80), 0);
      assert.equal(getReelSwipeDirection(xSign * 60, ySign * 51), 0);
      assert.equal(getReelSwipeDirection(xSign * 51, ySign * 60), 0);
    }
  }
});

test("a 1.2 dominance ratio is sufficient in either direction on either axis", () => {
  assert.equal(getReelSwipeDirection(-60, 50), 1);
  assert.equal(getReelSwipeDirection(50, -60), 1);
  assert.equal(getReelSwipeDirection(60, -50), -1);
  assert.equal(getReelSwipeDirection(-50, 60), -1);
});

test("a tap or small movement never changes reels", () => {
  for (const [deltaX, deltaY] of [
    [0, 0],
    [1, -1],
    [12, 8],
    [-8, -12],
    [30, 30],
  ]) {
    assert.equal(getReelSwipeDirection(deltaX, deltaY), 0);
  }
});

test("nonfinite pointer coordinates are ignored", () => {
  for (const invalid of [NaN, Infinity, -Infinity]) {
    assert.equal(getReelSwipeDirection(invalid, -80), 0);
    assert.equal(getReelSwipeDirection(-80, invalid), 0);
    assert.equal(getReelSwipeDirection(invalid, invalid), 0);
  }
});

test("navigation wraps between the first and fourth reels", () => {
  assert.deepEqual(
    [0, 1, 2, 3].map((index) => getAdjacentReelIndex(index, 1, 4)),
    [1, 2, 3, 0],
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((index) => getAdjacentReelIndex(index, -1, 4)),
    [3, 0, 1, 2],
  );
});

test("four successive gestures complete a cycle in both directions", () => {
  for (const [deltaX, deltaY] of [
    [-80, 0],
    [0, -80],
    [80, 0],
    [0, 80],
  ]) {
    const direction = getReelSwipeDirection(deltaX, deltaY);
    assert.ok(direction === 1 || direction === -1);

    const visited = [0];
    for (let step = 0; step < 4; step += 1) {
      visited.push(getAdjacentReelIndex(visited[step], direction, 4));
    }
    assert.deepEqual(visited, direction === 1 ? [0, 1, 2, 3, 0] : [0, 3, 2, 1, 0]);
  }
});

test("empty and single-clip lists remain at index zero", () => {
  for (const count of [0, 1]) {
    assert.equal(getAdjacentReelIndex(0, 1, count), 0);
    assert.equal(getAdjacentReelIndex(0, -1, count), 0);
  }
});

test("indexes outside the list normalize before advancing", () => {
  assert.equal(getAdjacentReelIndex(8, 1, 4), 1);
  assert.equal(getAdjacentReelIndex(8, -1, 4), 3);
  assert.equal(getAdjacentReelIndex(-1, 1, 4), 0);
  assert.equal(getAdjacentReelIndex(-1, -1, 4), 2);
  assert.equal(getAdjacentReelIndex(2.9, 1, 4), 3);
  assert.equal(getAdjacentReelIndex(Number.MAX_SAFE_INTEGER - 1, 1, Number.MAX_SAFE_INTEGER), 0);
  assert.equal(getAdjacentReelIndex(0, -1, Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER - 1);
});

test("invalid counts and nonfinite indexes return a safe index", () => {
  for (const count of [-1, 2.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(getAdjacentReelIndex(0, 1, count), 0);
  }
  for (const index of [NaN, Infinity, -Infinity]) {
    assert.equal(getAdjacentReelIndex(index, 1, 4), 0);
  }
});
