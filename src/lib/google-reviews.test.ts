import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

type CachedCallback = (...args: unknown[]) => Promise<unknown>;
type ProviderMode = "unavailable" | "invalid-rating" | "network-error" | "live";

test("store reviews show provider evidence and never fall back to stored review claims", async (context) => {
  const envKeys = [
    "GOOGLE_PLACES_API_KEY",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "GOOGLE_PARTRIDGE_CREEK_PLACE_ID",
    "GOOGLE_GREAT_LAKES_PLACE_ID",
  ];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  context.after(() => {
    for (const key of envKeys) {
      const previous = previousEnv[key];
      if (previous === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous;
      }
    }
  });
  Object.assign(process.env, {
    GOOGLE_PLACES_API_KEY: "fixture-places-key",
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "",
    GOOGLE_PARTRIDGE_CREEK_PLACE_ID: "qa-partridge",
    GOOGLE_GREAT_LAKES_PLACE_ID: "qa-great-lakes",
  });

  const cacheModule = createRequire(`${process.cwd()}/package.json`)("next/cache") as {
    unstable_cache: (callback: CachedCallback) => CachedCallback;
  };
  context.mock.method(cacheModule, "unstable_cache", (callback: CachedCallback) => callback);
  const loggedErrors: unknown[][] = [];
  context.mock.method(console, "error", (...args: unknown[]) => loggedErrors.push(args));
  let mode: ProviderMode = "unavailable";
  context.mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request): Promise<Response> => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      assert.equal(url.origin, "https://places.googleapis.com");

      if (mode === "network-error") {
        throw new Error("Provider failure with fixture-places-key must stay private");
      }
      if (mode === "unavailable") {
        return new Response(null, { status: 503 });
      }
      const isPartridge = url.pathname.endsWith("/qa-partridge");
      return Response.json({
        id: isPartridge ? "qa-partridge" : "qa-great-lakes",
        displayName: { text: isPartridge ? "QA Partridge" : "QA Great Lakes" },
        rating: mode === "invalid-rating" ? 6 : isPartridge ? 4.2 : 4.6,
        userRatingCount: isPartridge ? 10 : 20,
        googleMapsUri: "https://maps.google.com/?q=QA",
        reviews: [
          {
            name: isPartridge ? "qa-review-one" : "qa-review-two",
            rating: 5,
            text: { text: "Synthetic provider review." },
            authorAttribution: { displayName: "QA reviewer" },
            publishTime: "2026-01-01T00:00:00Z",
          },
        ],
      });
    },
  );

  const hook = registerHooks({
    resolve(specifier, resolutionContext, nextResolve) {
      return nextResolve(
        specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier,
        resolutionContext,
      );
    },
  });
  const [{ getStoreReviewSnapshot }, { default: ReviewsPage, metadata }] = await Promise.all([
    import("@/lib/google-reviews"),
    import("@/app/reviews/page"),
  ]).finally(() => hook.deregister());

  for (const providerMode of ["unavailable", "invalid-rating", "network-error"] as const) {
    await context.test(
      `${providerMode} produces an empty fallback without stored claims`,
      async () => {
        mode = providerMode;
        assert.deepEqual(await getStoreReviewSnapshot(), {
          source: "fallback",
          ratingValue: null,
          reviewCount: 0,
          reviews: [],
          locations: [],
          attributionLabel: "",
        });
      },
    );
  }

  await context.test(
    "fallback page links to Google without ratings, quotes or configuration copy",
    async () => {
      mode = "unavailable";
      const markup = renderToStaticMarkup(await ReviewsPage());

      assert.match(markup, /Read Reviews on Google/);
      assert.match(markup, /View Google Reviews/);
      assert.match(markup, /https:\/\/www\.google\.com\/search\?q=/);
      assert.doesNotMatch(
        markup,
        /<blockquote|Google Store Rating|API credentials|Places API|Based on/,
      );
      assert.doesNotMatch(String(metadata.description), /verified|rated 4\.7/i);
    },
  );

  await context.test(
    "live provider ratings and quotes remain available with attribution",
    async () => {
      mode = "live";
      const snapshot = await getStoreReviewSnapshot();
      assert.equal(snapshot.source, "google");
      assert.equal(snapshot.ratingValue, 4.5);
      assert.equal(snapshot.reviewCount, 30);
      assert.equal(snapshot.locations.length, 2);
      assert.equal(snapshot.reviews.length, 2);

      const markup = renderToStaticMarkup(await ReviewsPage());
      assert.match(markup, /Google Store Rating/);
      assert.match(markup, /Synthetic provider review/);
      assert.match(markup, /Reviews provided by Google/);
    },
  );

  assert.ok(loggedErrors.length > 0);
  assert.doesNotMatch(JSON.stringify(loggedErrors), /fixture-places-key|must stay private/);
});
