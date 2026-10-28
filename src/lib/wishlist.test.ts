import assert from "node:assert/strict";
import test from "node:test";

import { readWishlistItems, WISHLIST_STORAGE_KEY, type WishlistItem } from "@/lib/wishlist";

test("saved wishlist names update without changing stored purchase identities", (context) => {
  const item: WishlistItem = {
    id: "gid://shopify/Product/title-test",
    handle: "canali-sport-coat-cf00142-399",
    title: "Canali Sport Coat CF00142/399",
    vendor: "Canali",
    productType: "Sport Coat",
    priceLabel: "$100.00",
    image: null,
  };
  const stored = JSON.stringify([item]);
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string): string => {
          assert.equal(key, WISHLIST_STORAGE_KEY);
          return stored;
        },
        setItem: (): never => {
          throw new Error("Reading should not rewrite browser storage.");
        },
      },
    },
  });
  context.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  });

  const [result] = readWishlistItems();
  assert.deepEqual(result, { ...item, title: "Canali Windowpane Sport Coat — Navy" });
  assert.equal(item.title, "Canali Sport Coat CF00142/399");
});
