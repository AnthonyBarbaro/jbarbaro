import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { AccessibilityProvider } from "@/components/ui/AccessibilityProvider";

test("footer hides newsletter enrollment while retaining shopping and appointment links", () => {
  const markup = renderToStaticMarkup(
    createElement(AccessibilityProvider, null, createElement(SiteFooter)),
  );

  assert.doesNotMatch(markup, /<form\b|type="email"|newsletter|verified reviews/i);
  assert.doesNotMatch(markup, /Based on|\/ 5\.0|Client Trust/);
  assert.match(markup, /Help &amp; Policies/);
  assert.match(markup, /href="\/shop"/);
  assert.match(markup, /href="\/schedule-appointment"/);
  assert.match(markup, /aria-controls="accessibility-widget-panel"/);
});
