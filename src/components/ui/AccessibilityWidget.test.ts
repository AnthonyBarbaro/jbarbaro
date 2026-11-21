import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AccessibilityNavButton } from "@/components/ui/AccessibilityNavButton";
import { AccessibilityProvider } from "@/components/ui/AccessibilityProvider";
import { AccessibilityWidget } from "@/components/ui/AccessibilityWidget";

function renderWidget(placement: "floating" | "navigation"): string {
  return renderToStaticMarkup(
    createElement(
      AccessibilityProvider,
      null,
      createElement(AccessibilityNavButton),
      createElement(AccessibilityWidget, { placement }),
    ),
  );
}

test("navigation-only placement controls a named, initially hidden panel", () => {
  const markup = renderWidget("navigation");
  assert.doesNotMatch(markup, /class="accessibility-floating-button"/);
  assert.match(markup, /aria-label="Accessibility options"/);
  assert.match(markup, /aria-controls="accessibility-widget-panel"/);
  assert.match(markup, /aria-expanded="false"/);
  assert.match(markup, /<section[^>]*id="accessibility-widget-panel"[^>]*hidden=""/);
  assert.doesNotMatch(markup, /aria-modal|<dialog/);
  assert.match(markup, /aria-labelledby="accessibility-title"/);
  assert.match(markup, /aria-describedby="accessibility-description"/);
  assert.match(markup, /href="\/contact-us"/);
  assert.match(markup, /href="#main-content"/);
  assert.match(markup, /href="#site-footer"/);
  assert.match(markup, /href="https:\/\/barbaro\.tech"[^>]*>Powered by Barbaro Tech<\/a>/);
});

test("floating placement also offers navigation recovery and a hide preference", () => {
  const markup = renderWidget("floating");
  assert.match(markup, /class="accessibility-floating-button"/);
  assert.match(markup, /Move button to navigation/);
  assert.match(markup, /Reset display preferences/);
  assert.equal((markup.match(/type="checkbox"/g) ?? []).length, 14);
});
