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

test("navigation-only placement keeps a named trigger and labelled dialog", () => {
  const markup = renderWidget("navigation");
  assert.doesNotMatch(markup, /class="accessibility-floating-button"/);
  assert.match(markup, /aria-label="Accessibility options"/);
  assert.match(markup, /aria-haspopup="dialog"/);
  assert.match(markup, /<dialog[^>]*id="accessibility-widget-panel"/);
  assert.match(markup, /aria-labelledby="accessibility-title"/);
  assert.match(markup, /aria-describedby="accessibility-description"/);
  assert.match(markup, /href="\/contact-us"/);
});

test("floating placement also offers navigation recovery and a hide preference", () => {
  const markup = renderWidget("floating");
  assert.match(markup, /class="accessibility-floating-button"/);
  assert.match(markup, /Move button to navigation/);
  assert.match(markup, /Reset display preferences/);
  assert.equal((markup.match(/type="checkbox"/g) ?? []).length, 13);
});
