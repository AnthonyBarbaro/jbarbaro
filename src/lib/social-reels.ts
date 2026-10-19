export type SocialReel = {
  platform: "instagram" | "tiktok";
  href: string;
  embedSrc?: string;
};

type OfficialSocialUrl = {
  hostname: string;
  path: string;
  hasExplicitPort: boolean;
};

function parseOfficialSocialUrl(href: string): OfficialSocialUrl | null {
  const value = href.trim();
  if (/[\u0000-\u0020\u007f\\]/.test(value)) return null;

  const raw = /^https:\/\/([^/?#]+)(\/[^?#]*)(?:[?#].*)?$/i.exec(value);
  if (!raw || !/^(?:www\.)?(?:instagram|tiktok)\.com(?::443)?$/i.test(raw[1])) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  // Match the original path so URL parsing cannot silently accept dot-segment traversal.
  return { hostname: url.hostname, path: raw[2], hasExplicitPort: raw[1].includes(":") };
}

function decodeTikTokHandle(value: string): string | null {
  let handle: string;
  try {
    handle = decodeURIComponent(value);
    // Reject malformed Unicode before constructing a canonical URL.
    encodeURIComponent(handle);
  } catch {
    return null;
  }
  return handle && !/[\s\u0000-\u001f\u007f/\\?#@<>"'`=]/.test(handle) ? handle : null;
}

export function resolveSocialReel(href: string): SocialReel | null {
  const url = parseOfficialSocialUrl(href);
  if (!url) return null;

  if (url.hostname === "instagram.com" || url.hostname === "www.instagram.com") {
    const post = /^\/(reel|p)\/([A-Za-z0-9_-]+)\/?$/.exec(url.path);
    return post
      ? { platform: "instagram", href: `https://www.instagram.com/${post[1]}/${post[2]}/` }
      : null;
  }

  const video = /^\/@([^/]+)\/video\/([0-9]+)\/?$/.exec(url.path);
  if (!video) return null;

  const handle = decodeTikTokHandle(video[1]);
  if (!handle) return null;

  return {
    platform: "tiktok",
    href: `https://www.tiktok.com/@${encodeURIComponent(handle)}/video/${video[2]}`,
    embedSrc: `https://www.tiktok.com/player/v1/${video[2]}?controls=1&autoplay=0&loop=0&closed_caption=1`,
  };
}

export function resolveTikTokProfile(href: string): { href: string; handle: string } | null {
  const url = parseOfficialSocialUrl(href);
  if (
    !url ||
    url.hasExplicitPort ||
    (url.hostname !== "tiktok.com" && url.hostname !== "www.tiktok.com")
  ) {
    return null;
  }

  const profile = /^\/@([^/]+)\/?$/.exec(url.path);
  const handle = profile && decodeTikTokHandle(profile[1]);
  return handle ? { href: `https://www.tiktok.com/@${encodeURIComponent(handle)}`, handle } : null;
}
