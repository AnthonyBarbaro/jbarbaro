import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  addCartLines,
  createCart,
  getCart,
  getCartWithLineAttributes,
  removeCartLines,
  updateCartLines,
} from "@/lib/shopify/cart";
import { confirmCartLinesAdded, confirmCartLinesRemoved } from "@/lib/shopify/cart-confirmation";
import { getShopifyConfigStatus } from "@/lib/shopify/config";
import {
  attachGiftWrapToCartLine,
  completeGiftWrapAddition,
  completeGiftWrapUpdates,
  confirmCartCleared,
  getCartClearLineIds,
  getGiftWrapRemovalLineIds,
  GiftWrapCartError,
  prepareGiftWrapAddition,
  prepareGiftWrapUpdates,
} from "@/lib/shopify/gift-wrap-cart.server";
import { getCartGiftWrapIssue } from "@/lib/shopify/gift-wrap";
import { getGiftWrapOffer } from "@/lib/shopify/gift-wrap-product.server";
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
      z.object({
        merchandiseId: z.string().min(1),
        quantity: z.number().int().positive().max(25),
        giftWrap: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(25),
});

const updateCartLinesSchema = z.union([
  z.object({
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
    giftWrap: z.undefined().optional(),
  }),
  z
    .object({
      giftWrap: z.object({ lineId: z.string().min(1) }).strict(),
      lines: z.undefined().optional(),
    })
    .strict(),
]);

const removeCartLinesSchema = z.union([
  z.object({ clear: z.literal(true), lineIds: z.undefined().optional() }),
  z.object({
    lineIds: z.array(z.string().min(1)).min(1).max(25),
    clear: z.undefined().optional(),
  }),
]);

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

async function mutationResponse(
  result: ShopifyCartMutationResult,
  confirmed: boolean,
  successStatus = 200,
  details: Pick<
    ShopifyCartResponse,
    "giftWrapGroupId" | "giftWrapIncomplete" | "giftWrapOffer" | "message"
  > = {},
): Promise<NextResponse> {
  const hasErrors = result.userErrors.length > 0;
  const changeConfirmed = confirmed && !hasErrors;

  return cartResponse(
    {
      configured: true,
      giftWrapOffer:
        "giftWrapOffer" in details
          ? details.giftWrapOffer
          : await getGiftWrapOffer().catch(() => null),
      ...(result.cart ? { cart: result.cart } : {}),
      warnings: result.warnings,
      userErrors: result.userErrors,
      confirmed: changeConfirmed,
      ...(details.giftWrapGroupId ? { giftWrapGroupId: details.giftWrapGroupId } : {}),
      ...(details.giftWrapIncomplete ? { giftWrapIncomplete: true } : {}),
      ...(details.message
        ? { message: details.message }
        : hasErrors
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

const pendingCartMutations = new Map<string, Promise<void>>();

async function serializeCartMutation(
  request: NextRequest,
  mutate: (request: NextRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  if (!getShopifyConfigStatus().configured) return getUnavailableResponse();

  let cartId: string | null;
  try {
    cartId = await getShopifyCartSessionId();
  } catch {
    return cartResponse(
      { configured: true, confirmed: false, message: "Refresh your bag before trying again." },
      500,
    );
  }
  if (!cartId) return mutate(request);

  const previous = pendingCartMutations.get(cartId) ?? Promise.resolve();
  let release: () => void = () => {};
  const completed = new Promise<void>((resolve) => {
    release = resolve;
  });
  const pending = previous.then(() => completed);
  pendingCartMutations.set(cartId, pending);
  await previous;
  try {
    // Serializes this server process; returned-cart checks also cover external cart changes.
    return await mutate(request);
  } finally {
    release();
    if (pendingCartMutations.get(cartId) === pending) pendingCartMutations.delete(cartId);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return serializeCartMutation(request, postCart);
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  return serializeCartMutation(request, patchCart);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return serializeCartMutation(request, deleteCart);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const status = getShopifyConfigStatus();

    if (!status.configured) {
      return getUnavailableResponse();
    }

    const cartId = await getShopifyCartSessionId();

    if (!cartId) {
      return cartResponse({
        configured: true,
        cart: null,
        giftWrapOffer: await getGiftWrapOffer().catch(() => null),
      });
    }

    const cart = await getCart(cartId, getBuyerIp(request));

    if (!cart) {
      await clearShopifyCartSessionId();

      return cartResponse({
        configured: true,
        cart: null,
        giftWrapOffer: await getGiftWrapOffer().catch(() => null),
      });
    }

    return cartResponse({
      configured: true,
      cart,
      giftWrapOffer: await getGiftWrapOffer().catch(() => null),
    });
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

async function postCart(request: NextRequest): Promise<NextResponse> {
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

    const requestedAddLines = parsedBody?.success ? parsedBody.data.lines : undefined;
    const offer = await getGiftWrapOffer().catch(() => null);
    const plan = prepareGiftWrapAddition(requestedAddLines ?? [], offer);
    const requestedLines = requestedAddLines ? plan.lines : undefined;

    const existingCartId = await getShopifyCartSessionId();

    if (existingCartId) {
      const existingCart = await getCart(existingCartId, buyerIp);

      if (existingCart) {
        if (!requestedLines) {
          return cartResponse({ configured: true, cart: existingCart, giftWrapOffer: offer });
        }

        const issue = getCartGiftWrapIssue(existingCart);

        if (issue) {
          return cartResponse(
            { configured: true, cart: existingCart, confirmed: false, message: issue },
            409,
          );
        }

        const result = await addCartLines(existingCartId, requestedLines, buyerIp);
        const addition = await completeGiftWrapAddition(
          existingCartId,
          existingCart,
          result,
          plan,
          buyerIp,
        );

        return mutationResponse(addition.result, addition.confirmed, 200, {
          ...addition,
          giftWrapOffer: offer,
        });
      }

      await clearShopifyCartSessionId();
    }

    const createdCart = await createCart({
      buyerIp,
      lines: requestedLines,
    });

    if (createdCart.cartId) {
      await setShopifyCartSessionId(createdCart.cartId);
      const addition = await completeGiftWrapAddition(
        createdCart.cartId,
        null,
        createdCart,
        plan,
        buyerIp,
      );

      return mutationResponse(addition.result, addition.confirmed, 201, {
        ...addition,
        giftWrapOffer: offer,
      });
    }

    return mutationResponse(
      createdCart,
      confirmCartLinesAdded(null, createdCart.cart, requestedLines ?? []),
      201,
      { giftWrapOffer: offer },
    );
  } catch (error) {
    if (error instanceof GiftWrapCartError) {
      return cartResponse({ configured: true, confirmed: false, message: error.message }, 409);
    }

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

async function patchCart(request: NextRequest): Promise<NextResponse> {
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
    const { cart: existingCart, lineAttributes } = await getCartWithLineAttributes(cartId, buyerIp);

    if (!existingCart) {
      await clearShopifyCartSessionId();
      return getExpiredResponse();
    }

    if (parsed.data.giftWrap) {
      const giftWrapOffer = await getGiftWrapOffer().catch(() => null);
      const attachment = await attachGiftWrapToCartLine(
        cartId,
        existingCart,
        parsed.data.giftWrap.lineId,
        lineAttributes,
        giftWrapOffer,
        buyerIp,
      );
      return mutationResponse(attachment.result, attachment.confirmed, 200, {
        ...attachment,
        giftWrapOffer,
      });
    }

    const expandedLines = prepareGiftWrapUpdates(existingCart, parsed.data.lines);
    const result = await updateCartLines(cartId, parsed.data.lines, buyerIp);
    const update = await completeGiftWrapUpdates(
      cartId,
      existingCart,
      result,
      parsed.data.lines,
      expandedLines,
      buyerIp,
    );

    return mutationResponse(update.result, update.confirmed, 200, update);
  } catch (error) {
    if (error instanceof GiftWrapCartError) {
      return cartResponse({ configured: true, confirmed: false, message: error.message }, 409);
    }

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

async function deleteCart(request: NextRequest): Promise<NextResponse> {
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

    const clearingBag = parsed.data.clear === true;
    const requestedLineIds =
      parsed.data.clear === true ? getCartClearLineIds(existingCart) : parsed.data.lineIds;
    const removedLineIds = clearingBag
      ? existingCart.lines.map((line) => line.id)
      : getGiftWrapRemovalLineIds(existingCart, requestedLineIds);
    if (clearingBag && requestedLineIds.length === 0) {
      return mutationResponse(
        { cart: existingCart, warnings: [], userErrors: [] },
        confirmCartCleared(existingCart),
      );
    }
    const result = await removeCartLines(cartId, requestedLineIds, buyerIp);

    return mutationResponse(
      result,
      confirmCartLinesRemoved(result.cart, removedLineIds) &&
        !getCartGiftWrapIssue(result.cart) &&
        (!clearingBag || confirmCartCleared(result.cart)),
    );
  } catch (error) {
    if (error instanceof GiftWrapCartError) {
      return cartResponse({ configured: true, confirmed: false, message: error.message }, 409);
    }

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
