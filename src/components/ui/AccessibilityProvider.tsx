"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  ACCESSIBILITY_STORAGE_KEY,
  accessibilityAttribute,
  accessibilityOptions,
  defaultAccessibilityPreferences,
  parseAccessibilityPreferences,
  type AccessibilityPreferences,
} from "@/lib/accessibility";

const changeEvent = "jbarbaro:accessibility-change";
let preferences = defaultAccessibilityPreferences;

function subscribe(onChange: () => void): () => void {
  function readStorage(event?: StorageEvent): void {
    if (event && event.key !== null && event.key !== ACCESSIBILITY_STORAGE_KEY) return;
    try {
      preferences = parseAccessibilityPreferences(localStorage.getItem(ACCESSIBILITY_STORAGE_KEY));
    } catch {
      // Keep this session's choices when the browser blocks storage.
    }
    onChange();
  }

  readStorage();
  window.addEventListener("storage", readStorage);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", readStorage);
    window.removeEventListener(changeEvent, onChange);
  };
}

function savePreferences(next: AccessibilityPreferences): void {
  preferences = next;
  try {
    if (next === defaultAccessibilityPreferences)
      localStorage.removeItem(ACCESSIBILITY_STORAGE_KEY);
    else localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Changes still work for this session without browser storage.
  }
  window.dispatchEvent(new Event(changeEvent));
}

type AccessibilityContextValue = {
  preferences: AccessibilityPreferences;
  setPreferences: (preferences: AccessibilityPreferences) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }): ReactNode {
  const current = useSyncExternalStore(
    subscribe,
    () => preferences,
    () => defaultAccessibilityPreferences,
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--a11y-font-scale", `${current.fontScale}%`);
    root.dataset.a11yFontScale = String(current.fontScale);
    for (const { key } of accessibilityOptions) {
      root.setAttribute(accessibilityAttribute(key), String(current[key]));
    }
  }, [current]);

  return (
    <AccessibilityContext.Provider
      value={{ preferences: current, setPreferences: savePreferences, isOpen, setIsOpen }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error("Accessibility controls require AccessibilityProvider.");
  return context;
}
