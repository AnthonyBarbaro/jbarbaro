type CookiePreference = "accepted" | "essential";

const storageKey = "jbarbaro:cookie-preference";
const preferenceEvent = "jbarbaro:cookie-preference-change";
let sessionPreference: CookiePreference | null = null;

export function getCookiePreference(): CookiePreference | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === "accepted" || value === "essential" ? value : sessionPreference;
  } catch {
    return sessionPreference;
  }
}

export function applyKlaviyoTrackingPreference() {
  const disabled = getCookiePreference() !== "accepted";
  document.cookie = `__kla_off=${disabled}; Path=/; SameSite=Lax`;
}

function updateActiveTracking(previous: CookiePreference | null) {
  if (!document.getElementById("klaviyo-onsite")) return;

  applyKlaviyoTrackingPreference();
  if ((previous === "accepted") !== (getCookiePreference() === "accepted")) {
    window.location.reload();
  }
}

export function saveCookiePreference(preference: CookiePreference) {
  const previous = getCookiePreference();
  sessionPreference = preference;
  try {
    window.localStorage.setItem(storageKey, preference);
  } catch {
    // Keep the current session's choice when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(preferenceEvent));
  updateActiveTracking(previous);
}

export function subscribeToCookiePreference(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key !== storageKey && event.key !== null) return;
    sessionPreference = null;
    onChange();
    updateActiveTracking(event.oldValue === "accepted" ? "accepted" : null);
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(preferenceEvent, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(preferenceEvent, onChange);
  };
}
