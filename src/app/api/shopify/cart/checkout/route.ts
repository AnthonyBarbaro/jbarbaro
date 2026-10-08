import { NextRequest, NextResponse } from "next/server";

import { getCart } from "@/lib/shopify/cart";
import { getShopifyConfigStatus } from "@/lib/shopify/config";
import { getCartGiftWrapIssue } from "@/lib/shopify/gift-wrap";
import { clearShopifyCartSessionId, getShopifyCartSessionId } from "@/lib/shopify/session";
import type { ShopifyCartResponse } from "@/lib/shopify/types";

export const dynamic = "force-dynamic";

function checkoutResponse(
  payload: Omit<ShopifyCartResponse, "warnings" | "userErrors"> & { checkoutUrl?: string },
  status = 200,
): NextResponse {
  return NextResponse.json(
    { ...payload, warnings: [], userErrors: [] },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

function getBuyerIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const status = getShopifyConfigStatus();

    if (!status.configured) {
      return checkoutResponse(
        {
          configured: false,
          message: "Checkout is temporarily unavailable. Please try again later.",
        },
        503,
      );
    }

    const cartId = await getShopifyCartSessionId();

    if (!cartId) {
      return checkoutResponse(
        {
          configured: true,
          cart: null,
          message: "Your bag session has expired. Refresh your bag, then add your items again.",
        },
        404,
      );
    }

    const cart = await getCart(cartId, getBuyerIp(request));

    if (!cart) {
      await clearShopifyCartSessionId();
      return checkoutResponse(
        {
          configured: true,
          cart: null,
          message: "Your bag session has expired. Refresh your bag, then add your items again.",
        },
        404,
      );
    }

    if (cart.totalQuantity < 1) {
      return checkoutResponse(
        {
          configured: true,
          cart,
          message: "Your bag is empty. Add an item before starting checkout.",
        },
        400,
      );
    }

    const giftWrapIssue = getCartGiftWrapIssue(cart);

    if (giftWrapIssue) {
      return checkoutResponse({ configured: true, cart, message: giftWrapIssue }, 409);
    }

    return checkoutResponse({
      configured: true,
      cart,
      checkoutUrl: cart.checkoutUrl,
    });
  } catch (error) {
    console.error(
      "Unable to start Shopify checkout.",
      error instanceof Error ? error.name : "Unknown error",
    );
    return checkoutResponse(
      {
        configured: true,
        message: "We could not start checkout. Refresh your bag, then try checkout again.",
      },
      500,
    );
  }
}
