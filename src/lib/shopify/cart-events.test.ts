import assert from "node:assert/strict";
import test from "node:test";

import {
  notifyShopifyCartChanged,
  SHOPIFY_CART_CHANGED_EVENT,
  SHOPIFY_CART_INVALIDATED_EVENT,
  SHOPIFY_CART_SYNC_KEY,
  startShopifyCartSynchronization,
} from "@/lib/shopify/cart-events";
import {
  requestShopifyCartMutation,
  isShopifyCartMutationPending,
} from "@/lib/shopify/cart-request";

test("cart synchronization exchanges invalidation tokens and cleans up browser listeners", async (context) => {
  const storageWrites: Array<[string, string]> = [];
  const channelMessages: unknown[] = [];
  const channels: FakeChannel[] = [];
  let storageDisabled = false;
  let broadcastDisabled = false;
  const windowTarget = Object.assign(new EventTarget(), {
    localStorage: {
      setItem(key: string, value: string): void {
        if (storageDisabled) throw new Error("Synthetic unavailable storage");
        storageWrites.push([key, value]);
      },
    },
  });
  const documentTarget = Object.assign(new EventTarget(), { visibilityState: "visible" });
  class FakeChannel {
    onmessage: ((event: { data: unknown }) => void) | null = null;
    closed = false;
    constructor(readonly name: string) {
      if (broadcastDisabled) throw new Error("Synthetic unavailable broadcast");
      channels.push(this);
    }
    postMessage(data: unknown): void {
      channelMessages.push(data);
      for (const channel of channels) {
        if (channel !== this && !channel.closed) channel.onmessage?.({ data });
      }
    }
    close(): void {
      this.closed = true;
    }
  }
  for (const [key, value] of [
    ["window", windowTarget],
    ["document", documentTarget],
    ["BroadcastChannel", FakeChannel],
  ] as const) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    context.after(() => {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  let invalidations = 0;
  let localChanges = 0;
  windowTarget.addEventListener(SHOPIFY_CART_INVALIDATED_EVENT, () => {
    invalidations += 1;
  });
  windowTarget.addEventListener(SHOPIFY_CART_CHANGED_EVENT, () => {
    localChanges += 1;
  });
  const stop = startShopifyCartSynchronization();
  const remote = new FakeChannel(SHOPIFY_CART_SYNC_KEY);
  const storageEvent = (token: string): void => {
    windowTarget.dispatchEvent(
      Object.assign(new Event("storage"), { key: SHOPIFY_CART_SYNC_KEY, newValue: token }),
    );
  };

  await context.test(
    "successful and uncertain changes broadcast no cart payload or checkout credentials",
    () => {
      for (const confirmed of [true, false]) {
        notifyShopifyCartChanged({
          configured: true,
          confirmed,
          warnings: [],
          userErrors: [],
          message: "Synthetic private cart and checkout URL must stay local",
        });
      }
      assert.equal(localChanges, 2);
      assert.equal(storageWrites.length, 2);
      assert.equal(channelMessages.length, 2);
      for (const [key, value] of storageWrites) {
        assert.equal(key, SHOPIFY_CART_SYNC_KEY);
        assert.match(value, /^v1:\d+:[a-z0-9]+$/);
        assert.doesNotMatch(value, /cart|checkout|private|http/);
      }
      assert.equal(invalidations, 0, "the sending document must not invalidate itself");
    },
  );

  await context.test("read results do not rebroadcast and cause refresh loops", () => {
    notifyShopifyCartChanged({
      configured: true,
      cart: null,
      warnings: [],
      userErrors: [],
      backgroundRefresh: true,
    });
    assert.equal(localChanges, 3);
    assert.equal(storageWrites.length, 2);
    assert.equal(channelMessages.length, 2);
  });

  await context.test("remote broadcast and storage signals deduplicate the same token", () => {
    remote.postMessage("v1:remote:one");
    storageEvent("v1:remote:one");
    assert.equal(invalidations, 1);
    storageEvent("v1:remote:two");
    assert.equal(invalidations, 2);
    remote.postMessage({ checkoutUrl: "https://checkout.example.test/private" });
    storageEvent("unexpected-payload");
    assert.equal(invalidations, 2);
  });

  await context.test(
    "focus and visibility restore freshness without requiring browser storage",
    () => {
      storageDisabled = true;
      broadcastDisabled = true;
      assert.doesNotThrow(() =>
        notifyShopifyCartChanged({
          configured: true,
          confirmed: true,
          warnings: [],
          userErrors: [],
        }),
      );
      const before = invalidations;
      windowTarget.dispatchEvent(new Event("focus"));
      documentTarget.visibilityState = "hidden";
      documentTarget.dispatchEvent(new Event("visibilitychange"));
      assert.equal(invalidations, before + 1);
      documentTarget.visibilityState = "visible";
      documentTarget.dispatchEvent(new Event("visibilitychange"));
      assert.equal(invalidations, before + 2);
    },
  );

  await context.test(
    "mutation lifecycle leaves no pending lock after a lost response",
    async () => {
      await assert.rejects(
        requestShopifyCartMutation(async (): Promise<void> => {
          assert.equal(isShopifyCartMutationPending(), true);
          throw new Error("Synthetic response lost");
        }),
      );
      assert.equal(isShopifyCartMutationPending(), false);
      assert.equal(await requestShopifyCartMutation(async () => "next-change"), "next-change");
    },
  );

  await context.test("unmount removes focus/storage listeners and closes its channel", () => {
    stop();
    const before = invalidations;
    storageEvent("v1:remote:after-unmount");
    windowTarget.dispatchEvent(new Event("focus"));
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    assert.equal(invalidations, before);
    assert.equal(channels[0].closed, true);
    remote.close();
  });
});
