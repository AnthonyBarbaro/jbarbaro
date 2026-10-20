import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TikTokReelPlayer } from "@/components/home/TikTokReelPlayer";

test("TikTok requests autoplay with sound enabled even for a previously muted source", () => {
  for (const query of ["", "?muted=1&autoplay=0", "?controls=1&muted=0"]) {
    const markup = renderToStaticMarkup(
      createElement(TikTokReelPlayer, {
        src: `https://www.tiktok.com/player/v1/1234567890123456789${query}`,
        title: "Synthetic TikTok clip",
      }),
    );
    const source = markup.match(/<iframe\b[^>]*\bsrc="([^"]+)"/)?.[1];
    assert.ok(source);
    const url = new URL(source.replaceAll("&amp;", "&"));

    assert.equal(url.searchParams.get("autoplay"), "1");
    assert.equal(url.searchParams.get("muted"), "0");
    assert.match(markup, /allow="autoplay;/);
    assert.doesNotMatch(markup, /Turn sound on|Sound on/);
  }
});
