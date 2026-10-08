import type { ShopifyCartLine, ShopifyCartSnapshot, ShopifyCartWarning } from "@/lib/shopify/types";

export const GIFT_WRAP_PRODUCT_HANDLE = "gift-wrap";
export const GIFT_WRAP_GROUP_ATTRIBUTE = "_gift_wrap_group";

export function getGiftWrapGroup(line: ShopifyCartLine): string | null {
  const groups = line.attributes?.filter(
    (attribute) => attribute.key === GIFT_WRAP_GROUP_ATTRIBUTE,
  );

  return groups?.length === 1 && groups[0].value.trim() ? groups[0].value : null;
}

export function isGiftWrapLine(line: ShopifyCartLine): boolean {
  return line.productHandle?.trim().toLowerCase() === GIFT_WRAP_PRODUCT_HANDLE;
}

export function isCartLinePlaceholder(line: ShopifyCartLine): boolean {
  return (
    line.quantity === 0 &&
    line.totalPrice.amount.trim() !== "" &&
    Number(line.totalPrice.amount) === 0
  );
}

export function getGiftWrapLinesForParent(
  cart: ShopifyCartSnapshot,
  parent: ShopifyCartLine,
): ShopifyCartLine[] {
  return cart.lines.filter(
    (line) =>
      isGiftWrapLine(line) && !isCartLinePlaceholder(line) && line.parentLineId === parent.id,
  );
}

export function findGiftWrapParent(
  cart: ShopifyCartSnapshot,
  groupId: string,
): ShopifyCartLine | null {
  const parents = cart.lines.filter(
    (line) =>
      !isGiftWrapLine(line) &&
      !isCartLinePlaceholder(line) &&
      !line.parentLineId &&
      getGiftWrapGroup(line) === groupId,
  );

  return parents.length === 1 ? parents[0] : null;
}

export function getCartItemQuantity(cart: ShopifyCartSnapshot | null): number {
  return (cart?.lines ?? []).reduce(
    (quantity, line) => quantity + (isGiftWrapLine(line) || line.parentLineId ? 0 : line.quantity),
    0,
  );
}

export function getCartVariantQuantityLimits(
  cart: ShopifyCartSnapshot | null,
  warnings: readonly ShopifyCartWarning[],
): Map<string, number> {
  const limits = new Map<string, number>();

  if (
    !cart ||
    cart.lines.reduce((quantity, line) => quantity + line.quantity, 0) !== cart.totalQuantity
  ) {
    return limits;
  }

  for (const warning of warnings) {
    if (
      warning.code !== "MERCHANDISE_OUT_OF_STOCK" &&
      warning.code !== "MERCHANDISE_NOT_ENOUGH_STOCK"
    ) {
      continue;
    }

    const affectedLine = cart.lines.find((line) => line.id === warning.target);

    if (affectedLine?.variantId) {
      const quantity = cart.lines.reduce(
        (total, line) =>
          total +
          (line.variantId === affectedLine.variantId && line.quantity > 0 ? line.quantity : 0),
        0,
      );
      limits.set(affectedLine.variantId, quantity);
    }
  }

  return limits;
}

export function getCartGiftWrapIssue(cart: ShopifyCartSnapshot | null): string | null {
  if (!cart) {
    return null;
  }

  if (cart.lines.reduce((quantity, line) => quantity + line.quantity, 0) !== cart.totalQuantity) {
    return "We could not load every item in your bag. Refresh your bag before checking out.";
  }

  if (cart.lines.some((line) => line.quantity === 0 && !isCartLinePlaceholder(line))) {
    return "An unavailable item still has a charge in your bag. Remove it or refresh your bag before checking out.";
  }

  if (
    cart.lines.some(
      (line) => line.parentLineId && !isCartLinePlaceholder(line) && !isGiftWrapLine(line),
    )
  ) {
    return "We could not confirm an attached add-on. Remove the unavailable add-on before checking out.";
  }

  for (const line of cart.lines.filter(
    (item) => isGiftWrapLine(item) && !isCartLinePlaceholder(item),
  )) {
    const parent = cart.lines.find(
      (item) => item.id === line.parentLineId && !isCartLinePlaceholder(item),
    );

    if (!parent || isGiftWrapLine(parent) || parent.parentLineId) {
      return "Gift wrap is missing its attached item. Remove the gift wrap before checking out.";
    }

    const group = getGiftWrapGroup(line);

    if (
      !group ||
      group !== getGiftWrapGroup(parent) ||
      findGiftWrapParent(cart, group)?.id !== parent.id
    ) {
      return "We could not confirm which item this gift wrap belongs to. Remove the gift wrap before checking out.";
    }

    if (getGiftWrapLinesForParent(cart, parent).length !== 1) {
      return "An item has duplicate gift-wrap charges. Remove the extra gift wrap before checking out.";
    }

    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity !== parent.quantity
    ) {
      return "Gift-wrap quantities do not match their items. Update gift wrap or remove it before checking out.";
    }

    if (
      line.unitPrice.currencyCode !== parent.unitPrice.currencyCode ||
      line.totalPrice.currencyCode !== parent.totalPrice.currencyCode ||
      line.totalPrice.currencyCode !== cart.total.currencyCode
    ) {
      return "The gift-wrap price could not be confirmed. Refresh your bag or remove gift wrap before checking out.";
    }
  }

  return null;
}
