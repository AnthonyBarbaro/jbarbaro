import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartLines,
} from "@/lib/shopify/cart";
import { getShopifyConfigStatus } from "@/lib/shopify/config";
import {
  clearShopifyCartSessionId,
  getShopifyCartSessionId,
  setShopifyCartSessionId,
} from "@/lib/shopify/session";

export const dynamic = "force-dynamic";

const addCartLinesSchema = z.object({
  lines: z.array(z.object({ merchandiseId: z.string().min(1), quantity: z.number().int().positive().max(25) })).min(1).max(25),
});

const updateCartLinesSchema = z.object({
  lines: z
    .array(
      z
        .object({
          id: z.string().min(1),
          quantity: z.number().int().positive().max(25).optional(),
          merchandiseId: z.string().min(1).optional(),
        })
        .refine((line) => line.quantity !== undefined || line.merchandiseId !== undefined, {
          message: "Provide a quantity or variant.",
        }),
    )
    .min(1)
    .max(25),
});

const removeCartLinesSchema = z.object({
  lineIds: z.array(z.string().min(1)).min(1).max(25),
});

function getBuyerIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}

function getUnavailableResponse() {
  const status = getShopifyConfigStatus();

  return NextResponse.json(
    {
      configured: false,
      missingKeys: status.missingKeys,
      message: "Shopping bag is temporarily unavailable.",
    },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const status = getShopifyConfigStatus();

    if (!status.configured) {
      return getUnavailableResponse();
    }

    const cartId = await getShopifyCartSessionId();

    if (!cartId) {
      return NextResponse.json({ configured: true, cart: null });
    }

    const cart = await getCart(cartId, getBuyerIp(request));

    if (!cart) {
      await clearShopifyCartSessionId();

      return NextResponse.json({ configured: true, cart: null });
    }

    return NextResponse.json({ configured: true, cart });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unexpected bag error." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const status = getShopifyConfigStatus();

    if (!status.configured) {
      return getUnavailableResponse();
    }

    const buyerIp = getBuyerIp(request);
    const rawBody = await request.text();
    let parsedJson: unknown = null;

    if (rawBody) {
      try {
        parsedJson = JSON.parse(rawBody) as unknown;
      } catch {
        return NextResponse.json({ message: "Invalid cart line items." }, { status: 400 });
      }
    }

    const parsedBody = rawBody ? addCartLinesSchema.safeParse(parsedJson) : null;

    if (rawBody && (!parsedBody || !parsedBody.success)) {
      return NextResponse.json({ message: "Invalid cart line items." }, { status: 400 });
    }

    const requestedLines = parsedBody?.success ? parsedBody.data.lines : undefined;

    const existingCartId = await getShopifyCartSessionId();

    if (existingCartId) {
      const existingCart = await getCart(existingCartId, buyerIp);

      if (existingCart) {
        if (!requestedLines) {
          return NextResponse.json({ configured: true, cart: existingCart });
        }

        const updatedCart = await addCartLines(existingCartId, requestedLines, buyerIp);

        return NextResponse.json({ configured: true, cart: updatedCart });
      }

      await clearShopifyCartSessionId();
    }

    const createdCart = await createCart({
      buyerIp,
      lines: requestedLines,
    });

    await setShopifyCartSessionId(createdCart.cartId);

    return NextResponse.json({ configured: true, cart: createdCart.cart }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unexpected bag error." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const status = getShopifyConfigStatus();

    if (!status.configured) {
      return getUnavailableResponse();
    }

    const cartId = await getShopifyCartSessionId();

    if (!cartId) {
      return NextResponse.json({ message: "No active cart session." }, { status: 404 });
    }

    const parsed = updateCartLinesSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid cart line update payload." }, { status: 400 });
    }

    const cart = await updateCartLines(cartId, parsed.data.lines, getBuyerIp(request));

    return NextResponse.json({ configured: true, cart });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unexpected bag error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const status = getShopifyConfigStatus();

    if (!status.configured) {
      return getUnavailableResponse();
    }

    const cartId = await getShopifyCartSessionId();

    if (!cartId) {
      return NextResponse.json({ message: "No active cart session." }, { status: 404 });
    }

    const parsed = removeCartLinesSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid cart line removal payload." }, { status: 400 });
    }

    const cart = await removeCartLines(cartId, parsed.data.lineIds, getBuyerIp(request));

    return NextResponse.json({ configured: true, cart });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unexpected bag error." }, { status: 500 });
  }
}
