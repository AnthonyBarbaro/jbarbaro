export const ACCESSIBILITY_STORAGE_KEY = "jbarbaro-accessibility-preferences";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const accessibilityGroups = [
  {
    label: "Reading tools",
    options: [
      { key: "readingGuide", label: "Reading guide" },
      { key: "readableFont", label: "Readable font" },
      { key: "lineHeight", label: "More line spacing" },
      { key: "letterSpacing", label: "More letter spacing" },
      { key: "alignLeft", label: "Align text left" },
    ],
  },
  {
    label: "Contrast and navigation",
    options: [
      { key: "contrast", label: "High contrast" },
      { key: "dark", label: "Dark display" },
      { key: "links", label: "Underline links" },
      { key: "highlight", label: "Highlight controls" },
      { key: "largePointer", label: "Large pointer" },
    ],
  },
  {
    label: "Images and motion",
    options: [
      { key: "grayscale", label: "Grayscale images" },
      { key: "hideImages", label: "Hide images" },
      { key: "motion", label: "Reduce motion" },
    ],
  },
] as const;

type AccessibilityControl = (typeof accessibilityGroups)[number]["options"][number];
export const accessibilityOptions = accessibilityGroups.flatMap<AccessibilityControl>(
  ({ options }) => options,
);
export type AccessibilityOption = AccessibilityControl["key"];

export type ReadingGuideSize = "standard" | "large";

export type AccessibilityPreferences = Record<AccessibilityOption, boolean> & {
  fontScale: number;
  hideFloating: boolean;
  readingGuideSize: ReadingGuideSize;
  dimOutsideGuide: boolean;
};

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  fontScale: 100,
  contrast: false,
  dark: false,
  grayscale: false,
  links: false,
  highlight: false,
  largePointer: false,
  readableFont: false,
  lineHeight: false,
  letterSpacing: false,
  alignLeft: false,
  hideImages: false,
  readingGuide: false,
  readingGuideSize: "large",
  dimOutsideGuide: false,
  motion: false,
  hideFloating: false,
};

export function parseAccessibilityPreferences(value: string | null): AccessibilityPreferences {
  const preferences = { ...defaultAccessibilityPreferences };
  if (!value) return preferences;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return preferences;
    const stored = parsed as Record<string, unknown>;

    for (const { key } of accessibilityOptions) {
      preferences[key] = stored[key] === true;
    }
    if (stored.readingGuideSize === "standard") {
      preferences.readingGuideSize = stored.readingGuideSize;
    }
    preferences.hideFloating = stored.hideFloating === true;
    preferences.dimOutsideGuide = stored.dimOutsideGuide === true;
    if (
      typeof stored.fontScale === "number" &&
      Number.isInteger(stored.fontScale) &&
      stored.fontScale >= 100 &&
      stored.fontScale <= 200 &&
      stored.fontScale % 25 === 0
    ) {
      preferences.fontScale = stored.fontScale;
    }
  } catch {
    // Invalid browser storage must not prevent access to the display controls.
  }

  return preferences;
}

export function accessibilityAttribute(key: AccessibilityOption): string {
  return `data-a11y-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

export function getScrollBehavior(): ScrollBehavior {
  return document.documentElement.dataset.a11yMotion === "true" ||
    window.matchMedia(REDUCED_MOTION_QUERY).matches
    ? "instant"
    : "smooth";
}
