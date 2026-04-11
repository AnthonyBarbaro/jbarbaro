import { NextRequest, NextResponse } from "next/server";

import { getCart } from "@/lib/shopify/cart";
import { getShopifyConfigStatus } from "@/lib/shopify/config";
import { clearShopifyCartSessionId, getShopifyCartSessionId } from "@/lib/shopify/session";

export const dynamic = "force-dynamic";

function getBuyerIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}

export async function POST(request: NextRequest) {
  try {
    const status = getShopifyConfigStatus();

    if (!status.configured) {
      return NextResponse.json(
        {
          configured: false,
          missingKeys: status.missingKeys,
          message: "Checkout is temporarily unavailable.",
        },
        { status: 503 },
      );
    }

    const cartId = await getShopifyCartSessionId();

    if (!cartId) {
      return NextResponse.json({ message: "No active cart session." }, { status: 404 });
    }

    const cart = await getCart(cartId, getBuyerIp(request));

    if (!cart) {
      await clearShopifyCartSessionId();
      return NextResponse.json({ message: "Cart session has expired." }, { status: 404 });
    }

    return NextResponse.json({
      configured: true,
      checkoutUrl: cart.checkoutUrl,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unexpected checkout error." }, { status: 500 });
  }
}
