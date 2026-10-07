import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";

import { getRichTextFallback } from "@/lib/shopify/product-description";
import type { ShopifyProduct } from "@/lib/shopify/types";

type CachedCallback = (...args: unknown[]) => Promise<unknown>;

async function loadServerModule<T>(load: () => Promise<T>): Promise<T> {
  const hook = registerHooks({
    resolve(specifier, context, nextResolve) {
      return nextResolve(
        specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier,
        context,
      );
    },
  });

  try {
    return await load();
  } finally {
    hook.deregister();
  }
}

test("plain-text descriptions escape markup, entities and quotes before adding paragraphs", () => {
  assert.equal(
    getRichTextFallback('A & B <img src=x onerror="alert(1)">\n\nMen\'s "fit" > style'),
    "<p>A &amp; B &lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p><p>Men&#39;s &quot;fit&quot; &gt; style</p>",
  );
  assert.equal(getRichTextFallback("&lt;script&gt;"), "<p>&amp;lt;script&amp;gt;</p>");
});

test("plain-text descriptions preserve paragraphs and collapse inline whitespace", () => {
  assert.equal(
    getRichTextFallback("  First\n line. \n\n \nSecond\tparagraph.  "),
    "<p>First line.</p><p>Second paragraph.</p>",
  );
  assert.equal(getRichTextFallback(" \n\n \t "), "");
  assert.equal(getRichTextFallback(""), "");
});

test("product HTML preserves useful formatting while removing executable and tracking content", async (context) => {
  const { sanitizeProductDescriptionHtml } = await loadServerModule(
    () => import("@/lib/shopify/product-description.server"),
  );

  await context.test("preserves headings, emphasis, lists and table structure", () => {
    const html =
      '<h2>Fabric &amp; care</h2><p><strong>Wool</strong> with <em>silk</em>.</p><ol start="3"><li>Dry clean</li></ol><table><caption>Sizes</caption><thead><tr><th scope="col" colspan="2">Chest</th></tr></thead><tbody><tr><td rowspan="2">38</td><td>40</td></tr></tbody></table>';

    assert.equal(sanitizeProductDescriptionHtml(html), html);
    assert.equal(
      sanitizeProductDescriptionHtml("<p>One<br>Two<hr>Three</p>"),
      "<p>One<br />Two</p><hr />Three<p></p>",
    );
  });

  await context.test("preserves safe absolute, contact, relative and fragment links", () => {
    for (const href of [
      "https://example.test/care",
      "http://example.test/care",
      "mailto:hello@example.test",
      "tel:+15551234567",
      "/care?x=1&amp;y=2#fabric",
      "../care",
      "#care",
    ]) {
      const html = `<a href="${href}" title="Care &amp; fit">Details</a>`;
      assert.equal(sanitizeProductDescriptionHtml(html), html);
    }
  });

  await context.test("removes handlers, CSS, tracking, new-window and DOM attributes", () => {
    assert.equal(
      sanitizeProductDescriptionHtml(
        '<p id="checkout" class="hidden" style="display:none" onclick="alert(1)" data-secret="x"><a href="https://example.test/care" title="Care" onmouseover="alert(1)" ping="https://tracking.example.test" target="_blank" rel="opener">Care</a></p>',
      ),
      '<p><a href="https://example.test/care" title="Care">Care</a></p>',
    );
  });

  await context.test(
    "preserves approved product and size-chart images with safe attributes",
    () => {
      for (const src of [
        "https://cdn.shopify.com/s/files/1/test/size-chart.jpg?v=1&amp;width=600",
        "https://jasonbarbaro.com/images/size-chart.jpg",
        "https://www.jasonbarbaro.com/images/detail.jpg",
        "/images/campaign/ss26/detail.jpg",
      ]) {
        assert.equal(
          sanitizeProductDescriptionHtml(
            `<img src="${src}" alt="Fabric &amp; fit" width="600" height="400" onerror="alert(1)" srcset="https://tracking.example.test/pixel 2x" style="display:none" loading="lazy">`,
          ),
          `<img src="${src}" alt="Fabric &amp; fit" width="600" height="400" />`,
        );
      }
    },
  );

  for (const src of [
    "javascript:alert(1)",
    "jav&#x61;script:alert(1)",
    "data:image/svg+xml,<svg onload=alert(1)></svg>",
    "http://cdn.shopify.com/size-chart.jpg",
    "https://tracking.example.test/pixel",
    "https://cdn.shopify.com.tracking.example.test/pixel",
    "https://cdn.shopify.com@tracking.example.test/pixel",
    "https://attacker@cdn.shopify.com/pixel",
    "//cdn.shopify.com/size-chart.jpg",
    "\\\\cdn.shopify.com/size-chart.jpg",
    "images/size-chart.jpg",
    "/tracking/pixel",
    "/images/../tracking/pixel",
    "/images/%2e%2e/tracking/pixel",
    "/\\tracking.example.test/pixel",
    "",
  ]) {
    await context.test(`removes unapproved image source ${JSON.stringify(src)}`, () => {
      assert.equal(
        sanitizeProductDescriptionHtml(`<p>Care<img src="${src}" alt="Details"></p>`),
        "<p>Care</p>",
      );
    });
  }

  for (const href of [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "jav&#x61;script:alert(1)",
    "javascript&#58;alert(1)",
    "&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://example.test/file",
    "//tracking.example.test/care",
    "\\\\tracking.example.test/care",
  ]) {
    await context.test(`removes forbidden href ${JSON.stringify(href)}`, () => {
      assert.equal(sanitizeProductDescriptionHtml(`<a href="${href}">Care</a>`), "<a>Care</a>");
    });
  }

  await context.test("removes unapproved images, forms and entire active-content subtrees", () => {
    assert.equal(
      sanitizeProductDescriptionHtml(
        '<p>Safe</p><img src="https://tracking.example.test/pixel" alt="Fabric"><script>alert(1)</script><style>body{display:none}</style><iframe src="https://example.test"><p>Frame</p></iframe><svg><a href="javascript:alert(1)"><text>SVG</text></a></svg><math><mi>Math</mi></math><object data="data:text/html,attack">Object</object><template><p>Template</p></template><textarea>&lt;img src=x onerror=alert(1)&gt;</textarea><xmp><img src=x onerror=alert(1)></xmp><form action="https://tracking.example.test"><input name="password"><button>Form label</button></form><p>Still safe</p>',
      ),
      "<p>Safe</p>Form label<p>Still safe</p>",
    );
  });

  await context.test("repairs malformed HTML and keeps encoded markup as text", () => {
    assert.equal(sanitizeProductDescriptionHtml("<p><strong>Wool"), "<p><strong>Wool</strong></p>");
    assert.equal(
      sanitizeProductDescriptionHtml("<p>&lt;img src=x onerror=alert(1)&gt; &amp; care</p>"),
      "<p>&lt;img src=x onerror=alert(1)&gt; &amp; care</p>",
    );
    assert.equal(sanitizeProductDescriptionHtml(""), "");
  });

  await context.test("sanitizing already-safe HTML is stable", () => {
    const sanitized = sanitizeProductDescriptionHtml(
      '<div style="color:red"><p>Care &amp; fit <a href="/care">details</a></p></div>',
    );

    assert.equal(sanitizeProductDescriptionHtml(sanitized), sanitized);
  });
});

test("Shopify product boundaries sanitize both imported and previously cached descriptions", async (context) => {
  const product: ShopifyProduct = {
    id: "gid://shopify/Product/unit-test",
    handle: "unit-test-shirt",
    title: "Test shirt",
    createdAt: "2026-01-01T00:00:00Z",
    description: "Plain-text care information",
    descriptionHtml: '<p onclick="alert(1)">Care</p><img src="https://tracking.example.test">',
    vendor: "Unit Test",
    productType: "Shirt",
    tags: [],
    reviewSummary: null,
    featuredImage: null,
    images: [],
    collections: [],
    priceRange: {
      minVariantPrice: { amount: "50", currencyCode: "USD" },
      maxVariantPrice: { amount: "50", currencyCode: "USD" },
    },
    variants: [],
  };
  let cachedProduct: ShopifyProduct | null = product;
  const cacheModule = createRequire(`${process.cwd()}/package.json`)("next/cache") as {
    unstable_cache: (callback: CachedCallback, keyParts?: string[]) => CachedCallback;
  };

  context.mock.method(
    cacheModule,
    "unstable_cache",
    (callback: CachedCallback, keyParts?: string[]): CachedCallback => {
      return keyParts?.includes("shopify-product") ? async () => cachedProduct : callback;
    },
  );

  const { getAllShopProducts, getShopProduct } = await loadServerModule(
    () => import("@/lib/shopify/products"),
  );

  await context.test(
    "sanitizes stale cached PDP HTML without mutating the cached object",
    async () => {
      const result = await getShopProduct(product.handle);

      assert.equal(result?.descriptionHtml, "<p>Care</p>");
      assert.equal(result?.description, product.description);
      assert.notEqual(result, product);
      assert.match(product.descriptionHtml, /onclick=/);
    },
  );

  await context.test("preserves a missing cached product", async () => {
    cachedProduct = null;
    assert.equal(await getShopProduct("missing-product"), null);
  });

  await context.test(
    "sanitizes newly imported product HTML during normalization",
    async (subcontext) => {
      const envKeys = [
        "SHOPIFY_STORE_DOMAIN",
        "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
        "SHOPIFY_STOREFRONT_API_VERSION",
      ] as const;
      const originalEnv = envKeys.map((key) => [key, process.env[key]] as const);
      process.env.SHOPIFY_STORE_DOMAIN = "unit-test.example.test";
      process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = "unit-test-token";
      process.env.SHOPIFY_STOREFRONT_API_VERSION = "2026-01";

      subcontext.mock.method(
        globalThis,
        "fetch",
        async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
          assert.equal(input, "https://unit-test.example.test/api/2026-01/graphql.json");
          return Response.json({
            data: {
              products: {
                nodes: [
                  {
                    ...product,
                    images: { nodes: [] },
                    collections: { nodes: [] },
                    variants: { nodes: [] },
                    reviewRating: null,
                    reviewCount: null,
                  },
                ],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
            },
          });
        },
      );

      try {
        const results = await getAllShopProducts();
        assert.equal(results.length, 1);
        assert.equal(results[0].descriptionHtml, "<p>Care</p>");
        assert.equal(results[0].description, product.description);
      } finally {
        for (const [key, value] of originalEnv) {
          if (value === undefined) {
            delete process.env[key];
          } else {
            process.env[key] = value;
          }
        }
      }
    },
  );
});
