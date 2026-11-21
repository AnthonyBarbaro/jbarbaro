import { KLAVIYO_ONSITE_SCRIPT_ID } from "@/lib/klaviyo";

type CookiePreference = "accepted" | "essential";

const storageKey = "jbarbaro:cookie-preference";
const preferenceEvent = "jbarbaro:cookie-preference-change";
let sessionPreference: CookiePreference | null = null;
let appliedTrackingEnabled: boolean | undefined;

export function getCookiePreference(): CookiePreference | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === "accepted" || value === "essential" ? value : sessionPreference;
  } catch {
    return sessionPreference;
  }
}

export function applyKlaviyoTrackingPreference() {
  appliedTrackingEnabled = getCookiePreference() === "accepted";
  document.cookie = `__kla_off=${!appliedTrackingEnabled}; Path=/; SameSite=Lax`;
}

function updateActiveTracking() {
  if (!document.getElementById(KLAVIYO_ONSITE_SCRIPT_ID)) return;

  const previous = appliedTrackingEnabled;
  applyKlaviyoTrackingPreference();
  if (previous !== appliedTrackingEnabled) {
    window.location.reload();
  }
}

export function saveCookiePreference(preference: CookiePreference) {
  sessionPreference = preference;
  try {
    window.localStorage.setItem(storageKey, preference);
  } catch {
    // Keep the current session's choice when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(preferenceEvent));
  updateActiveTracking();
}

export function subscribeToCookiePreference(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key !== storageKey && event.key !== null) return;
    sessionPreference = null;
    onChange();
    updateActiveTracking();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(preferenceEvent, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(preferenceEvent, onChange);
  };
}
