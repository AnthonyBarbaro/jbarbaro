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

import {
  SHOPIFY_CART_CHANGED_EVENT,
  SHOPIFY_CART_OPEN_EVENT,
  SHOPIFY_CART_INVALIDATED_EVENT,
  SHOPIFY_CART_REVALIDATION_FAILED_EVENT,
  SHOPIFY_CART_MUTATION_STARTED_EVENT,
  SHOPIFY_CART_MUTATION_FINISHED_EVENT,
  notifyShopifyCartChanged,
  startShopifyCartSynchronization,
  type ShopifyCartChangePayload,
} from "@/lib/shopify/cart-events";
import {
  applyCartQuantityPayload,
  getCartVariantQuantityLimit,
  getRemainingCartVariantQuantity,
  getVariantCartQuantity,
  type CartQuantityState,
} from "@/lib/shopify/cart-quantity-state";
import { isShopifyCartMutationPending } from "@/lib/shopify/cart-request";
import type { ShopifyCartResponse, ShopifyVariantInventory } from "@/lib/shopify/types";

type CartQuantityStatus = {
  isReady: boolean;
  isLoading: boolean;
  getVariantQuantity: (merchandiseId: string) => number;
  getQuantityLimit: (merchandiseId: string, inventory?: ShopifyVariantInventory) => number | null;
  getRemainingQuantity: (
    merchandiseId: string,
    inventory?: ShopifyVariantInventory,
  ) => number | null;
  canAddVariant: (
    merchandiseId: string,
    quantity?: number,
    inventory?: ShopifyVariantInventory,
  ) => boolean;
};

const unknownQuantityStatus: CartQuantityStatus = {
  isReady: false,
  isLoading: true,
  getVariantQuantity: () => 0,
  getQuantityLimit: () => null,
  getRemainingQuantity: () => null,
  canAddVariant: () => true,
};

const CartQuantityContext = createContext<CartQuantityStatus>(unknownQuantityStatus);

export function CartQuantityProvider({ children }: { children: ReactNode }): ReactElement {
  const [state, setState] = useState<CartQuantityState>({ cart: null, limits: new Map() });
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const generationRef = useRef(0);

  useEffect(() => {
    let controller: AbortController | null = null;
    let timer: number | undefined;
    let mounted = true;
    let queued = false;
    let ready = false;
    let readyBeforeMutation = false;

    function cancelRead(): void {
      generationRef.current += 1;
      controller?.abort();
      window.clearTimeout(timer);
    }

    function applyPayload(payload: ShopifyCartChangePayload): void {
      cancelRead();
      setState((previous) => applyCartQuantityPayload(previous, payload));
      ready = "cart" in payload;
      setIsReady(ready);
      setIsLoading(false);
      if (payload.confirmed === true && !payload.backgroundRefresh) {
        timer = window.setTimeout(() => void loadCart(), 40);
      }
    }

    function handleCartPayload(event: Event): void {
      const payload =
        event instanceof CustomEvent
          ? (event.detail as ShopifyCartChangePayload | undefined)
          : undefined;
      if (payload && ("cart" in payload || payload.confirmed === false)) {
        applyPayload(payload);
      }
    }

    async function loadCart(): Promise<void> {
      if (isShopifyCartMutationPending()) {
        queued = true;
        return;
      }
      queued = false;
      controller = new AbortController();
      const currentController = controller;
      const generation = ++generationRef.current;
      setIsLoading(true);
      try {
        const response = await fetch("/api/shopify/cart", {
          cache: "no-store",
          signal: currentController.signal,
        });
        const payload = (await response.json().catch(() => null)) as ShopifyCartResponse | null;
        if (
          mounted &&
          !currentController.signal.aborted &&
          generation === generationRef.current &&
          !isShopifyCartMutationPending() &&
          response.ok &&
          payload &&
          "cart" in payload &&
          (!payload.cart || Array.isArray(payload.cart.lines))
        ) {
          notifyShopifyCartChanged({ ...payload, backgroundRefresh: true }, { broadcast: false });
        }
      } catch (error) {
        if (mounted && !currentController.signal.aborted && generation === generationRef.current) {
          console.error(
            "Unable to load cart quantity limits.",
            error instanceof Error ? error.name : "Unknown error",
          );
        }
      } finally {
        if (mounted && !currentController.signal.aborted && generation === generationRef.current) {
          setIsLoading(false);
          window.dispatchEvent(new Event(SHOPIFY_CART_REVALIDATION_FAILED_EVENT));
        }
      }
    }

    function scheduleRefresh(): void {
      cancelRead();
      ready = false;
      setIsReady(false);
      setIsLoading(true);
      queued = true;
      if (!isShopifyCartMutationPending()) {
        timer = window.setTimeout(() => void loadCart(), 40);
      }
    }

    function handleMutationStarted(): void {
      readyBeforeMutation = ready;
      cancelRead();
      ready = false;
      setIsReady(false);
    }

    function handleMutationFinished(): void {
      if (queued) scheduleRefresh();
      else {
        ready = readyBeforeMutation;
        setIsReady(ready);
      }
    }

    window.addEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartPayload);
    window.addEventListener(SHOPIFY_CART_OPEN_EVENT, handleCartPayload);
    window.addEventListener(SHOPIFY_CART_INVALIDATED_EVENT, scheduleRefresh);
    window.addEventListener(SHOPIFY_CART_MUTATION_STARTED_EVENT, handleMutationStarted);
    window.addEventListener(SHOPIFY_CART_MUTATION_FINISHED_EVENT, handleMutationFinished);
    const stopSynchronization = startShopifyCartSynchronization();
    void loadCart();

    return () => {
      mounted = false;
      cancelRead();
      stopSynchronization();
      window.removeEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartPayload);
      window.removeEventListener(SHOPIFY_CART_OPEN_EVENT, handleCartPayload);
      window.removeEventListener(SHOPIFY_CART_INVALIDATED_EVENT, scheduleRefresh);
      window.removeEventListener(SHOPIFY_CART_MUTATION_STARTED_EVENT, handleMutationStarted);
      window.removeEventListener(SHOPIFY_CART_MUTATION_FINISHED_EVENT, handleMutationFinished);
    };
  }, []);

  const value = useMemo<CartQuantityStatus>(
    () => ({
      isReady,
      isLoading,
      getVariantQuantity: (merchandiseId) => getVariantCartQuantity(state.cart, merchandiseId),
      getQuantityLimit: (merchandiseId, inventory) =>
        getCartVariantQuantityLimit(state, merchandiseId, inventory),
      getRemainingQuantity: (merchandiseId, inventory) =>
        getRemainingCartVariantQuantity(state, merchandiseId, inventory),
      canAddVariant: (merchandiseId, quantity = 1, inventory) => {
        const remaining = getRemainingCartVariantQuantity(state, merchandiseId, inventory);
        return remaining === null || remaining >= quantity;
      },
    }),
    [state, isReady, isLoading],
  );

  return <CartQuantityContext.Provider value={value}>{children}</CartQuantityContext.Provider>;
}

export function useCartQuantityStatus(): CartQuantityStatus {
  return useContext(CartQuantityContext);
}
