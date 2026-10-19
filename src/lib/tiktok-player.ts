export type TikTokPlayerEvent =
  | { type: "ready" }
  | { type: "state"; value: -1 | 0 | 1 | 2 | 3 }
  | { type: "mute"; value: boolean }
  | { type: "error"; code: number };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlayerState(value: unknown): value is -1 | 0 | 1 | 2 | 3 {
  return value === -1 || value === 0 || value === 1 || value === 2 || value === 3;
}

export function parseTikTokPlayerEvent(
  event: { origin: string; source: unknown; data: unknown },
  expectedSource: unknown,
): TikTokPlayerEvent | null {
  if (
    event.origin !== "https://www.tiktok.com" ||
    expectedSource === null ||
    expectedSource === undefined ||
    event.source !== expectedSource
  ) {
    return null;
  }

  const payload = event.data;
  if (!isObject(payload) || payload["x-tiktok-player"] !== true) {
    return null;
  }

  switch (payload.type) {
    case "onPlayerReady":
      return { type: "ready" };
    case "onStateChange":
      return isPlayerState(payload.value) ? { type: "state", value: payload.value } : null;
    case "onMute":
      return typeof payload.value === "boolean" ? { type: "mute", value: payload.value } : null;
    case "onPlayerError": {
      const value = payload.value;
      return isObject(value) &&
        typeof value.errorCode === "number" &&
        Number.isFinite(value.errorCode) &&
        Number.isInteger(value.errorCode)
        ? { type: "error", code: value.errorCode }
        : null;
    }
    default:
      return null;
  }
}
