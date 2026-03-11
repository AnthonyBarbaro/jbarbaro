import "server-only";

import { cookies } from "next/headers";

import { SITE_URL } from "@/lib/constants";

export const SHOPIFY_CART_COOKIE = "jbarbaro_shopify_cart";

const isLocalHttpSite = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(SITE_URL);

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && !isLocalHttpSite,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function getShopifyCartSessionId() {
  const cookieStore = await cookies();

  return cookieStore.get(SHOPIFY_CART_COOKIE)?.value ?? null;
}

export async function setShopifyCartSessionId(cartId: string) {
  const cookieStore = await cookies();

  // Shopify cart IDs include a secret key segment, so they stay in an httpOnly cookie only.
  cookieStore.set(SHOPIFY_CART_COOKIE, cartId, cookieOptions);
}

export async function clearShopifyCartSessionId() {
  const cookieStore = await cookies();

  cookieStore.delete(SHOPIFY_CART_COOKIE);
}
