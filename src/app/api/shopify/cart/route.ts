import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartLines,
} from "@/lib/shopify/cart";
import {
  confirmCartLinesAdded,
  confirmCartLinesRemoved,
  confirmCartLinesUpdated,
} from "@/lib/shopify/cart-confirmation";
import { getShopifyConfigStatus } from "@/lib/shopify/config";
import {
  clearShopifyCartSessionId,
  getShopifyCartSessionId,
  setShopifyCartSessionId,
} from "@/lib/shopify/session";
import type { ShopifyCartMutationResult, ShopifyCartResponse } from "@/lib/shopify/types";

export const dynamic = "force-dynamic";

const addCartLinesSchema = z.object({
  lines: z
    .array(
      z.object({ merchandiseId: z.string().min(1), quantity: z.number().int().positive().max(25) }),
    )
    .min(1)
    .max(25),
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

function getBuyerIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}

type CartResponsePayload = Omit<ShopifyCartResponse, "warnings" | "userErrors"> &
  Partial<Pick<ShopifyCartResponse, "warnings" | "userErrors">>;

function cartResponse(payload: CartResponsePayload, status = 200): NextResponse {
  return NextResponse.json(
    {
      ...payload,
      warnings: payload.warnings ?? [],
      userErrors: payload.userErrors ?? [],
    },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

function getUnavailableResponse(): NextResponse {
  return cartResponse(
    {
      configured: false,
      message: "Shopping bag is temporarily unavailable. Please try again later.",
    },
    503,
  );
}

function mutationResponse(
  result: ShopifyCartMutationResult,
  confirmed: boolean,
  successStatus = 200,
): NextResponse {
  const hasErrors = result.userErrors.length > 0;
  const changeConfirmed = confirmed && !hasErrors;

  return cartResponse(
    {
      configured: true,
      ...(result.cart ? { cart: result.cart } : {}),
      warnings: result.warnings,
      userErrors: result.userErrors,
      confirmed: changeConfirmed,
      ...(hasErrors
        ? { message: result.userErrors.map((error) => error.message).join(" ") }
        : !changeConfirmed
          ? {
              message:
                "We could not confirm the full requested change. Review your updated bag before trying again.",
            }
          : {}),
    },
    hasErrors ? 409 : successStatus,
  );
}

function getExpiredResponse(): NextResponse {
  return cartResponse(
    {
      configured: true,
      cart: null,
      confirmed: false,
      message: "Your bag session has expired. Refresh your bag, then add your items again.",
    },
    404,
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const status = getShopifyConfigStatus();

    if (!status.configured) {
      return getUnavailableResponse();
    }

    const cartId = await getShopifyCartSessionId();

    if (!cartId) {
      return cartResponse({ configured: true, cart: null });
    }

    const cart = await getCart(cartId, getBuyerIp(request));

    if (!cart) {
      await clearShopifyCartSessionId();

      return cartResponse({ configured: true, cart: null });
    }

    return cartResponse({ configured: true, cart });
  } catch (error) {
    console.error(
      "Unable to load Shopify cart.",
      error instanceof Error ? error.name : "Unknown error",
    );
    return cartResponse(
      { configured: true, message: "We could not load your bag. Refresh your bag to try again." },
      500,
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
        return cartResponse(
          {
            configured: true,
            confirmed: false,
            message: "Please choose a valid item and a quantity from 1 to 25.",
          },
          400,
        );
      }
    }

    const parsedBody = rawBody ? addCartLinesSchema.safeParse(parsedJson) : null;

    if (rawBody && (!parsedBody || !parsedBody.success)) {
      return cartResponse(
        {
          configured: true,
          confirmed: false,
          message: "Please choose a valid item and a quantity from 1 to 25.",
        },
        400,
      );
    }

    const requestedLines = parsedBody?.success ? parsedBody.data.lines : undefined;

    const existingCartId = await getShopifyCartSessionId();

    if (existingCartId) {
      const existingCart = await getCart(existingCartId, buyerIp);

      if (existingCart) {
        if (!requestedLines) {
          return cartResponse({ configured: true, cart: existingCart });
        }

        const result = await addCartLines(existingCartId, requestedLines, buyerIp);

        return mutationResponse(
          result,
          confirmCartLinesAdded(existingCart, result.cart, requestedLines),
        );
      }

      await clearShopifyCartSessionId();
    }

    const createdCart = await createCart({
      buyerIp,
      lines: requestedLines,
    });

    if (createdCart.cartId) {
      await setShopifyCartSessionId(createdCart.cartId);
    }

    return mutationResponse(
      createdCart,
      confirmCartLinesAdded(null, createdCart.cart, requestedLines ?? []),
      201,
    );
  } catch (error) {
    console.error(
      "Unable to add Shopify cart lines.",
      error instanceof Error ? error.name : "Unknown error",
    );
    return cartResponse(
      {
        configured: true,
        confirmed: false,
        message:
          "We could not confirm whether the item was added. Refresh your bag and check its contents before trying again.",
      },
      500,
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const status = getShopifyConfigStatus();

    if (!status.configured) {
      return getUnavailableResponse();
    }

    const cartId = await getShopifyCartSessionId();

    if (!cartId) {
      return getExpiredResponse();
    }

    const parsed = updateCartLinesSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return cartResponse(
        {
          configured: true,
          confirmed: false,
          message: "Please choose a valid item or size and a quantity from 1 to 25.",
        },
        400,
      );
    }

    const buyerIp = getBuyerIp(request);
    const existingCart = await getCart(cartId, buyerIp);

    if (!existingCart) {
      await clearShopifyCartSessionId();
      return getExpiredResponse();
    }

    const result = await updateCartLines(cartId, parsed.data.lines, buyerIp);

    return mutationResponse(
      result,
      confirmCartLinesUpdated(existingCart, result.cart, parsed.data.lines),
    );
  } catch (error) {
    console.error(
      "Unable to update Shopify cart lines.",
      error instanceof Error ? error.name : "Unknown error",
    );
    return cartResponse(
      {
        configured: true,
        confirmed: false,
        message: "We could not confirm this bag change. Refresh your bag before trying again.",
      },
      500,
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const status = getShopifyConfigStatus();

    if (!status.configured) {
      return getUnavailableResponse();
    }

    const cartId = await getShopifyCartSessionId();

    if (!cartId) {
      return getExpiredResponse();
    }

    const parsed = removeCartLinesSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return cartResponse(
        {
          configured: true,
          confirmed: false,
          message: "Please choose an item in your bag to remove.",
        },
        400,
      );
    }

    const buyerIp = getBuyerIp(request);
    const existingCart = await getCart(cartId, buyerIp);

    if (!existingCart) {
      await clearShopifyCartSessionId();
      return getExpiredResponse();
    }

    const result = await removeCartLines(cartId, parsed.data.lineIds, buyerIp);

    return mutationResponse(result, confirmCartLinesRemoved(result.cart, parsed.data.lineIds));
  } catch (error) {
    console.error(
      "Unable to remove Shopify cart lines.",
      error instanceof Error ? error.name : "Unknown error",
    );
    return cartResponse(
      {
        configured: true,
        confirmed: false,
        message:
          "We could not confirm whether the item was removed. Refresh your bag before trying again.",
      },
      500,
    );
  }
}
