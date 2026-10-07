import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SeoJsonLd } from "@/components/SeoJsonLd";

test("JSON-LD escapes closing script tags and preserves the original structured data", () => {
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: 'Wool & silk "shirt"',
    description: "</script><script>globalThis.__descriptionExecuted = true</script><img src=x>",
  };

  for (const data of [product, [product]]) {
    const markup = renderToStaticMarkup(createElement(SeoJsonLd, { data }));
    const openingTag = '<script type="application/ld+json">';
    const closingTag = "</script>";

    assert.ok(markup.startsWith(openingTag));
    assert.ok(markup.endsWith(closingTag));
    const scriptText = markup.slice(openingTag.length, -closingTag.length);

    assert.ok(!scriptText.includes("<"));
    assert.ok(scriptText.includes("\\u003c/script>"));
    assert.deepEqual(JSON.parse(scriptText), data);
  }
});
