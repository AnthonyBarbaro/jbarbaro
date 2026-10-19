import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { defaultHomePage, type SocialReelsContent } from "@/lib/cms-defaults";

function imageSources(markup: string): string[] {
  return Array.from(markup.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g), (match) => match[1]);
}

function watchLabels(markup: string): string[] {
  return Array.from(
    markup.matchAll(/<button\b[^>]*\baria-label="(Watch [^"]+)"/g),
    (match) => match[1],
  );
}

function assertNoProviderEmbed(markup: string): void {
  assert.doesNotMatch(markup, /<(?:iframe|script|blockquote)\b|instagram-media|tiktok-embed/);
}

test("social reels render safe launch content without contacting providers before an action", async (context) => {
  let fetchCalls = 0;
  context.mock.method(globalThis, "fetch", async (): Promise<Response> => {
    fetchCalls += 1;
    throw new Error("Server rendering must not request provider or poster resources.");
  });

  const reactUrl = pathToFileURL(
    createRequire(`${process.cwd()}/package.json`).resolve("react"),
  ).href;
  const imageStubUrl = "jbarbaro-test:next-image";
  const hook = registerHooks({
    resolve(specifier, resolutionContext, nextResolve) {
      return specifier === "next/image"
        ? { url: imageStubUrl, shortCircuit: true }
        : nextResolve(specifier, resolutionContext);
    },
    load(url, loadContext, nextLoad) {
      return url === imageStubUrl
        ? {
            format: "module",
            source: `import React from ${JSON.stringify(reactUrl)};
              export default function Image(props) {
                return React.createElement("img", {
                  src: props.src, alt: props.alt, sizes: props.sizes, className: props.className
                });
              }`,
            shortCircuit: true,
          }
        : nextLoad(url, loadContext);
    },
  });
  const { SocialReels } = await import("@/components/home/SocialReels").finally(() =>
    hook.deregister(),
  );

  function render(overrides: Partial<SocialReelsContent> = {}): string {
    return renderToStaticMarkup(
      createElement(SocialReels, { content: { ...defaultHomePage.socialReels, ...overrides } }),
    );
  }

  const instagramClip: SocialReelsContent["clips"][number] = {
    id: "synthetic-instagram",
    title: "Synthetic Instagram clip",
    href: "https://www.instagram.com/reel/QA_Reel_123/",
    poster: "/images/campaign/ss26/eton-overshirt-still-life-hero.webp",
    posterAlt: "Synthetic Instagram poster",
  };
  const tiktokClip: SocialReelsContent["clips"][number] = {
    id: "synthetic-tiktok",
    title: "Synthetic TikTok clip",
    href: "https://www.tiktok.com/@qa_clothier/video/1234567890123456789",
    poster: "/images/campaign/ss26/canali-coastal-tailoring-portrait-hero.webp",
    posterAlt: "Synthetic TikTok poster",
  };

  await context.test(
    "the default row shows four actual posts instead of the creator load panel",
    () => {
      const clips = defaultHomePage.socialReels.clips;
      assert.deepEqual(
        clips.map((clip) => clip.href),
        [
          "7629192451126873357",
          "7635880121559207199",
          "7628826774352432398",
          "7697859148012145934",
        ].map((id) => `https://www.tiktok.com/@jasonbarbaro1/video/${id}`),
      );

      const markup = render();
      assert.deepEqual(
        watchLabels(markup),
        clips.map((clip) => `Watch ${clip.title} on TikTok`),
      );
      assert.equal((markup.match(/aria-haspopup="dialog"/g) ?? []).length, 4);
      assert.deepEqual(
        imageSources(markup),
        clips.map((clip) => clip.poster),
      );
      assert.doesNotMatch(
        markup,
        /Load TikTok videos|Meet us on your feed|data-embed-type="creator"/,
      );
      assertNoProviderEmbed(markup);
      assert.equal(fetchCalls, 0);
    },
  );

  await context.test(
    "an explicitly empty clip list keeps the seeded profile load action without an embed",
    () => {
      const markup = render({ clips: [] });

      assert.match(markup, /href="https:\/\/www\.tiktok\.com\/@jasonbarbaro1"/);
      assert.match(markup, /href="https:\/\/www\.instagram\.com\/j\.barbaroclothiers\/"/);
      assert.match(markup, /@jasonbarbaro1/);
      assert.match(markup, /<button\b[^>]*>Load TikTok videos\b/);
      assert.doesNotMatch(markup, /aria-label="Watch /);
      assert.deepEqual(imageSources(markup), [defaultHomePage.socialReels.fallbackImage]);
      assertNoProviderEmbed(markup);
    },
  );

  await context.test("valid curated Instagram and TikTok clips expose watch buttons only", () => {
    const markup = render({ clips: [instagramClip, tiktokClip] });

    assert.match(markup, /aria-label="Watch Synthetic Instagram clip on Instagram"/);
    assert.match(markup, /aria-label="Watch Synthetic TikTok clip on TikTok"/);
    assert.equal((markup.match(/aria-haspopup="dialog"/g) ?? []).length, 2);
    assert.doesNotMatch(markup, /Load TikTok videos/);
    assert.deepEqual(imageSources(markup), [instagramClip.poster, tiktokClip.poster]);
    assertNoProviderEmbed(markup);
  });

  await context.test(
    "the first four valid clips retain mixed-platform order after unsafe clips are filtered",
    () => {
      const validClips: SocialReelsContent["clips"] = [
        { ...instagramClip, id: "valid-first", title: "First Instagram clip" },
        { ...tiktokClip, id: "valid-second", title: "Second TikTok clip" },
        { ...instagramClip, id: "valid-third", title: "Third Instagram clip" },
        { ...tiktokClip, id: "valid-fourth", title: "Fourth TikTok clip" },
        { ...tiktokClip, id: "valid-fifth", title: "Fifth TikTok clip" },
      ].map((clip, index) => ({ ...clip, poster: `/images/qa-reel-${index + 1}.webp` }));
      const markup = render({
        clips: [
          {
            ...instagramClip,
            id: "unsafe-first",
            title: "Unsafe first clip",
            href: "javascript:alert(1)",
          },
          ...validClips.slice(0, 2),
          {
            ...tiktokClip,
            id: "unsafe-middle",
            title: "Unsafe middle clip",
            href: "https://www.tiktok.com.evil.example/@qa/video/123",
          },
          ...validClips.slice(2),
        ],
      });

      assert.deepEqual(watchLabels(markup), [
        "Watch First Instagram clip on Instagram",
        "Watch Second TikTok clip on TikTok",
        "Watch Third Instagram clip on Instagram",
        "Watch Fourth TikTok clip on TikTok",
      ]);
      assert.deepEqual(
        imageSources(markup),
        validClips.slice(0, 4).map((clip) => clip.poster),
      );
      assert.equal((markup.match(/aria-haspopup="dialog"/g) ?? []).length, 4);
      assert.doesNotMatch(
        markup,
        /Fifth TikTok clip|qa-reel-5|Unsafe first clip|Unsafe middle clip|Load TikTok videos/,
      );
      assertNoProviderEmbed(markup);
    },
  );

  await context.test("unsafe and spoofed clips are excluded while valid clips remain", () => {
    const markup = render({
      clips: [
        instagramClip,
        {
          ...instagramClip,
          id: "rejected-script",
          title: "Rejected script clip",
          href: "javascript:alert(1)",
        },
        {
          ...tiktokClip,
          id: "rejected-spoof",
          title: "Rejected spoof clip",
          href: "https://www.tiktok.com.evil.example/@qa/video/123",
        },
      ],
    });

    assert.equal((markup.match(/aria-haspopup="dialog"/g) ?? []).length, 1);
    assert.match(markup, /Watch Synthetic Instagram clip on Instagram/);
    assert.doesNotMatch(
      markup,
      /Rejected script clip|Rejected spoof clip|javascript:|evil\.example/,
    );
    assert.deepEqual(imageSources(markup), [instagramClip.poster]);
    assertNoProviderEmbed(markup);
  });

  await context.test("an all-invalid clip list returns to the honest profile fallback", () => {
    const markup = render({
      clips: [{ ...instagramClip, href: "https://instagram.com.evil.example/reel/QA/" }],
    });

    assert.doesNotMatch(markup, /aria-label="Watch |Synthetic Instagram clip|evil\.example/);
    assert.match(markup, /Load TikTok videos/);
    assert.deepEqual(imageSources(markup), [defaultHomePage.socialReels.fallbackImage]);
    assertNoProviderEmbed(markup);
  });

  await context.test("unsafe profile URLs do not become links or provider load controls", () => {
    const markup = render({
      instagramHref: "https://www.instagram.com@evil.example/profile/",
      tiktokHref: "https://www.tiktok.com.evil.example/@qa",
      clips: [],
    });

    assert.doesNotMatch(markup, /<a\b|evil\.example|Load TikTok videos|@qa/);
    assert.deepEqual(imageSources(markup), [defaultHomePage.socialReels.fallbackImage]);
    assertNoProviderEmbed(markup);
  });

  await context.test(
    "external posters and editorial images use a local fallback without requests",
    () => {
      for (const poster of [
        "https://untrusted.example/track.jpg",
        "//untrusted.example/track.jpg",
        "/images/../outside.jpg",
      ]) {
        const clipMarkup = render({ clips: [{ ...instagramClip, poster }] });
        const editorialMarkup = render({ clips: [], fallbackImage: poster });

        for (const markup of [clipMarkup, editorialMarkup]) {
          assert.deepEqual(imageSources(markup), [defaultHomePage.socialReels.fallbackImage]);
          assert.doesNotMatch(markup, /untrusted\.example|outside\.jpg/);
          assertNoProviderEmbed(markup);
        }
      }
      assert.equal(fetchCalls, 0);
    },
  );

  assert.equal(fetchCalls, 0);
});
