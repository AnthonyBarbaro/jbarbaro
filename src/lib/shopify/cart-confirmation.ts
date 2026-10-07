import type {
  ShopifyCartLineInput,
  ShopifyCartLineUpdate,
  ShopifyCartSnapshot,
} from "@/lib/shopify/types";

function hasCompleteLines(cart: ShopifyCartSnapshot): boolean {
  return cart.lines.reduce((quantity, line) => quantity + line.quantity, 0) === cart.totalQuantity;
}

function variantQuantities(cart: ShopifyCartSnapshot | null): Map<string, number> {
  const quantities = new Map<string, number>();

  for (const line of cart?.lines ?? []) {
    if (line.variantId) {
      quantities.set(line.variantId, (quantities.get(line.variantId) ?? 0) + line.quantity);
    }
  }

  return quantities;
}

export function confirmCartLinesAdded(
  before: ShopifyCartSnapshot | null,
  after: ShopifyCartSnapshot | null,
  lines: ShopifyCartLineInput[],
): boolean {
  if (!after || !hasCompleteLines(after) || (before && !hasCompleteLines(before))) {
    return false;
  }

  const beforeQuantities = variantQuantities(before);
  const afterQuantities = variantQuantities(after);
  const requestedQuantities = new Map<string, number>();

  for (const line of lines) {
    requestedQuantities.set(
      line.merchandiseId,
      (requestedQuantities.get(line.merchandiseId) ?? 0) + line.quantity,
    );
  }

  return Array.from(requestedQuantities).every(
    ([variantId, quantity]) =>
      (afterQuantities.get(variantId) ?? 0) === (beforeQuantities.get(variantId) ?? 0) + quantity,
  );
}

export function confirmCartLinesUpdated(
  before: ShopifyCartSnapshot,
  after: ShopifyCartSnapshot | null,
  lines: ShopifyCartLineUpdate[],
): boolean {
  if (!after || !hasCompleteLines(before) || !hasCompleteLines(after)) {
    return false;
  }

  const expectedQuantities = variantQuantities(before);
  const afterQuantities = variantQuantities(after);
  const touchedVariants = new Set<string>();
  const touchedLines = new Set<string>();

  for (const update of lines) {
    const line = before.lines.find((item) => item.id === update.id);

    if (!line?.variantId || touchedLines.has(update.id)) {
      return false;
    }

    touchedLines.add(update.id);
    const nextVariantId = update.merchandiseId ?? line.variantId;
    const nextQuantity = update.quantity ?? line.quantity;
    const survivingLine = after.lines.find((item) => item.id === update.id);

    if (
      survivingLine &&
      (survivingLine.variantId !== nextVariantId || survivingLine.quantity !== nextQuantity)
    ) {
      return false;
    }

    expectedQuantities.set(
      line.variantId,
      (expectedQuantities.get(line.variantId) ?? 0) - line.quantity,
    );
    expectedQuantities.set(
      nextVariantId,
      (expectedQuantities.get(nextVariantId) ?? 0) + nextQuantity,
    );
    touchedVariants.add(line.variantId);
    touchedVariants.add(nextVariantId);
  }

  return Array.from(touchedVariants).every(
    (variantId) =>
      (afterQuantities.get(variantId) ?? 0) === (expectedQuantities.get(variantId) ?? 0),
  );
}

export function confirmCartLinesRemoved(
  after: ShopifyCartSnapshot | null,
  lineIds: string[],
): boolean {
  return Boolean(
    after &&
    hasCompleteLines(after) &&
    lineIds.every((id) => !after.lines.some((line) => line.id === id)),
  );
}
