import assert from "node:assert/strict";
import test from "node:test";

import { resolveSocialReel, resolveTikTokProfile } from "@/lib/social-reels";

test("Instagram reel and post links canonicalize without constructing an iframe URL", () => {
  for (const host of ["instagram.com", "www.instagram.com", "WWW.INSTAGRAM.COM"]) {
    for (const path of ["reel", "p"]) {
      for (const suffix of ["", "/", "/?utm_source=share#details"]) {
        const resolved = resolveSocialReel(`https://${host}/${path}/AbC_123-${suffix}`);
        assert.deepEqual(resolved, {
          platform: "instagram",
          href: `https://www.instagram.com/${path}/AbC_123-/`,
        });
        assert.equal(resolved?.embedSrc, undefined);
      }
    }
  }
});

test("TikTok links preserve long numeric IDs and use the approved player settings", () => {
  const id = "7490123456789012345";
  for (const host of ["tiktok.com", "www.tiktok.com", "WWW.TIKTOK.COM"]) {
    for (const suffix of ["", "/", "?is_from_webapp=1#details"]) {
      assert.deepEqual(resolveSocialReel(`https://${host}/@store.name_2/video/${id}${suffix}`), {
        platform: "tiktok",
        href: `https://www.tiktok.com/@store.name_2/video/${id}`,
        embedSrc: `https://www.tiktok.com/player/v1/${id}?controls=1&autoplay=0&loop=0&closed_caption=1`,
      });
    }
  }
});

test("a nonempty TikTok handle can be safely encoded without inventing username rules", () => {
  for (const handle of ["shop-name", "店铺", "%E5%BA%97%E9%93%BA"]) {
    const decoded = decodeURIComponent(handle);
    assert.equal(
      resolveSocialReel(`https://www.tiktok.com/@${handle}/video/123`)?.href,
      `https://www.tiktok.com/@${encodeURIComponent(decoded)}/video/123`,
    );
  }
});

test("standard HTTPS ports and surrounding whitespace normalize to the official URL", () => {
  assert.deepEqual(resolveSocialReel("  HTTPS://INSTAGRAM.COM:443/reel/abc/  "), {
    platform: "instagram",
    href: "https://www.instagram.com/reel/abc/",
  });
  assert.equal(
    resolveSocialReel("https://www.tiktok.com:443/@shop/video/00123/")?.embedSrc,
    "https://www.tiktok.com/player/v1/00123?controls=1&autoplay=0&loop=0&closed_caption=1",
  );
});

test("non-HTTPS, credentialed, spoofed and nonstandard-port URLs are rejected", () => {
  for (const href of [
    "",
    "not a URL",
    "/reel/abc/",
    "//www.instagram.com/reel/abc/",
    "http://www.instagram.com/reel/abc/",
    "javascript:https://www.instagram.com/reel/abc/",
    "https://user:password@www.instagram.com/reel/abc/",
    "https://@www.instagram.com/reel/abc/",
    "https://www.instagram.com:8443/reel/abc/",
    "https://www.tiktok.com:80/@shop/video/123",
    "https://www.instagram.com.example.test/reel/abc/",
    "https://instagram.example.test/reel/abc/",
    "https://example.test/?url=https://www.instagram.com/reel/abc/",
    "https://www.instagram.com@evil.example/reel/abc/",
    "https://www.instagram.com./reel/abc/",
    "https://%77ww.instagram.com/reel/abc/",
    "https://m.tiktok.com/@shop/video/123",
    "https://vm.tiktok.com/abc/",
    "https://vt.tiktok.com/abc/",
    "https://www.tiktok.com/t/abc/",
    "https://www.instagram.com\\reel\\abc\\",
    "https://www.instagram.com/\nreel/abc/",
  ]) {
    assert.equal(resolveSocialReel(href), null, JSON.stringify(href));
  }
});

test("Instagram paths reject empty, encoded, malformed and extra shortcode segments", () => {
  for (const path of [
    "/",
    "/shop/",
    "/reel/",
    "/reel/abc.def/",
    "/reel/abc/extra",
    "/reel/abc//",
    "/reels/abc/",
    "/REEL/abc/",
    "/p/%61bc/",
    "/reel/abc/../def/",
    "/reel/abc/%2e%2e/def/",
    "/other/../reel/abc/",
  ]) {
    assert.equal(resolveSocialReel(`https://www.instagram.com${path}`), null, path);
  }
});

test("TikTok paths require one nonempty handle and a literal numeric video ID", () => {
  for (const path of [
    "/@/video/123",
    "/@shop/video/",
    "/@shop/video/abc",
    "/@shop/video/-123",
    "/@shop/video/123.0",
    "/@shop/video/%31%32%33",
    "/@shop/video/123/extra",
    "/@shop/video/123//",
    "/@shop/photo/123",
    "/@shop/VIDEO/123",
    "/@shop/video/123/../456",
    "/other/../@shop/video/123",
    "/@shop%2fextra/video/123",
    "/@shop%5cextra/video/123",
    "/@shop%3fextra/video/123",
    "/@shop%23extra/video/123",
    "/@shop%40extra/video/123",
    "/@%00shop/video/123",
    "/@shop%20name/video/123",
    "/@invalid%zz/video/123",
    "/@shop%3Cscript%3E/video/123",
    "/@shop%22/video/123",
    "/@shop%27/video/123",
    "/@shop%60/video/123",
    "/@shop%3Dname/video/123",
    "/@\ud800/video/123",
    "/@\udc00/video/123",
  ]) {
    assert.equal(resolveSocialReel(`https://www.tiktok.com${path}`), null, path);
  }
});

test("TikTok profiles canonicalize the supplied account without requiring a video link", () => {
  for (const host of ["tiktok.com", "www.tiktok.com", "WWW.TIKTOK.COM"]) {
    for (const suffix of ["", "/", "?lang=en#details", "/?lang=en#details"]) {
      assert.deepEqual(resolveTikTokProfile(`https://${host}/@jasonbarbaro1${suffix}`), {
        href: "https://www.tiktok.com/@jasonbarbaro1",
        handle: "jasonbarbaro1",
      });
    }
  }
  assert.deepEqual(resolveTikTokProfile("  HTTPS://TIKTOK.COM/@store.name_2/  "), {
    href: "https://www.tiktok.com/@store.name_2",
    handle: "store.name_2",
  });
});

test("TikTok profile handles use safe normalization without an unverified username restriction", () => {
  for (const handle of ["shop-name", "店铺", "%E5%BA%97%E9%93%BA", "a".repeat(25)]) {
    const decoded = decodeURIComponent(handle);
    assert.deepEqual(resolveTikTokProfile(`https://www.tiktok.com/@${handle}`), {
      href: `https://www.tiktok.com/@${encodeURIComponent(decoded)}`,
      handle: decoded,
    });
  }
});

test("TikTok profiles reject other hosts, credentials, ports and unresolved URLs", () => {
  for (const href of [
    "",
    "not a URL",
    "/@shop",
    "//www.tiktok.com/@shop",
    "http://www.tiktok.com/@shop",
    "https://www.instagram.com/@shop",
    "https://user:password@www.tiktok.com/@shop",
    "https://@www.tiktok.com/@shop",
    "https://www.tiktok.com:443/@shop",
    "https://www.tiktok.com:8443/@shop",
    "https://www.tiktok.com.example.test/@shop",
    "https://www.tiktok.com@evil.example/@shop",
    "https://www.tiktok.com./@shop",
    "https://%77ww.tiktok.com/@shop",
    "https://m.tiktok.com/@shop",
    "https://vm.tiktok.com/shop",
    "https://vt.tiktok.com/shop",
    "https://www.tiktok.com/t/shop",
    "https://www.tiktok.com\\@shop",
    "https://www.tiktok.com/\n@shop",
  ]) {
    assert.equal(resolveTikTokProfile(href), null, JSON.stringify(href));
  }
});

test("TikTok profiles require one safe handle and no additional path segments", () => {
  for (const path of [
    "/",
    "/@",
    "/@/",
    "/shop",
    "/@shop//",
    "/@shop/video/123",
    "/@shop/extra",
    "/other/../@shop",
    "/@shop/../@other",
    "/@shop/%2e%2e/@other",
    "/@shop%2fextra",
    "/@shop%5cextra",
    "/@shop%3fextra",
    "/@shop%23extra",
    "/@shop%40extra",
    "/@%00shop",
    "/@shop%20name",
    "/@invalid%zz",
    "/@shop<script>",
    "/@shop%3Cscript%3E",
    "/@shop%22",
    "/@shop%27",
    "/@shop%60",
    "/@shop%3Dname",
    "/@\ud800",
    "/@\udc00",
  ]) {
    assert.equal(resolveTikTokProfile(`https://www.tiktok.com${path}`), null, path);
  }
});
