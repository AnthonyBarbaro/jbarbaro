import assert from "node:assert/strict";
import test from "node:test";

import {
  isShopifyCartMutationPending,
  requestShopifyCartMutation,
} from "@/lib/shopify/cart-request";

test("rejects overlapping cart writes without sending a second operation", async () => {
  let finish: (() => void) | undefined;
  const pending = requestShopifyCartMutation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  let secondRequests = 0;

  assert.equal(isShopifyCartMutationPending(), true);
  await assert.rejects(
    requestShopifyCartMutation(async () => {
      secondRequests += 1;
    }),
    /Your bag is updating/,
  );
  assert.equal(secondRequests, 0);
  finish?.();
  await pending;
  assert.equal(isShopifyCartMutationPending(), false);
});

test("releases the cart write guard after failure without automatically retrying", async () => {
  let requests = 0;

  await assert.rejects(
    requestShopifyCartMutation(async () => {
      requests += 1;
      throw new Error("Connection lost");
    }),
    /Connection lost/,
  );
  assert.equal(requests, 1);
  assert.equal(isShopifyCartMutationPending(), false);
  assert.equal(await requestShopifyCartMutation(async () => "refreshed"), "refreshed");
});
