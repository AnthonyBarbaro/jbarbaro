"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole, Minus, Plus, ShoppingBag, X } from "lucide-react";

import {
  SHOPIFY_CART_CHANGED_EVENT,
  SHOPIFY_CART_OPEN_EVENT,
  notifyShopifyCartChanged,
} from "@/lib/shopify/cart-events";
import { getProductOptionPresentation } from "@/lib/shopify/product-option-presentation";
import type { ShopifyCartSnapshot } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type CartResponse = {
  configured: boolean;
  cart: ShopifyCartSnapshot | null;
  message?: string;
};

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

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<ShopifyCartSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mutatingLineId, setMutatingLineId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const loadCart = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) {
      setIsLoading(true);
    }

    setError(null);

    try {
      const response = await fetch("/api/shopify/cart", { cache: "no-store" });
      const payload = (await response.json()) as CartResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load your bag.");
      }

      setCart(payload.cart);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load your bag.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    function handleOpen() {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setIsOpen(true);
      void loadCart(true);
    }

    window.addEventListener(SHOPIFY_CART_OPEN_EVENT, handleOpen);

    return () => {
      window.removeEventListener(SHOPIFY_CART_OPEN_EVENT, handleOpen);
    };
  }, [loadCart]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleCartChanged() {
      void loadCart(false);
    }

    window.addEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      window.removeEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [isOpen, loadCart]);

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

  async function updateQuantity(lineId: string, quantity: number) {
    setMutatingLineId(lineId);
    setError(null);

    try {
      const response =
        quantity <= 0
          ? await fetch("/api/shopify/cart", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lineIds: [lineId] }),
            })
          : await fetch("/api/shopify/cart", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lines: [{ id: lineId, quantity }] }),
            });

      const payload = (await response.json()) as CartResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Unable to update your bag.");
      }

      setCart(payload.cart);
      notifyShopifyCartChanged();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update your bag.");
    } finally {
      setMutatingLineId(null);
    }
  }

  async function goToCheckout() {
    setIsCheckingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/shopify/cart/checkout", { method: "POST" });
      const payload = (await response.json()) as { checkoutUrl?: string; message?: string };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.message || "Unable to start checkout.");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start checkout.");
      setIsCheckingOut(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  const hasLines = Boolean(cart && cart.lines.length > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 z-[170] bg-[#0b0f14]/55 backdrop-blur-[2px]"
        aria-label="Close bag"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-[175] flex w-full max-w-[26rem] flex-col bg-white shadow-[-24px_0_60px_-40px_rgba(11,15,20,0.45)] outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
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
              {error}
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
                onClick={() => void loadCart(true)}
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
                            disabled={isLineMutating}
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
                            disabled={isLineMutating}
                            onClick={() => void updateQuantity(line.id, line.quantity + 1)}
                            aria-label={`Increase quantity for ${line.productTitle || "item"}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center px-2 text-[11px] font-semibold tracking-[0.12em] text-smoke uppercase transition-colors hover:text-ink disabled:cursor-not-allowed"
                          disabled={isLineMutating}
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
              disabled={isCheckingOut || Boolean(mutatingLineId)}
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
