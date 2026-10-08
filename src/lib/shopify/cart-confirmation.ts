import {
  findGiftWrapParent,
  getCartGiftWrapIssue,
  getGiftWrapGroup,
  getGiftWrapLinesForParent,
  GIFT_WRAP_GROUP_ATTRIBUTE,
  isCartLinePlaceholder,
} from "@/lib/shopify/gift-wrap";
import type {
  ShopifyCartLine,
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

function matchesRequestedLine(
  cart: ShopifyCartSnapshot,
  item: ShopifyCartLine,
  requested: ShopifyCartLineInput,
  expectedParentVariantId: string | null,
): boolean {
  if (
    item.variantId !== requested.merchandiseId ||
    requested.attributes?.some(
      (attribute) =>
        !item.attributes?.some(
          (actual) => actual.key === attribute.key && actual.value === attribute.value,
        ),
    )
  ) {
    return false;
  }

  if (requested.parent?.lineId) {
    if (item.parentLineId === requested.parent.lineId) return true;

    const group = getRequestedGroup(requested);
    const parent = group ? findGiftWrapParent(cart, group) : null;
    return Boolean(
      parent &&
      expectedParentVariantId &&
      parent.variantId === expectedParentVariantId &&
      item.parentLineId === parent.id,
    );
  }

  if (requested.parent?.merchandiseId) {
    return cart.lines.some(
      (parent) =>
        parent.id === item.parentLineId && parent.variantId === requested.parent?.merchandiseId,
    );
  }

  return !item.parentLineId;
}

function getRequestedGroup(line: ShopifyCartLineInput): string | null {
  const groups = line.attributes?.filter(
    (attribute) => attribute.key === GIFT_WRAP_GROUP_ATTRIBUTE,
  );
  return groups?.length === 1 && groups[0].value.trim() ? groups[0].value : null;
}

function hasConfirmedAssociations(
  before: ShopifyCartSnapshot | null,
  after: ShopifyCartSnapshot,
  lines: ShopifyCartLineInput[],
): boolean {
  const requested = new Map<string, { line: ShopifyCartLineInput; quantity: number }>();

  for (const line of lines.filter((item) => item.parent || item.attributes?.length)) {
    const key = JSON.stringify([
      line.merchandiseId,
      line.attributes?.map((attribute) => [attribute.key, attribute.value]).sort() ?? [],
      line.parent?.lineId ?? null,
      line.parent?.merchandiseId ?? null,
    ]);
    const previous = requested.get(key);
    requested.set(key, { line, quantity: (previous?.quantity ?? 0) + line.quantity });
  }

  if (requested.size > 0 && getCartGiftWrapIssue(after)) {
    return false;
  }

  return Array.from(requested.values()).every(({ line, quantity }) => {
    const group = getRequestedGroup(line);
    const plannedParents = group
      ? lines.filter((input) => !input.parent && getRequestedGroup(input) === group)
      : [];
    const previousParent = before?.lines.find(
      (item) =>
        item.id === line.parent?.lineId &&
        !item.parentLineId &&
        group &&
        getGiftWrapGroup(item) === group,
    );
    const expectedParentVariantId =
      plannedParents.length === 1
        ? plannedParents[0].merchandiseId
        : plannedParents.length === 0
          ? (previousParent?.variantId ?? null)
          : null;
    const beforeQuantity = before
      ? before.lines.reduce(
          (total, item) =>
            total +
            (matchesRequestedLine(before, item, line, expectedParentVariantId) ? item.quantity : 0),
          0,
        )
      : 0;
    const afterQuantity = after.lines.reduce(
      (total, item) =>
        total +
        (matchesRequestedLine(after, item, line, expectedParentVariantId) ? item.quantity : 0),
      0,
    );

    return afterQuantity === beforeQuantity + quantity;
  });
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

  return (
    hasConfirmedAssociations(before, after, lines) &&
    Array.from(requestedQuantities).every(
      ([variantId, quantity]) =>
        (afterQuantities.get(variantId) ?? 0) === (beforeQuantities.get(variantId) ?? 0) + quantity,
    )
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

    const group = getGiftWrapGroup(line);

    if (group) {
      const matches = after.lines.filter(
        (item) =>
          !isCartLinePlaceholder(item) &&
          item.variantId === nextVariantId &&
          getGiftWrapGroup(item) === group,
      );

      if (matches.length !== 1 || matches[0].quantity !== nextQuantity) {
        return false;
      }

      if (line.parentLineId) {
        if (matches[0].parentLineId !== findGiftWrapParent(after, group)?.id) {
          return false;
        }
      } else if (getGiftWrapLinesForParent(before, line).length > 0) {
        if (
          matches[0].parentLineId ||
          getGiftWrapLinesForParent(after, matches[0]).length !==
            getGiftWrapLinesForParent(before, line).length
        ) {
          return false;
        }
      }

      if (getCartGiftWrapIssue(after)) {
        return false;
      }
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
