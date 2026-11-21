import assert from "node:assert/strict";
import test from "node:test";

import {
  accessibilityAttribute,
  accessibilityOptions,
  defaultAccessibilityPreferences,
  parseAccessibilityPreferences,
} from "@/lib/accessibility";

test("invalid or missing saved accessibility data uses defaults", () => {
  for (const value of [null, "", "{broken", "null", "false", "42", '"string"', "[]"]) {
    assert.deepEqual(parseAccessibilityPreferences(value), defaultAccessibilityPreferences);
  }
});

test("only supported preferences and text sizes are restored", () => {
  const preferences = parseAccessibilityPreferences(
    JSON.stringify({
      fontScale: 150,
      contrast: true,
      motion: "true",
      dark: 1,
      hideFloating: true,
      unexpected: "value",
    }),
  );
  assert.deepEqual(preferences, {
    ...defaultAccessibilityPreferences,
    fontScale: 150,
    contrast: true,
    hideFloating: true,
  });
  for (const fontScale of [-100, 0, 99, 101, 125.5, 225, "150"]) {
    assert.equal(parseAccessibilityPreferences(JSON.stringify({ fontScale })).fontScale, 100);
  }
  for (const fontScale of [100, 125, 150, 175, 200]) {
    assert.equal(parseAccessibilityPreferences(JSON.stringify({ fontScale })).fontScale, fontScale);
  }
});

test("preference attributes match the site's CSS hooks", () => {
  assert.equal(accessibilityAttribute("motion"), "data-a11y-motion");
  assert.equal(accessibilityAttribute("readableFont"), "data-a11y-readable-font");
  assert.equal(accessibilityAttribute("readingGuide"), "data-a11y-reading-guide");
});

test("reading guide defaults to large and restores a saved standard size", () => {
  assert.equal(
    parseAccessibilityPreferences(JSON.stringify({ readingGuide: true })).readingGuideSize,
    "large",
  );
  for (const readingGuideSize of ["standard", "large"] as const) {
    assert.equal(
      parseAccessibilityPreferences(JSON.stringify({ readingGuideSize })).readingGuideSize,
      readingGuideSize,
    );
  }
  assert.equal(
    parseAccessibilityPreferences(JSON.stringify({ readingGuideSize: "unsupported" }))
      .readingGuideSize,
    "large",
  );
});

test("boolean preferences and text sizes survive saving and restoring", () => {
  const keys = [
    ...accessibilityOptions.map(({ key }) => key),
    "hideFloating",
    "dimOutsideGuide",
  ] as const;
  for (let mask = 0; mask < 2 ** keys.length; mask += 1) {
    for (const fontScale of [100, 125, 150, 175, 200]) {
      const preferences = { ...defaultAccessibilityPreferences, fontScale };
      keys.forEach((key, index) => {
        preferences[key] = Boolean(mask & (1 << index));
      });
      assert.deepEqual(parseAccessibilityPreferences(JSON.stringify(preferences)), preferences);
    }
  }
});
