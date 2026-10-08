import "server-only";

import { randomUUID } from "node:crypto";

import { addCartLines, removeCartLines, updateCartLines } from "@/lib/shopify/cart";
import { confirmCartLinesAdded, confirmCartLinesUpdated } from "@/lib/shopify/cart-confirmation";
import {
  findGiftWrapParent,
  getCartGiftWrapIssue,
  getGiftWrapGroup,
  getGiftWrapLinesForParent,
  GIFT_WRAP_GROUP_ATTRIBUTE,
  isCartLinePlaceholder,
  isGiftWrapLine,
} from "@/lib/shopify/gift-wrap";
import type {
  ShopifyCartLineInput,
  ShopifyCartLine,
  ShopifyCartLineUpdate,
  ShopifyCartMutationResult,
  ShopifyCartSnapshot,
  ShopifyGiftWrapOffer,
} from "@/lib/shopify/types";

type AddRequestLine = Pick<ShopifyCartLineInput, "merchandiseId" | "quantity"> & {
  giftWrap?: boolean;
};

export type GiftWrapAdditionPlan = {
  lines: ShopifyCartLineInput[];
  groupId: string | null;
  offer: ShopifyGiftWrapOffer | null;
};

export type GiftWrapAdditionResult = {
  result: ShopifyCartMutationResult;
  confirmed: boolean;
  giftWrapGroupId?: string;
  giftWrapIncomplete?: boolean;
  message?: string;
};

export class GiftWrapCartError extends Error {}

function mergeMutationResults(
  previous: ShopifyCartMutationResult,
  next: ShopifyCartMutationResult,
): ShopifyCartMutationResult {
  const warnings = new Map(
    [...previous.warnings, ...next.warnings].map((warning) => [
      JSON.stringify([warning.code, warning.target]),
      warning,
    ]),
  );

  return {
    cart: next.cart ?? previous.cart,
    warnings: Array.from(warnings.values()),
    userErrors: [...previous.userErrors, ...next.userErrors],
  };
}

function itemsUnchangedAfterWrapping(
  before: ShopifyCartSnapshot,
  after: ShopifyCartSnapshot | null,
  parent: ShopifyCartLine,
  groupId: string,
): boolean {
  if (!after || getCartGiftWrapIssue(after)) return false;

  const identities = (cart: ShopifyCartSnapshot): string[] =>
    cart.lines
      .filter((line) => !isGiftWrapLine(line) && !isCartLinePlaceholder(line))
      .map((line) =>
        JSON.stringify([
          line.id === parent.id ? groupId : getGiftWrapGroup(line),
          line.variantId,
          line.quantity,
        ]),
      )
      .sort();

  return JSON.stringify(identities(before)) === JSON.stringify(identities(after));
}

export async function attachGiftWrapToCartLine(
  cartId: string,
  before: ShopifyCartSnapshot,
  lineId: string,
  lineAttributes: Map<string, { key: string; value: string }[]>,
  offer: ShopifyGiftWrapOffer | null,
  buyerIp?: string | null,
): Promise<GiftWrapAdditionResult> {
  const issue = getCartGiftWrapIssue(before);
  if (issue) throw new GiftWrapCartError(issue);

  const originalParent = before.lines.find((line) => line.id === lineId);
  if (
    !originalParent ||
    !originalParent.variantId ||
    isGiftWrapLine(originalParent) ||
    originalParent.parentLineId ||
    !Number.isInteger(originalParent.quantity) ||
    originalParent.quantity < 1
  ) {
    throw new GiftWrapCartError("Choose an item in your bag to gift wrap.");
  }

  const attributes = lineAttributes.get(originalParent.id);
  const existingGroup = getGiftWrapGroup(originalParent);
  if (
    !attributes ||
    (attributes.some((attribute) => attribute.key === GIFT_WRAP_GROUP_ATTRIBUTE) &&
      !existingGroup) ||
    (existingGroup && findGiftWrapParent(before, existingGroup)?.id !== originalParent.id)
  ) {
    throw new GiftWrapCartError("Refresh your bag before adding gift wrap to this item.");
  }

  let result: ShopifyCartMutationResult = { cart: before, warnings: [], userErrors: [] };
  if (existingGroup && getGiftWrapLinesForParent(before, originalParent).length === 1) {
    return { result, confirmed: true, giftWrapGroupId: existingGroup };
  }

  if (!offer?.availableForSale) {
    throw new GiftWrapCartError("Gift wrap is currently unavailable.");
  }
  if (offer.price.currencyCode !== originalParent.unitPrice.currencyCode) {
    throw new GiftWrapCartError("Refresh your bag to confirm the gift-wrap price.");
  }

  const groupId = existingGroup ?? randomUUID();
  const message = "We could not confirm gift wrap. Review your bag before trying again.";

  if (!existingGroup) {
    if (attributes.length >= 250) {
      throw new GiftWrapCartError("Gift wrap could not be attached to this item.");
    }
    try {
      result = await updateCartLines(
        cartId,
        [
          {
            id: originalParent.id,
            attributes: [...attributes, { key: GIFT_WRAP_GROUP_ATTRIBUTE, value: groupId }],
          },
        ],
        buyerIp,
      );
    } catch {
      // Metadata may have changed despite a lost response. Never repeat the write automatically.
      return { result, confirmed: false, giftWrapIncomplete: true, message };
    }
  }

  const prepared = result.cart;
  const parent = prepared ? findGiftWrapParent(prepared, groupId) : null;
  if (
    result.userErrors.length ||
    !parent ||
    parent.variantId !== originalParent.variantId ||
    parent.quantity !== originalParent.quantity ||
    !itemsUnchangedAfterWrapping(before, prepared, originalParent, groupId)
  ) {
    return { result, confirmed: false, giftWrapIncomplete: true, message };
  }

  const child: ShopifyCartLineInput = {
    merchandiseId: offer.merchandiseId,
    quantity: parent.quantity,
    parent: { lineId: parent.id },
    attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: groupId }],
  };

  try {
    const wrapping = await addCartLines(cartId, [child], buyerIp);
    const confirmed =
      wrapping.userErrors.length === 0 &&
      confirmCartLinesAdded(prepared, wrapping.cart, [child]) &&
      itemsUnchangedAfterWrapping(before, wrapping.cart, originalParent, groupId);
    result = mergeMutationResults(result, wrapping);
    return {
      result,
      confirmed,
      ...(confirmed ? { giftWrapGroupId: groupId } : { giftWrapIncomplete: true, message }),
    };
  } catch {
    return { result, confirmed: false, giftWrapIncomplete: true, message };
  }
}

export function prepareGiftWrapAddition(
  lines: AddRequestLine[],
  offer: ShopifyGiftWrapOffer | null,
): GiftWrapAdditionPlan {
  const requested = lines.filter((line) => line.giftWrap);
  const plainLines = lines.map(({ merchandiseId, quantity }) => ({ merchandiseId, quantity }));

  if (requested.length === 0) {
    return { lines: plainLines, groupId: null, offer: null };
  }

  if (lines.length !== 1) {
    throw new GiftWrapCartError("Add gift wrap to one item at a time.");
  }

  if (!offer?.availableForSale) {
    throw new GiftWrapCartError(
      "Gift wrap is currently unavailable. Uncheck gift wrap to add this item on its own.",
    );
  }

  if (plainLines[0].merchandiseId === offer.merchandiseId) {
    throw new GiftWrapCartError(
      "Choose gift wrap on the product page of the item you want wrapped.",
    );
  }

  const groupId = randomUUID();

  return {
    lines: plainLines.map((line) => ({
      ...line,
      attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: groupId }],
    })),
    groupId,
    offer,
  };
}

export async function completeGiftWrapAddition(
  cartId: string,
  before: ShopifyCartSnapshot | null,
  parentResult: ShopifyCartMutationResult,
  plan: GiftWrapAdditionPlan,
  buyerIp?: string | null,
): Promise<GiftWrapAdditionResult> {
  const parentConfirmed =
    parentResult.userErrors.length === 0 &&
    confirmCartLinesAdded(before, parentResult.cart, plan.lines);
  const issue = getCartGiftWrapIssue(parentResult.cart);

  if (!plan.groupId || !plan.offer) {
    return {
      result: parentResult,
      confirmed: parentConfirmed && !issue,
      ...(issue ? { message: issue } : {}),
    };
  }

  const parent = parentResult.cart ? findGiftWrapParent(parentResult.cart, plan.groupId) : null;
  const acceptedLines = parent
    ? plan.lines.map((line) => ({ ...line, quantity: parent.quantity }))
    : [];
  const acceptedParentConfirmed =
    parentResult.userErrors.length === 0 &&
    parent &&
    parent.quantity > 0 &&
    parent.quantity <= plan.lines[0].quantity &&
    confirmCartLinesAdded(before, parentResult.cart, acceptedLines);

  if (!acceptedParentConfirmed || !parent || issue) {
    return {
      result: parentResult,
      confirmed: false,
      message:
        issue ||
        "We could not confirm the item and gift wrap. Review your bag before trying again.",
    };
  }

  const child: ShopifyCartLineInput = {
    merchandiseId: plan.offer.merchandiseId,
    quantity: parent.quantity,
    parent: { lineId: parent.id },
    attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: plan.groupId }],
  };
  const partialMessage =
    "Your item was added, but we could not confirm gift wrap. Review your bag before trying again.";

  try {
    const wrapResult = await addCartLines(cartId, [child], buyerIp);
    const result = mergeMutationResults(parentResult, wrapResult);
    const wrapConfirmed =
      wrapResult.userErrors.length === 0 &&
      confirmCartLinesAdded(before, wrapResult.cart, [...acceptedLines, child]) &&
      !getCartGiftWrapIssue(wrapResult.cart);
    const confirmed = parentConfirmed && wrapConfirmed;

    return {
      result,
      confirmed,
      ...(confirmed
        ? { giftWrapGroupId: plan.groupId }
        : {
            ...(!wrapConfirmed ? { giftWrapIncomplete: true } : {}),
            message: wrapConfirmed
              ? `Only ${parent.quantity} of the ${plan.lines[0].quantity} requested items could be added. Gift wrap was added for the accepted item quantity.`
              : partialMessage,
          }),
    };
  } catch {
    // A lost response can hide a successful write. Preserve the known bag and require review.
    return {
      result: parentResult,
      confirmed: false,
      giftWrapIncomplete: true,
      message: partialMessage,
    };
  }
}

export async function completeGiftWrapUpdates(
  cartId: string,
  before: ShopifyCartSnapshot,
  parentResult: ShopifyCartMutationResult,
  requested: ShopifyCartLineUpdate[],
  expected: ShopifyCartLineUpdate[],
  buyerIp?: string | null,
): Promise<GiftWrapAdditionResult> {
  let result = parentResult;
  const cart = parentResult.cart;

  if (cart && cart.lines.reduce((total, line) => total + line.quantity, 0) === cart.totalQuantity) {
    const childUpdates: ShopifyCartLineUpdate[] = [];
    const childRemovals: string[] = [];

    for (const update of requested) {
      const previous = before.lines.find((line) => line.id === update.id);
      const group = previous ? getGiftWrapGroup(previous) : null;

      if (!previous || !group || isGiftWrapLine(previous)) continue;

      const parents = cart.lines.filter(
        (line) => !isGiftWrapLine(line) && !line.parentLineId && getGiftWrapGroup(line) === group,
      );
      const parent = findGiftWrapParent(cart, group) ?? (parents.length === 1 ? parents[0] : null);

      if (!parent || !Number.isInteger(parent.quantity) || parent.quantity < 0) continue;

      for (const child of getGiftWrapLinesForParent(cart, parent)) {
        if (getGiftWrapGroup(child) !== group) continue;

        if (parent.quantity === 0 && child.instructions?.canRemove !== false) {
          childRemovals.push(child.id);
        } else if (
          parent.quantity > 0 &&
          child.quantity !== parent.quantity &&
          child.instructions?.canUpdateQuantity !== false
        ) {
          childUpdates.push({ id: child.id, quantity: parent.quantity });
        }
      }
    }

    // Shopify may cap the item quantity. Charge wrap only for the quantity actually accepted.
    try {
      if (childUpdates.length > 0) {
        const repaired = await updateCartLines(cartId, childUpdates, buyerIp);
        result = mergeMutationResults(result, repaired);
      }
      if (childRemovals.length > 0) {
        const repaired = await removeCartLines(cartId, childRemovals, buyerIp);
        result = mergeMutationResults(result, repaired);
      }
    } catch {
      return {
        result,
        confirmed: false,
        message:
          "We could not confirm the gift-wrap quantity. Review your bag before trying again.",
      };
    }
  }

  const issue = getCartGiftWrapIssue(result.cart);
  const confirmed =
    result.userErrors.length === 0 &&
    confirmCartLinesUpdated(before, result.cart, expected) &&
    confirmGiftWrapUpdates(before, result.cart, requested);
  const capped = requested.some((update) => {
    const previous = before.lines.find((line) => line.id === update.id);
    const group = previous ? getGiftWrapGroup(previous) : null;
    const actual =
      group && result.cart
        ? findGiftWrapParent(result.cart, group)
        : result.cart?.lines.find((line) => line.id === update.id);
    return update.quantity !== undefined && actual && actual.quantity < update.quantity;
  });

  return {
    result,
    confirmed,
    ...(issue
      ? { message: issue }
      : capped
        ? {
            message:
              "The requested quantity is unavailable. Your bag shows the quantity Shopify could provide.",
          }
        : {}),
  };
}

export function prepareGiftWrapUpdates(
  cart: ShopifyCartSnapshot,
  updates: ShopifyCartLineUpdate[],
): ShopifyCartLineUpdate[] {
  const expanded = [...updates];

  if (new Set(updates.map((update) => update.id)).size !== updates.length) {
    throw new GiftWrapCartError("Choose each item only once when changing your bag.");
  }

  for (const update of updates) {
    const parent = cart.lines.find((line) => line.id === update.id);

    if (!parent) {
      continue;
    }

    if (isGiftWrapLine(parent)) {
      throw new GiftWrapCartError(
        "Gift-wrap quantity follows its item. Change the item quantity or remove gift wrap.",
      );
    }

    if (
      update.merchandiseId &&
      update.merchandiseId !== parent.variantId &&
      getGiftWrapGroup(parent) &&
      !parent.variants.some(
        (variant) => variant.id === update.merchandiseId && variant.availableForSale,
      )
    ) {
      throw new GiftWrapCartError("Choose an available size or option for this item.");
    }

    if (
      update.quantity !== undefined &&
      update.quantity !== parent.quantity &&
      parent.instructions?.canUpdateQuantity === false
    ) {
      throw new GiftWrapCartError("The quantity of this item cannot be changed.");
    }

    for (const child of getGiftWrapLinesForParent(cart, parent)) {
      if (update.quantity !== undefined && update.quantity !== child.quantity) {
        if (child.instructions?.canUpdateQuantity === false) {
          throw new GiftWrapCartError(
            "Gift-wrap quantity cannot be changed for this item. Remove gift wrap before changing the item quantity.",
          );
        }

        expanded.push({ id: child.id, quantity: update.quantity });
      }
    }
  }

  return expanded;
}

export function confirmGiftWrapUpdates(
  before: ShopifyCartSnapshot,
  after: ShopifyCartSnapshot | null,
  updates: ShopifyCartLineUpdate[],
): boolean {
  if (!after || getCartGiftWrapIssue(after)) {
    return false;
  }

  return updates.every((update) => {
    const previous = before.lines.find((line) => line.id === update.id);
    const group = previous ? getGiftWrapGroup(previous) : null;

    if (!previous || !group || isGiftWrapLine(previous)) {
      return true;
    }

    const parent = findGiftWrapParent(after, group);

    return Boolean(
      parent &&
      parent.variantId === (update.merchandiseId ?? previous.variantId) &&
      parent.quantity === (update.quantity ?? previous.quantity) &&
      getGiftWrapLinesForParent(after, parent).length ===
        getGiftWrapLinesForParent(before, previous).length,
    );
  });
}

export function getGiftWrapRemovalLineIds(cart: ShopifyCartSnapshot, lineIds: string[]): string[] {
  const ids = new Set(lineIds);

  for (const parent of cart.lines.filter((line) => ids.has(line.id))) {
    if (parent.instructions?.canRemove === false) {
      throw new GiftWrapCartError("This item cannot be removed from the bag.");
    }

    for (const child of getGiftWrapLinesForParent(cart, parent)) {
      ids.add(child.id);
    }
  }

  return Array.from(ids);
}

export function getCartClearLineIds(cart: ShopifyCartSnapshot): string[] {
  if (cart.lines.reduce((quantity, line) => quantity + line.quantity, 0) !== cart.totalQuantity) {
    throw new GiftWrapCartError(
      "Refresh your bag before clearing it so every item can be removed.",
    );
  }

  const lineIds = new Set(cart.lines.map((line) => line.id));
  const roots = cart.lines.filter((line) => !line.parentLineId || !lineIds.has(line.parentLineId));

  if (roots.some((line) => line.instructions?.canRemove === false)) {
    throw new GiftWrapCartError(
      "An item cannot be removed right now. Refresh your bag to review it.",
    );
  }

  return roots.map((line) => line.id);
}

export function confirmCartCleared(cart: ShopifyCartSnapshot | null): boolean {
  return Boolean(
    cart &&
    cart.lines.length === 0 &&
    cart.totalQuantity === 0 &&
    cart.subtotal.amount.trim() !== "" &&
    Number(cart.subtotal.amount) === 0 &&
    cart.total.amount.trim() !== "" &&
    Number(cart.total.amount) === 0,
  );
}
