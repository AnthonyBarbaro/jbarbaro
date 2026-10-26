import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HeaderProductSearch } from "@/components/layout/HeaderProductSearch";

test("empty product search labels its field without referencing absent results", () => {
  const markup = renderToStaticMarkup(createElement(HeaderProductSearch));
  const input = markup.match(/<input\b[^>]*>/)?.[0];

  assert.ok(input);
  assert.match(input, /aria-label="Search products"/);
  assert.doesNotMatch(input, /aria-controls=/);
  const statusId = input.match(/aria-describedby="([^"]+)"/)?.[1];
  assert.ok(statusId);
  assert.ok(markup.includes(`id="${statusId}"`));
});
