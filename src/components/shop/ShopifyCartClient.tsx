"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import {
  ArrowRight,
  LockKeyhole,
  Minus,
  Plus,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SHOPIFY_CART_CHANGED_EVENT, notifyShopifyCartChanged } from "@/lib/shopify/cart-events";
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
import { formatMoney } from "@/lib/utils";

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

function getSelectedOptionValue(
  options: ShopifyCartSnapshot["lines"][number]["selectedOptions"],
  optionName: string,
) {
  const normalizedOptionName = optionName.toLowerCase();

  return (
    options.find((option) => option.name.toLowerCase().includes(normalizedOptionName))?.value ??
    null
  );
}

function optionValue(
  options: ShopifyCartSnapshot["lines"][number]["selectedOptions"],
  optionName: string,
) {
  return options.find((option) => option.name === optionName)?.value ?? null;
}

function getSizeChoices(cartLine: ShopifyCartSnapshot["lines"][number]) {
  const currentSize = getSelectedOptionValue(cartLine.selectedOptions, "size");

  if (!currentSize || cartLine.variants.length <= 1) {
    return [];
  }

  const nonSizeOptions = cartLine.selectedOptions.filter(
    (option) => !option.name.toLowerCase().includes("size"),
  );
  const choices = new Map<
    string,
    {
      availableForSale: boolean;
      id: string;
      isCurrent: boolean;
      label: string;
    }
  >();

  for (const variant of cartLine.variants) {
    const size = getSelectedOptionValue(variant.selectedOptions, "size");

    if (!size) {
      continue;
    }

    const matchesOtherOptions = nonSizeOptions.every(
      (option) => optionValue(variant.selectedOptions, option.name) === option.value,
    );

    if (!matchesOtherOptions) {
      continue;
    }

    const isCurrent = variant.id === cartLine.variantId;
    const existing = choices.get(size);

    if (!existing || isCurrent || (!existing.availableForSale && variant.availableForSale)) {
      choices.set(size, {
        availableForSale: variant.availableForSale,
        id: variant.id,
        isCurrent,
        label: size,
      });
    }
  }

  return Array.from(choices.values()).sort((left, right) =>
    left.label.localeCompare(right.label, undefined, { numeric: true }),
  );
}

export function ShopifyCartClient(): ReactElement {
  const [cart, setCart] = useState<ShopifyCartSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [mutatingLineId, setMutatingLineId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [warnings, setWarnings] = useState<ShopifyCartWarning[]>([]);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const requestGenerationRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const isWorkingRef = useRef(false);
  const isMountedRef = useRef(true);
  const needsRefreshRef = useRef(false);

  const applyPayload = useCallback((payload: ShopifyCartResponse): void => {
    requestGenerationRef.current += 1;
    isRefreshingRef.current = false;
    setIsLoading(false);

    if ("cart" in payload) {
      setCart(payload.cart ?? null);
    }

    if (payload.confirmed !== false || "cart" in payload) {
      setIsConfigured(payload.configured);
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
    const main = document.getElementById("main-content");
    if (main?.contains(document.activeElement)) {
      const heading = main.querySelector<HTMLElement>("h1");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
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
        if (payload.confirmed === true) {
          setIsConfigured(payload.configured);
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

    function handleCartChanged(event: Event): void {
      const payload =
        event instanceof CustomEvent
          ? (event.detail as ShopifyCartResponse | undefined)
          : undefined;

      if (payload) {
        applyPayload(payload);
      } else {
        void loadCart();
      }
    }

    window.addEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartChanged);
    void loadCart();

    return () => {
      isMountedRef.current = false;
      requestGenerationRef.current += 1;
      isRefreshingRef.current = false;
      window.removeEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [applyPayload, loadCart]);

  function beginAction(lineId: string | null): boolean {
    if (isWorkingRef.current || isRefreshingRef.current || needsRefreshRef.current) {
      return false;
    }

    if (isShopifyCartMutationPending()) {
      setError("Your bag is updating. Please wait before making another change.");
      return false;
    }

    isWorkingRef.current = true;
    requestGenerationRef.current += 1;
    setIsMutating(true);
    setMutatingLineId(lineId);
    setError(null);
    return true;
  }

  async function mutateCart(
    lineId: string,
    options: RequestInit,
    fallbackMessage: string,
  ): Promise<void> {
    if (!beginAction(lineId)) {
      return;
    }

    setWarnings([]);
    let requestStarted = false;

    try {
      const { response, payload } = await requestShopifyCartMutation(async () => {
        requestStarted = true;
        const response = await fetch("/api/shopify/cart", options);
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
          : fallbackMessage;
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
        setIsMutating(false);
        setMutatingLineId(null);
      }
    }
  }

  async function updateQuantity(lineId: string, quantity: number): Promise<void> {
    await mutateCart(
      lineId,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: [{ id: lineId, quantity }] }),
      },
      "Unable to update your bag.",
    );
  }

  async function updateLineVariant(
    cartLine: ShopifyCartSnapshot["lines"][number],
    merchandiseId: string,
  ): Promise<void> {
    if (!merchandiseId || merchandiseId === cartLine.variantId) {
      return;
    }

    await mutateCart(
      cartLine.id,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: [{ id: cartLine.id, merchandiseId, quantity: cartLine.quantity }],
        }),
      },
      "Unable to update size.",
    );
  }

  async function removeLine(lineId: string): Promise<void> {
    await mutateCart(
      lineId,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineIds: [lineId] }),
      },
      "Unable to remove item.",
    );
  }

  async function goToCheckout(): Promise<void> {
    if (!beginAction(null)) {
      return;
    }

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
        setIsMutating(false);
      }
    } finally {
      isWorkingRef.current = false;
    }
  }

  const controlsDisabled = isMutating || isLoading || needsRefresh;
  const warningFeedback =
    warnings.length > 0 ? (
      <div
        className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ink"
        role="status"
        aria-live="polite"
      >
        {warnings.map((warning, index) => (
          <p key={`${warning.code}-${index}`} className={index > 0 ? "mt-2" : undefined}>
            {warning.message}
          </p>
        ))}
      </div>
    ) : null;
  const errorFeedback = error ? (
    <div
      className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ink"
      role="alert"
    >
      <p>{error}</p>
      <button
        type="button"
        disabled={isMutating || isLoading}
        onClick={() => void loadCart()}
        className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold tracking-[0.12em] text-deep-teal uppercase underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCcw className="mr-2 h-4 w-4" />
        {isLoading ? "Refreshing Bag..." : "Refresh Bag"}
      </button>
    </div>
  ) : null;

  if (isLoading && !cart) {
    return (
      <Container className="pb-12">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <Card>
            <CardContent className="space-y-4">
              <div className="h-6 w-40 animate-pulse rounded-full bg-stone" />
              <div className="h-28 animate-pulse rounded-3xl bg-stone" />
              <div className="h-28 animate-pulse rounded-3xl bg-stone" />
            </CardContent>
          </Card>
          <Card tone="stone">
            <CardContent className="space-y-4">
              <div className="h-6 w-32 animate-pulse rounded-full bg-ivory/70" />
              <div className="h-4 w-full animate-pulse rounded-full bg-ivory/70" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-ivory/70" />
              <div className="h-11 w-full animate-pulse rounded-full bg-ivory/70" />
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  if (error && !cart) {
    return (
      <Container className="pb-12">
        <Card>
          <CardContent>
            <div role="alert">
              <h2 className="font-heading text-3xl text-ink">We couldn&apos;t load your bag.</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">{error}</p>
            </div>
            {warningFeedback ? <div className="mt-4">{warningFeedback}</div> : null}
            <Button
              className="mt-5"
              variant="secondary"
              disabled={isMutating || isLoading}
              onClick={() => void loadCart()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!isConfigured) {
    return (
      <Container>
        <Card tone="stone">
          <CardContent>
            <h2 className="font-heading text-3xl text-ink">Shopping bag unavailable</h2>
            <p className="mt-3 text-sm leading-7 text-smoke">
              The bag is temporarily unavailable. Please keep shopping or book an appointment and
              we&apos;ll prepare options for you.
            </p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <Container className="pb-12">
        <Card>
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-stone text-deep-teal">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">
                  Bag Status
                </p>
                <h2 className="mt-2 font-heading text-3xl text-ink">Your bag is empty</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke">
                  Add products from the shop floor, then return here to review quantities, totals,
                  and checkout.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-gold bg-gold px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-ink uppercase transition-all duration-300 hover:bg-ink hover:text-ivory"
              >
                Continue Shopping
              </Link>
              <Button
                variant="secondary"
                disabled={isMutating || isLoading}
                onClick={() => void loadCart()}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isLoading ? "Refreshing Bag..." : "Refresh Bag"}
              </Button>
            </div>
          </CardContent>
          {warningFeedback || errorFeedback ? (
            <div className="space-y-3 px-5 pb-5 sm:px-7 sm:pb-7">
              {warningFeedback}
              {errorFeedback}
            </div>
          ) : null}
        </Card>
      </Container>
    );
  }

  return (
    <Container className="pb-12">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-smoke shadow-sm sm:px-5">
            <span className="font-semibold text-ink">{cart.totalQuantity}</span> item
            {cart.totalQuantity === 1 ? "" : "s"} in your bag
          </div>

          {warningFeedback}
          {errorFeedback}

          <div className="hidden rounded-lg border border-ink/10 bg-stone/60 px-6 py-4 lg:grid lg:grid-cols-[minmax(0,2.05fr)_100px_148px_108px] lg:items-center lg:gap-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">Product</p>
            <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">Price</p>
            <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">Quantity</p>
            <p className="text-right text-xs font-semibold tracking-[0.14em] text-smoke uppercase">
              Total
            </p>
          </div>

          {cart.lines.map((line) => {
            const lineMeta = formatLineMeta(line);
            const optionPresentation = getProductOptionPresentation(line);
            const productHref = line.productHandle ? `/shop/${line.productHandle}` : null;
            const currentSize = getSelectedOptionValue(line.selectedOptions, "size");
            const sizeLabel = optionPresentation.getLabel("Size");
            const sizeChoices = getSizeChoices(line);
            const isLineMutating = mutatingLineId === line.id;

            return (
              <article
                key={line.id}
                className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm"
              >
                <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,2.05fr)_100px_148px_108px] lg:items-start lg:gap-4">
                  <div className="flex gap-5">
                    <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-md bg-white sm:h-36 sm:w-28">
                      {line.image ? (
                        <Image
                          src={line.image.url}
                          alt={line.image.altText || line.productTitle || "Cart item"}
                          fill
                          sizes="112px"
                          className="object-contain p-2"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 max-w-[30rem] flex-1">
                      {lineMeta ? (
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">
                          {lineMeta}
                        </p>
                      ) : null}
                      <h3
                        className="mt-2 font-heading text-[1.5rem] leading-[1.18] text-ink sm:text-[1.7rem]"
                        title={line.productTitle || "Selected Item"}
                      >
                        {productHref ? (
                          <Link
                            href={productHref}
                            className="transition-colors hover:text-deep-teal"
                          >
                            {line.productTitle || "Selected Item"}
                          </Link>
                        ) : (
                          line.productTitle || "Selected Item"
                        )}
                      </h3>

                      {sizeChoices.length > 1 ? (
                        <div className="mt-4 max-w-[15rem]">
                          <label
                            htmlFor={`cart-line-size-${line.id}`}
                            className="text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase"
                          >
                            {sizeLabel}
                          </label>
                          <select
                            id={`cart-line-size-${line.id}`}
                            value={line.variantId ?? ""}
                            disabled={controlsDisabled}
                            onChange={(event) => void updateLineVariant(line, event.target.value)}
                            className="mt-2 h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm font-medium text-ink outline-none transition-colors focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/10 disabled:cursor-not-allowed disabled:bg-stone/70 disabled:text-smoke"
                          >
                            {sizeChoices.map((choice) => (
                              <option
                                key={choice.id}
                                value={choice.id}
                                disabled={!choice.availableForSale && !choice.isCurrent}
                              >
                                {choice.label}
                                {!choice.availableForSale && !choice.isCurrent ? " - sold out" : ""}
                              </option>
                            ))}
                          </select>
                          <p className="mt-2 text-xs leading-5 text-smoke">
                            {isLineMutating
                              ? "Updating size..."
                              : "Switch sizes here without rebuilding your bag."}
                          </p>
                        </div>
                      ) : currentSize ? (
                        <p className="mt-3 text-xs font-medium text-smoke">
                          {sizeLabel} {optionPresentation.getValue("Size", currentSize)}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        className="mt-5 text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase transition-colors hover:text-ink disabled:cursor-not-allowed disabled:text-smoke/50"
                        disabled={controlsDisabled}
                        onClick={() => void removeLine(line.id)}
                      >
                        {isLineMutating ? "Updating..." : "Remove"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 lg:block lg:pt-5">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase lg:hidden">
                      Price
                    </p>
                    <p className="text-sm font-semibold text-ink">
                      {formatMoney(line.unitPrice.amount, line.unitPrice.currencyCode)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 lg:block lg:pt-4">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase lg:hidden">
                      Quantity
                    </p>
                    <div className="inline-flex items-center rounded-md border border-ink/15 bg-stone/50">
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-l-md text-ink transition-colors hover:text-deep-teal disabled:cursor-not-allowed disabled:text-ink/30"
                        disabled={controlsDisabled || line.quantity <= 1}
                        onClick={() => void updateQuantity(line.id, line.quantity - 1)}
                        aria-label={`Decrease quantity for ${line.productTitle || "item"}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-10 text-center text-sm font-semibold text-ink">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-r-md text-ink transition-colors hover:text-deep-teal disabled:cursor-not-allowed disabled:text-ink/30"
                        disabled={controlsDisabled}
                        onClick={() => void updateQuantity(line.id, line.quantity + 1)}
                        aria-label={`Increase quantity for ${line.productTitle || "item"}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 lg:block lg:pt-5 lg:text-right">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase lg:hidden">
                      Total
                    </p>
                    <p className="text-sm font-semibold text-ink">
                      {formatMoney(line.totalPrice.amount, line.totalPrice.currencyCode)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="space-y-4 xl:sticky xl:top-28 xl:h-fit">
          <Card>
            <CardContent>
              <h2 className="font-heading text-3xl text-ink">Order Summary</h2>

              <div className="mt-6 space-y-4 text-sm text-smoke">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-ink">
                    {formatMoney(cart.subtotal.amount, cart.subtotal.currencyCode)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated tax</span>
                  <span>
                    {cart.tax
                      ? formatMoney(cart.tax.amount, cart.tax.currencyCode)
                      : "Calculated at checkout"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-ink/10 pt-4 text-base font-semibold text-ink">
                  <span>Estimated total</span>
                  <span>{formatMoney(cart.total.amount, cart.total.currencyCode)}</span>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-ink/10 bg-stone/55 px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">
                  Checkout
                </p>
                <p className="mt-2 text-sm leading-6 text-smoke">
                  Final shipping methods and any required taxes are confirmed at secure checkout.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  className="w-full"
                  disabled={controlsDisabled}
                  onClick={() => void goToCheckout()}
                >
                  <span>{isMutating ? "Working..." : "Proceed to Checkout"}</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link
                  href="/shop"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-ink/20 px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-deep-teal hover:text-deep-teal"
                >
                  Continue Shopping
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card tone="stone">
            <CardContent>
              <h3 className="font-heading text-2xl text-ink">Bag Information</h3>
              <div className="mt-5 space-y-4 text-sm leading-7 text-smoke">
                <div className="flex items-start gap-3">
                  <Truck className="mt-1 h-4 w-4 text-deep-teal" />
                  <p>
                    Shipping options are selected at checkout after your delivery address is
                    entered.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-4 w-4 text-deep-teal" />
                  <p>
                    Bag totals refresh live as you adjust quantities or switch an available size.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-1 h-4 w-4 text-deep-teal" />
                  <p>Checkout is completed on our secure checkout page.</p>
                </div>
              </div>
              <Link
                href="/schedule-appointment"
                className="mt-5 inline-flex text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-ink"
              >
                Need fit help? Book an appointment
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
