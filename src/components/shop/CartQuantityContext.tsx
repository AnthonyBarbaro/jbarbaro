"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { SHOPIFY_CART_CHANGED_EVENT, SHOPIFY_CART_OPEN_EVENT } from "@/lib/shopify/cart-events";
import {
  applyCartQuantityPayload,
  getRemainingCartVariantQuantity,
  getVariantCartQuantity,
  type CartQuantityState,
} from "@/lib/shopify/cart-quantity-state";
import type { ShopifyCartResponse } from "@/lib/shopify/types";

type CartQuantityStatus = {
  getVariantQuantity: (merchandiseId: string) => number;
  getQuantityLimit: (merchandiseId: string) => number | null;
  getRemainingQuantity: (merchandiseId: string) => number | null;
  canAddVariant: (merchandiseId: string, quantity?: number) => boolean;
};

const unknownQuantityStatus: CartQuantityStatus = {
  getVariantQuantity: () => 0,
  getQuantityLimit: () => null,
  getRemainingQuantity: () => null,
  canAddVariant: () => true,
};

const CartQuantityContext = createContext<CartQuantityStatus>(unknownQuantityStatus);

export function CartQuantityProvider({ children }: { children: ReactNode }): ReactElement {
  const [state, setState] = useState<CartQuantityState>({ cart: null, limits: new Map() });
  const generationRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const generation = ++generationRef.current;

    function applyPayload(payload: ShopifyCartResponse): void {
      generationRef.current += 1;
      setState((previous) => applyCartQuantityPayload(previous, payload));
    }

    function handleCartPayload(event: Event): void {
      const payload =
        event instanceof CustomEvent
          ? (event.detail as ShopifyCartResponse | undefined)
          : undefined;
      if (payload && "cart" in payload) {
        applyPayload(payload);
      }
    }

    async function loadCart(): Promise<void> {
      try {
        const response = await fetch("/api/shopify/cart", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as ShopifyCartResponse | null;
        if (
          !controller.signal.aborted &&
          generation === generationRef.current &&
          response.ok &&
          payload &&
          "cart" in payload &&
          (!payload.cart || Array.isArray(payload.cart.lines))
        ) {
          applyPayload(payload);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(
            "Unable to load cart quantity limits.",
            error instanceof Error ? error.name : "Unknown error",
          );
        }
      }
    }

    window.addEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartPayload);
    window.addEventListener(SHOPIFY_CART_OPEN_EVENT, handleCartPayload);
    void loadCart();

    return () => {
      controller.abort();
      generationRef.current += 1;
      window.removeEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartPayload);
      window.removeEventListener(SHOPIFY_CART_OPEN_EVENT, handleCartPayload);
    };
  }, []);

  const value = useMemo<CartQuantityStatus>(
    () => ({
      getVariantQuantity: (merchandiseId) => getVariantCartQuantity(state.cart, merchandiseId),
      getQuantityLimit: (merchandiseId) => state.limits.get(merchandiseId) ?? null,
      getRemainingQuantity: (merchandiseId) =>
        getRemainingCartVariantQuantity(state, merchandiseId),
      canAddVariant: (merchandiseId, quantity = 1) => {
        const remaining = getRemainingCartVariantQuantity(state, merchandiseId);
        return remaining === null || remaining >= quantity;
      },
    }),
    [state],
  );

  return <CartQuantityContext.Provider value={value}>{children}</CartQuantityContext.Provider>;
}

export function useCartQuantityStatus(): CartQuantityStatus {
  return useContext(CartQuantityContext);
}
