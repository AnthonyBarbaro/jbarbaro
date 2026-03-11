"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, Minus, Plus, RefreshCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { notifyShopifyCartChanged } from "@/lib/shopify/cart-events";
import type { ShopifyCartSnapshot } from "@/lib/shopify/types";
import { formatMoney } from "@/lib/utils";

type CartResponse = {
  configured: boolean;
  cart: ShopifyCartSnapshot | null;
  message?: string;
};

function formatLineMeta(cartLine: ShopifyCartSnapshot["lines"][number]) {
  if (cartLine.selectedOptions.length > 0) {
    return cartLine.selectedOptions.map((option) => option.value).join(" / ");
  }

  if (cartLine.variantTitle && cartLine.variantTitle !== "Default Title") {
    return cartLine.variantTitle;
  }

  return null;
}

export function ShopifyCartClient() {
  const [cart, setCart] = useState<ShopifyCartSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  async function loadCart() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shopify/cart", { cache: "no-store" });
      const payload = (await response.json()) as CartResponse;

      setIsConfigured(payload.configured);
      setCart(payload.cart);

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load cart.");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load cart.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCart();
  }, []);

  async function updateQuantity(lineId: string, quantity: number) {
    setIsMutating(true);
    setError(null);

    try {
      const response = await fetch("/api/shopify/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lines: [{ id: lineId, quantity }],
        }),
      });

      const payload = (await response.json()) as CartResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Unable to update cart.");
      }

      setCart(payload.cart);
      notifyShopifyCartChanged();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update cart.");
    } finally {
      setIsMutating(false);
    }
  }

  async function removeLine(lineId: string) {
    setIsMutating(true);
    setError(null);

    try {
      const response = await fetch("/api/shopify/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineIds: [lineId],
        }),
      });

      const payload = (await response.json()) as CartResponse;

      if (!response.ok) {
        throw new Error(payload.message || "Unable to remove item.");
      }

      setCart(payload.cart);
      notifyShopifyCartChanged();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to remove item.");
    } finally {
      setIsMutating(false);
    }
  }

  async function goToCheckout() {
    setIsMutating(true);
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
      setIsMutating(false);
    }
  }

  if (isLoading) {
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

  if (!isConfigured) {
    return (
      <Container>
        <Card tone="stone">
          <CardContent>
            <h2 className="font-heading text-3xl text-ink">Shopify is not configured</h2>
            <p className="mt-3 text-sm leading-7 text-smoke">Add the Storefront API credentials to enable the live cart experience.</p>
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
                <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Bag Status</p>
                <h2 className="mt-2 font-heading text-3xl text-ink">Your bag is empty</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke">
                  Add products from the shop floor, then return here to review quantities, totals, and checkout.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold bg-gold px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-ink uppercase transition-all duration-300 hover:bg-ink hover:text-ivory"
              >
                Continue Shopping
              </Link>
              <Button variant="secondary" onClick={() => void loadCart()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Bag
              </Button>
            </div>
          </CardContent>
          {error ? <p className="px-5 pb-5 text-sm text-[color:#8b1e3f] sm:px-7 sm:pb-7">{error}</p> : null}
        </Card>
      </Container>
    );
  }

  return (
    <Container className="pb-12">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-stone/35 px-4 py-3 text-sm text-smoke sm:px-5">
            <span className="font-semibold text-ink">{cart.totalQuantity}</span> item{cart.totalQuantity === 1 ? "" : "s"} in your bag
          </div>

          {error ? (
            <div className="rounded-2xl border border-[color:#8b1e3f]/20 bg-[color:#fff6f8] px-4 py-3 text-sm text-[color:#8b1e3f]">
              {error}
            </div>
          ) : null}

          <div className="hidden rounded-3xl border border-ink/10 bg-stone/60 px-6 py-4 lg:grid lg:grid-cols-[minmax(0,2.05fr)_100px_148px_108px] lg:items-center lg:gap-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">Product</p>
            <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">Price</p>
            <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">Quantity</p>
            <p className="text-right text-xs font-semibold tracking-[0.14em] text-smoke uppercase">Total</p>
          </div>

          {cart.lines.map((line) => {
            const lineMeta = formatLineMeta(line);
            const productHref = line.productHandle ? `/shop/${line.productHandle}` : null;

            return (
              <article key={line.id} className="overflow-hidden rounded-[2rem] border border-ink/10 bg-ivory shadow-[0_24px_60px_-48px_rgba(14,23,38,0.35)]">
                <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,2.05fr)_100px_148px_108px] lg:items-start lg:gap-4">
                  <div className="flex gap-5">
                    <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone sm:h-36 sm:w-28">
                      {line.image ? (
                        <Image
                          src={line.image.url}
                          alt={line.image.altText || line.productTitle || "Cart item"}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 max-w-[30rem] flex-1">
                      {lineMeta ? <p className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">{lineMeta}</p> : null}
                      <h3
                        className="mt-2 font-heading text-[1.5rem] leading-[1.18] text-ink sm:text-[1.7rem]"
                        title={line.productTitle || "Shopify Product"}
                      >
                        {productHref ? (
                          <Link href={productHref} className="transition-colors hover:text-deep-teal">
                            {line.productTitle || "Shopify Product"}
                          </Link>
                        ) : (
                          line.productTitle || "Shopify Product"
                        )}
                      </h3>
                      <button
                        type="button"
                        className="mt-5 text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase transition-colors hover:text-[color:#8b1e3f]"
                        disabled={isMutating}
                        onClick={() => void removeLine(line.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 lg:block lg:pt-5">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase lg:hidden">Price</p>
                    <p className="text-sm font-semibold text-ink">
                      {formatMoney(line.unitPrice.amount, line.unitPrice.currencyCode)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 lg:block lg:pt-4">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase lg:hidden">Quantity</p>
                    <div className="inline-flex items-center rounded-full border border-ink/15 bg-stone/50">
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-l-full text-ink transition-colors hover:text-deep-teal disabled:cursor-not-allowed disabled:text-ink/30"
                        disabled={isMutating || line.quantity <= 1}
                        onClick={() => void updateQuantity(line.id, line.quantity - 1)}
                        aria-label={`Decrease quantity for ${line.productTitle || "item"}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-10 text-center text-sm font-semibold text-ink">{line.quantity}</span>
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-r-full text-ink transition-colors hover:text-deep-teal disabled:cursor-not-allowed disabled:text-ink/30"
                        disabled={isMutating}
                        onClick={() => void updateQuantity(line.id, line.quantity + 1)}
                        aria-label={`Increase quantity for ${line.productTitle || "item"}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 lg:block lg:pt-5 lg:text-right">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase lg:hidden">Total</p>
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
                  <span className="font-medium text-ink">{formatMoney(cart.subtotal.amount, cart.subtotal.currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated tax</span>
                  <span>{cart.tax ? formatMoney(cart.tax.amount, cart.tax.currencyCode) : "Calculated at checkout"}</span>
                </div>
                <div className="flex items-center justify-between border-t border-ink/10 pt-4 text-base font-semibold text-ink">
                  <span>Estimated total</span>
                  <span>{formatMoney(cart.total.amount, cart.total.currencyCode)}</span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-ink/10 bg-stone/55 px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">Checkout</p>
                <p className="mt-2 text-sm leading-6 text-smoke">
                  Final shipping methods and any required taxes are confirmed on secure Shopify checkout.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <Button className="w-full" disabled={isMutating} onClick={() => void goToCheckout()}>
                  <span>{isMutating ? "Working..." : "Proceed to Checkout"}</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card tone="stone">
            <CardContent>
              <h3 className="font-heading text-2xl text-ink">Bag Information</h3>
              <div className="mt-5 space-y-4 text-sm leading-7 text-smoke">
                <div className="flex items-start gap-3">
                  <Truck className="mt-1 h-4 w-4 text-deep-teal" />
                  <p>Shipping options are selected at checkout after your delivery address is entered.</p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-4 w-4 text-deep-teal" />
                  <p>Bag totals refresh live as you adjust quantities.</p>
                </div>
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-1 h-4 w-4 text-deep-teal" />
                  <p>Checkout is completed on Shopify&apos;s secure hosted checkout.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
