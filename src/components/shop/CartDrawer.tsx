"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { ArrowRight, LockKeyhole, Minus, Plus, ShoppingBag, X } from "lucide-react";

import {
  SHOPIFY_CART_CHANGED_EVENT,
  SHOPIFY_CART_OPEN_EVENT,
  notifyShopifyCartChanged,
} from "@/lib/shopify/cart-events";
import {
  isShopifyCartMutationPending,
  requestShopifyCartMutation,
} from "@/lib/shopify/cart-request";
import { getProductOptionPresentation } from "@/lib/shopify/product-option-presentation";
import type {
  ShopifyCartResponse,
  ShopifyCartSnapshot,
  ShopifyCartWarning,
} from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

function formatLineMeta(cartLine: ShopifyCartSnapshot["lines"][number]) {
  if (cartLine.selectedOptions.length > 0) {
    const optionPresentation = getProductOptionPresentation(cartLine);

    return cartLine.selectedOptions
      .map((option) => optionPresentation.getSummaryPart(option.name, option.value))
      .join(" / ");
  }

  if (cartLine.variantTitle && cartLine.variantTitle !== "Default Title") {
    return cartLine.variantTitle;
  }

  return null;
}

export function CartDrawer(): ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<ShopifyCartSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mutatingLineId, setMutatingLineId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ShopifyCartWarning[]>([]);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const requestGenerationRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const isWorkingRef = useRef(false);
  const isMountedRef = useRef(true);
  const needsRefreshRef = useRef(false);
  const pendingOpenPayloadRef = useRef<ShopifyCartResponse | null>(null);

  const applyPayload = useCallback((payload: ShopifyCartResponse): void => {
    requestGenerationRef.current += 1;
    isRefreshingRef.current = false;
    setIsLoading(false);

    if ("cart" in payload) {
      setCart(payload.cart ?? null);
    }

    setWarnings(payload.warnings ?? []);
    setError(payload.message || payload.userErrors?.[0]?.message || null);
    needsRefreshRef.current = payload.confirmed === false;
    setNeedsRefresh(needsRefreshRef.current);
  }, []);

  const loadCart = useCallback(async (): Promise<void> => {
    if (isRefreshingRef.current || isWorkingRef.current) {
      return;
    }

    if (isShopifyCartMutationPending()) {
      setError("Your bag is updating. Please wait before refreshing.");
      return;
    }

    const generation = ++requestGenerationRef.current;
    isRefreshingRef.current = true;
    if (panelRef.current?.contains(document.activeElement)) {
      panelRef.current
        .querySelector<HTMLButtonElement>('button[aria-label="Close bag"]')
        ?.focus({ preventScroll: true });
    }
    setIsLoading(true);
    setError(null);
    let failureMessage = "We couldn't load your bag. Please try again.";

    try {
      const response = await fetch("/api/shopify/cart", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as ShopifyCartResponse | null;

      if (generation !== requestGenerationRef.current || !isMountedRef.current) {
        return;
      }

      if (!payload || typeof payload !== "object" || typeof payload.configured !== "boolean") {
        throw new Error(failureMessage);
      }

      if (!response.ok) {
        if ("cart" in payload) {
          setCart(payload.cart ?? null);
        }
        setWarnings(payload.warnings ?? []);
        failureMessage = payload.message || failureMessage;
        throw new Error(failureMessage);
      }

      if (!("cart" in payload)) {
        throw new Error(failureMessage);
      }

      applyPayload(payload);
      notifyShopifyCartChanged(payload);
    } catch {
      if (generation !== requestGenerationRef.current || !isMountedRef.current) {
        return;
      }

      setError(failureMessage);
      needsRefreshRef.current = true;
      setNeedsRefresh(true);
    } finally {
      if (generation === requestGenerationRef.current && isMountedRef.current) {
        isRefreshingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [applyPayload]);

  useEffect(() => {
    isMountedRef.current = true;

    function handleOpen(event: Event): void {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setIsOpen(true);
      const payload =
        event instanceof CustomEvent
          ? (event.detail as ShopifyCartResponse | undefined)
          : undefined;
      const pendingPayload = payload ?? pendingOpenPayloadRef.current;

      if (pendingPayload) {
        applyPayload(pendingPayload);
        if (
          !pendingPayload.message &&
          (pendingPayload.warnings ?? []).length === 0 &&
          pendingPayload.confirmed !== false
        ) {
          pendingOpenPayloadRef.current = null;
        }
      } else {
        void loadCart();
      }
    }

    function handleCartChanged(event: Event): void {
      const payload =
        event instanceof CustomEvent
          ? (event.detail as ShopifyCartResponse | undefined)
          : undefined;

      if (payload) {
        pendingOpenPayloadRef.current = payload;
        applyPayload(payload);
      } else {
        void loadCart();
      }
    }

    window.addEventListener(SHOPIFY_CART_OPEN_EVENT, handleOpen);
    window.addEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      isMountedRef.current = false;
      requestGenerationRef.current += 1;
      isRefreshingRef.current = false;
      window.removeEventListener(SHOPIFY_CART_OPEN_EVENT, handleOpen);
      window.removeEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [applyPayload, loadCart]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      (firstFocusable ?? panelRef.current)?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  async function updateQuantity(lineId: string, quantity: number): Promise<void> {
    if (isWorkingRef.current || isRefreshingRef.current || needsRefreshRef.current) {
      return;
    }

    if (isShopifyCartMutationPending()) {
      setError("Your bag is updating. Please wait before making another change.");
      return;
    }

    isWorkingRef.current = true;
    requestGenerationRef.current += 1;
    setMutatingLineId(lineId);
    setError(null);
    setWarnings([]);
    let requestStarted = false;

    try {
      const { response, payload } = await requestShopifyCartMutation(async () => {
        requestStarted = true;
        const response = await fetch("/api/shopify/cart", {
          method: quantity <= 0 ? "DELETE" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            quantity <= 0 ? { lineIds: [lineId] } : { lines: [{ id: lineId, quantity }] },
          ),
        });
        const payload = (await response.json()) as ShopifyCartResponse;
        return { response, payload };
      });

      if (!isMountedRef.current) {
        return;
      }

      const feedback: ShopifyCartResponse =
        response.ok && payload.confirmed === true && "cart" in payload
          ? payload
          : {
              ...payload,
              confirmed: false,
              message:
                payload.message ||
                "We couldn't confirm your bag update. Refresh your bag to review it before trying again.",
            };
      applyPayload(feedback);
      notifyShopifyCartChanged(feedback);
    } catch (caughtError) {
      if (!isMountedRef.current) {
        return;
      }

      const message = requestStarted
        ? "We couldn't confirm your bag update. Refresh your bag to review it before trying again."
        : caughtError instanceof Error
          ? caughtError.message
          : "Unable to update your bag.";
      setError(message);

      if (requestStarted) {
        const feedback: ShopifyCartResponse = {
          configured: true,
          warnings: [],
          userErrors: [],
          confirmed: false,
          message,
        };
        applyPayload(feedback);
        notifyShopifyCartChanged(feedback);
      }
    } finally {
      isWorkingRef.current = false;
      if (isMountedRef.current) {
        setMutatingLineId(null);
      }
    }
  }

  async function goToCheckout(): Promise<void> {
    if (isWorkingRef.current || isRefreshingRef.current || needsRefreshRef.current) {
      return;
    }

    if (isShopifyCartMutationPending()) {
      setError("Your bag is updating. Please wait before starting checkout.");
      return;
    }

    isWorkingRef.current = true;
    setIsCheckingOut(true);
    setError(null);
    let requestStarted = false;
    let feedbackPublished = false;
    let failureMessage = "We couldn't start checkout. Refresh your bag, then try again.";

    try {
      const { response, payload } = await requestShopifyCartMutation(async () => {
        requestStarted = true;
        const response = await fetch("/api/shopify/cart/checkout", { method: "POST" });
        const payload = (await response.json().catch(() => null)) as
          | (ShopifyCartResponse & { checkoutUrl?: string })
          | null;
        return { response, payload };
      });

      if (!isMountedRef.current) {
        return;
      }

      if (!payload || typeof payload !== "object" || typeof payload.configured !== "boolean") {
        throw new Error(failureMessage);
      }

      const feedback: ShopifyCartResponse = {
        ...payload,
        confirmed: response.ok && Boolean(payload.checkoutUrl),
        ...(!response.ok || !payload.checkoutUrl
          ? { message: payload.message || failureMessage }
          : {}),
      };
      applyPayload(feedback);
      notifyShopifyCartChanged(feedback);
      feedbackPublished = true;

      if (!response.ok || !payload.checkoutUrl) {
        failureMessage = payload.message || failureMessage;
        throw new Error(failureMessage);
      }

      window.location.assign(payload.checkoutUrl);
    } catch (caughtError) {
      if (isMountedRef.current) {
        setError(
          requestStarted
            ? failureMessage
            : caughtError instanceof Error
              ? caughtError.message
              : failureMessage,
        );
        if (requestStarted) {
          needsRefreshRef.current = true;
          setNeedsRefresh(true);
          if (!feedbackPublished) {
            const feedback: ShopifyCartResponse = {
              configured: true,
              warnings: [],
              userErrors: [],
              confirmed: false,
              message: failureMessage,
            };
            applyPayload(feedback);
            notifyShopifyCartChanged(feedback);
          }
        }
        setIsCheckingOut(false);
      }
    } finally {
      isWorkingRef.current = false;
    }
  }

  if (!isOpen) {
    return null;
  }

  const hasLines = Boolean(cart && cart.lines.length > 0);
  const controlsDisabled = isLoading || Boolean(mutatingLineId) || isCheckingOut || needsRefresh;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="shopping-drawer-backdrop fixed inset-0 z-[170] bg-[#0b0f14]/55 backdrop-blur-[3px]"
        aria-label="Close bag"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        tabIndex={-1}
        className={cn(
          "shopping-drawer-panel fixed inset-x-0 bottom-0 z-[175] flex max-h-[82dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_-24px_70px_-34px_rgba(11,15,20,0.55)] outline-none lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:max-h-none lg:max-w-[26rem] lg:rounded-none lg:shadow-[-24px_0_60px_-40px_rgba(11,15,20,0.45)]",
          hasLines || isLoading || error ? "h-[82dvh]" : "h-auto",
        )}
      >
        <div className="relative flex items-center justify-between gap-3 border-b border-ink/10 px-5 pt-6 pb-3 lg:py-4">
          <span
            className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-ink/18 lg:hidden"
            aria-hidden
          />
          <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.16em] text-ink uppercase">
            <ShoppingBag className="h-4 w-4 text-deep-teal" />
            Your Bag
            {cart && cart.totalQuantity > 0 ? (
              <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-deep-teal px-1.5 text-[10px] font-semibold text-white">
                {cart.totalQuantity > 99 ? "99+" : cart.totalQuantity}
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
            aria-label="Close bag"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {error && cart ? (
            <div
              className="mb-4 rounded-md border border-sale/25 bg-sale/8 px-4 py-3 text-sm text-ink"
              role="alert"
            >
              <p>{error}</p>
              <button
                type="button"
                disabled={isLoading || Boolean(mutatingLineId) || isCheckingOut}
                onClick={() => void loadCart()}
                className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold tracking-[0.12em] text-deep-teal uppercase underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Refreshing Bag..." : "Refresh Bag"}
              </button>
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div
              className="mb-4 rounded-md border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ink"
              role="status"
              aria-live="polite"
            >
              {warnings.map((warning, index) => (
                <p key={`${warning.code}-${index}`} className={index > 0 ? "mt-2" : undefined}>
                  {warning.message}
                </p>
              ))}
            </div>
          ) : null}

          {error && !cart && !isLoading ? (
            <div
              className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center"
              role="alert"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sale/8 text-sale">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-ink">We couldn&apos;t load your bag.</p>
                <p className="mt-1 max-w-xs text-sm leading-6 text-smoke">{error}</p>
              </div>
              <button
                type="button"
                disabled={isLoading || Boolean(mutatingLineId) || isCheckingOut}
                onClick={() => void loadCart()}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink bg-ink px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:border-deep-teal hover:bg-deep-teal"
              >
                Try Again
              </button>
            </div>
          ) : isLoading && !cart ? (
            <div className="space-y-3">
              {[0, 1].map((index) => (
                <div key={index} className="flex gap-4">
                  <div className="h-24 w-20 animate-pulse rounded-md bg-stone" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-stone" />
                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-stone" />
                    <div className="h-8 w-24 animate-pulse rounded-md bg-stone" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasLines && cart ? (
            <ul className="divide-y divide-ink/8">
              {cart.lines.map((line) => {
                const lineMeta = formatLineMeta(line);
                const productHref = line.productHandle ? `/shop/${line.productHandle}` : null;
                const isLineMutating = mutatingLineId === line.id;

                return (
                  <li
                    key={line.id}
                    className={cn(
                      "flex gap-4 py-4 transition-opacity",
                      isLineMutating && "opacity-60",
                    )}
                  >
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-product-canvas">
                      {line.image ? (
                        <Image
                          src={line.image.url}
                          alt={line.image.altText || line.productTitle || "Bag item"}
                          fill
                          sizes="80px"
                          className="object-contain p-1.5"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">
                            {productHref ? (
                              <Link
                                href={productHref}
                                onClick={() => setIsOpen(false)}
                                className="transition-colors hover:text-deep-teal"
                              >
                                {line.productTitle || "Selected item"}
                              </Link>
                            ) : (
                              line.productTitle || "Selected item"
                            )}
                          </p>
                          {lineMeta ? (
                            <p className="mt-0.5 text-xs text-smoke">{lineMeta}</p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-ink">
                          {formatMoney(line.totalPrice.amount, line.totalPrice.currencyCode)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-md border border-ink/15 bg-white">
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-l-md text-ink transition-colors hover:text-deep-teal disabled:cursor-not-allowed disabled:text-ink/30"
                            disabled={controlsDisabled}
                            onClick={() => void updateQuantity(line.id, line.quantity - 1)}
                            aria-label={`Decrease quantity for ${line.productTitle || "item"}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-9 text-center text-xs font-semibold text-ink">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-r-md text-ink transition-colors hover:text-deep-teal disabled:cursor-not-allowed disabled:text-ink/30"
                            disabled={controlsDisabled}
                            onClick={() => void updateQuantity(line.id, line.quantity + 1)}
                            aria-label={`Increase quantity for ${line.productTitle || "item"}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center px-2 text-[11px] font-semibold tracking-[0.12em] text-smoke uppercase transition-colors hover:text-ink disabled:cursor-not-allowed"
                          disabled={controlsDisabled}
                          onClick={() => void updateQuantity(line.id, 0)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone text-deep-teal">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-ink">Your bag is empty</p>
                <p className="mt-1 text-sm leading-6 text-smoke">
                  Add pieces from the shop and they will appear here.
                </p>
              </div>
              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-gold bg-gold px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-[#d7b979]"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>

        {hasLines && cart ? (
          <div className="border-t border-ink/10 bg-white px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-smoke">Subtotal</span>
              <span className="text-base font-semibold text-ink">
                {formatMoney(cart.subtotal.amount, cart.subtotal.currencyCode)}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-smoke">
              Shipping and taxes are calculated at checkout.
            </p>

            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => void goToCheckout()}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md border border-ink bg-ink px-5 py-3 text-sm font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:border-deep-teal hover:bg-deep-teal disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckingOut ? "Starting Checkout..." : "Checkout"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>

            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-ink/18 bg-white px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-ink/35 hover:bg-stone/55"
            >
              View Bag
            </Link>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-smoke">
              <LockKeyhole className="h-3.5 w-3.5 text-deep-teal" />
              Secure checkout powered by Shopify
            </p>
          </div>
        ) : null}

        <p className="sr-only" role="status" aria-live="polite">
          {cart
            ? `${cart.totalQuantity} ${cart.totalQuantity === 1 ? "item" : "items"} in your bag`
            : ""}
        </p>
      </div>
    </>
  );
}
