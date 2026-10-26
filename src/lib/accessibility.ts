export const ACCESSIBILITY_STORAGE_KEY = "jbarbaro-accessibility-preferences";

export const accessibilityOptions = [
  { key: "contrast", label: "High contrast" },
  { key: "dark", label: "Dark display" },
  { key: "grayscale", label: "Grayscale images" },
  { key: "links", label: "Underline links" },
  { key: "highlight", label: "Highlight controls" },
  { key: "readableFont", label: "Readable font" },
  { key: "lineHeight", label: "More line spacing" },
  { key: "letterSpacing", label: "More letter spacing" },
  { key: "alignLeft", label: "Align text left" },
  { key: "hideImages", label: "Hide images" },
  { key: "readingGuide", label: "Reading guide" },
  { key: "motion", label: "Reduce motion" },
] as const;

export type AccessibilityOption = (typeof accessibilityOptions)[number]["key"];
export type AccessibilityPreferences = Record<AccessibilityOption, boolean> & {
  fontScale: number;
  hideFloating: boolean;
};

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  fontScale: 100,
  contrast: false,
  dark: false,
  grayscale: false,
  links: false,
  highlight: false,
  readableFont: false,
  lineHeight: false,
  letterSpacing: false,
  alignLeft: false,
  hideImages: false,
  readingGuide: false,
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
    preferences.hideFloating = stored.hideFloating === true;
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
