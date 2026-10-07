import "server-only";

import { SHOPIFY_IMAGE_FIELDS, storefrontRequest } from "@/lib/shopify/client";
import type {
  ShopifyCartLineInput,
  ShopifyCartLineUpdate,
  ShopifyCartMutationResult,
  ShopifyCartSnapshot,
  ShopifyCartUserError,
  ShopifyCartWarning,
  ShopifyMoney,
  ShopifyProductVariant,
} from "@/lib/shopify/types";

export type { ShopifyCartLineInput, ShopifyCartLineUpdate } from "@/lib/shopify/types";

type MoneyV2 = {
  amount: string;
  currencyCode: string;
};

type RawCart = {
  id?: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: MoneyV2;
    totalAmount: MoneyV2;
    totalTaxAmount: MoneyV2 | null;
  };
  lines: {
    nodes: RawCartLine[];
  };
};

type RawProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: MoneyV2;
  compareAtPrice: MoneyV2 | null;
  selectedOptions: { name: string; value: string }[];
};

type RawCartLine = {
  id: string;
  quantity: number;
  cost: {
    totalAmount: MoneyV2;
    amountPerQuantity: MoneyV2;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: { name: string; value: string }[];
    image: {
      url: string;
      altText: string | null;
      width: number | null;
      height: number | null;
    } | null;
    product: {
      title: string;
      handle: string;
      productType: string;
      variants: {
        nodes: RawProductVariant[];
      };
    };
  } | null;
};

type CartUserError = {
  code: string | null;
  field: string[] | null;
  message: string;
};

type CartWarning = {
  code: string;
  message: string;
  target: string;
};

type CartMutationPayload = {
  cart: RawCart | null;
  userErrors: CartUserError[];
  warnings: CartWarning[];
};

type CartQueryResponse = {
  cart: RawCart | null;
};

type CartCreateResponse = {
  cartCreate: CartMutationPayload;
};

type CartLinesAddResponse = {
  cartLinesAdd: CartMutationPayload;
};

type CartLinesUpdateResponse = {
  cartLinesUpdate: CartMutationPayload;
};

type CartLinesRemoveResponse = {
  cartLinesRemove: CartMutationPayload;
};

const CART_FRAGMENT = `
  fragment CartSnapshotFields on Cart {
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
          amountPerQuantity {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            selectedOptions {
              name
              value
            }
            image {
              ${SHOPIFY_IMAGE_FIELDS}
            }
            product {
              title
              handle
              productType
              variants(first: 100) {
                nodes {
                  id
                  title
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function toCartMoney(value: MoneyV2): ShopifyMoney {
  return {
    amount: value.amount,
    currencyCode: value.currencyCode,
  };
}

function normalizeCartVariants(nodes: RawProductVariant[]): ShopifyProductVariant[] {
  return (Array.isArray(nodes) ? nodes : []).map((variant) => ({
    id: variant.id,
    title: variant.title,
    availableForSale: variant.availableForSale,
    price: toCartMoney(variant.price),
    compareAtPrice: variant.compareAtPrice ? toCartMoney(variant.compareAtPrice) : null,
    selectedOptions: variant.selectedOptions,
  }));
}

function normalizeCart(cart: RawCart): ShopifyCartSnapshot {
  return {
    totalQuantity: cart.totalQuantity,
    checkoutUrl: cart.checkoutUrl,
    subtotal: toCartMoney(cart.cost.subtotalAmount),
    total: toCartMoney(cart.cost.totalAmount),
    tax: cart.cost.totalTaxAmount ? toCartMoney(cart.cost.totalTaxAmount) : null,
    lines: cart.lines.nodes.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      variantId: line.merchandise?.id ?? null,
      variantTitle: line.merchandise?.title ?? null,
      productTitle: line.merchandise?.product.title ?? null,
      productHandle: line.merchandise?.product.handle ?? null,
      productType: line.merchandise?.product.productType ?? null,
      selectedOptions: line.merchandise?.selectedOptions ?? [],
      image: line.merchandise?.image ?? null,
      unitPrice: toCartMoney(line.cost.amountPerQuantity),
      totalPrice: toCartMoney(line.cost.totalAmount),
      variants: line.merchandise
        ? normalizeCartVariants(line.merchandise.product.variants.nodes)
        : [],
    })),
  };
}

function normalizeWarning(warning: CartWarning): ShopifyCartWarning {
  const code = /^[A-Z][A-Z0-9_]{0,100}$/.test(warning.code) ? warning.code : "UNKNOWN";
  let message = "Your bag was adjusted. Review your items and totals before checking out.";

  if (code === "MERCHANDISE_OUT_OF_STOCK") {
    message = "An item in your bag is now sold out. Review your bag before checking out.";
  } else if (code === "MERCHANDISE_NOT_ENOUGH_STOCK") {
    message = "The requested quantity is not available. Review the updated quantity in your bag.";
  } else if (code.startsWith("DISCOUNT_")) {
    message = "A discount could not be applied. Review your bag totals before checking out.";
  }

  return {
    code,
    message,
    target:
      warning.target.startsWith("gid://shopify/CartLine/") && !/[?&]key=/i.test(warning.target)
        ? warning.target
        : null,
  };
}

function normalizeUserError(error: CartUserError): ShopifyCartUserError {
  const code = error.code && /^[A-Z][A-Z0-9_]{0,100}$/.test(error.code) ? error.code : null;
  let message =
    "We could not make this bag change. Refresh your bag and review your selection before trying again.";

  if (code === "MAXIMUM_EXCEEDED" || code === "LESS_THAN") {
    message = "The requested quantity exceeds the limit for this item. Choose a lower quantity.";
  } else if (code === "MINIMUM_NOT_MET") {
    message = "The requested quantity is below the minimum for this item. Review your quantity.";
  } else if (code === "INVALID_INCREMENT") {
    message = "This item requires a different quantity increment. Review your quantity.";
  } else if (code === "INVALID_MERCHANDISE_LINE") {
    message =
      "This item has changed or is no longer in your bag. Refresh your bag before trying again.";
  } else if (code === "MERCHANDISE_NOT_APPLICABLE" || code === "VARIANT_REQUIRES_SELLING_PLAN") {
    message = "This item cannot be purchased with the selected options. Review your selection.";
  } else if (code === "CART_TOO_LARGE") {
    message = "Your bag has reached its item limit. Remove an item before adding another.";
  } else if (code === "SERVICE_UNAVAILABLE") {
    message = "Shopping is temporarily unavailable. Refresh your bag before trying again.";
  }

  return {
    code,
    field: error.field?.every((part) => /^(?:[A-Za-z][A-Za-z0-9_]*|\d+)$/.test(part))
      ? error.field
      : null,
    message,
  };
}

function normalizeCartMutationResult(
  payload: CartMutationPayload | undefined,
  operation: string,
): ShopifyCartMutationResult {
  if (!payload) {
    throw new Error(`Shopify ${operation} did not return a payload.`);
  }

  if (!payload.cart && payload.userErrors.length === 0) {
    throw new Error(`Shopify ${operation} did not return a cart.`);
  }

  return {
    cart: payload.cart ? normalizeCart(payload.cart) : null,
    warnings: (payload.warnings ?? []).map(normalizeWarning),
    userErrors: payload.userErrors.map(normalizeUserError),
  };
}

export async function getCart(
  cartId: string,
  buyerIp?: string | null,
): Promise<ShopifyCartSnapshot | null> {
  const data = await storefrontRequest<CartQueryResponse, { cartId: string }>({
    buyerIp,
    cache: "no-store",
    query: `
      ${CART_FRAGMENT}
      query GetCart($cartId: ID!) {
        cart(id: $cartId) {
          ...CartSnapshotFields
        }
      }
    `,
    variables: {
      cartId,
    },
  });

  return data.cart ? normalizeCart(data.cart) : null;
}

export async function createCart(options?: {
  lines?: ShopifyCartLineInput[];
  buyerIp?: string | null;
}): Promise<ShopifyCartMutationResult & { cartId: string | null }> {
  const data = await storefrontRequest<
    CartCreateResponse,
    { input?: { lines?: ShopifyCartLineInput[] } }
  >({
    buyerIp: options?.buyerIp,
    cache: "no-store",
    query: `
      ${CART_FRAGMENT}
      mutation CreateCart($input: CartInput) {
        cartCreate(input: $input) {
          cart {
            id
            ...CartSnapshotFields
          }
          userErrors {
            code
            field
            message
          }
          warnings {
            code
            message
            target
          }
        }
      }
    `,
    variables: options?.lines?.length
      ? {
          input: {
            lines: options.lines,
          },
        }
      : undefined,
  });

  const result = normalizeCartMutationResult(data.cartCreate, "cartCreate");
  const cartId = data.cartCreate.cart?.id ?? null;

  if (result.cart && !cartId) {
    throw new Error("Shopify cartCreate did not return a cart ID.");
  }

  return {
    ...result,
    cartId,
  };
}

export async function addCartLines(
  cartId: string,
  lines: ShopifyCartLineInput[],
  buyerIp?: string | null,
): Promise<ShopifyCartMutationResult> {
  const data = await storefrontRequest<
    CartLinesAddResponse,
    { cartId: string; lines: ShopifyCartLineInput[] }
  >({
    buyerIp,
    cache: "no-store",
    query: `
      ${CART_FRAGMENT}
      mutation AddCartLines($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            ...CartSnapshotFields
          }
          userErrors {
            code
            field
            message
          }
          warnings {
            code
            message
            target
          }
        }
      }
    `,
    variables: {
      cartId,
      lines,
    },
  });

  return normalizeCartMutationResult(data.cartLinesAdd, "cartLinesAdd");
}

export async function updateCartLines(
  cartId: string,
  lines: ShopifyCartLineUpdate[],
  buyerIp?: string | null,
): Promise<ShopifyCartMutationResult> {
  const data = await storefrontRequest<
    CartLinesUpdateResponse,
    { cartId: string; lines: ShopifyCartLineUpdate[] }
  >({
    buyerIp,
    cache: "no-store",
    query: `
      ${CART_FRAGMENT}
      mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            ...CartSnapshotFields
          }
          userErrors {
            code
            field
            message
          }
          warnings {
            code
            message
            target
          }
        }
      }
    `,
    variables: {
      cartId,
      lines,
    },
  });

  return normalizeCartMutationResult(data.cartLinesUpdate, "cartLinesUpdate");
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
  buyerIp?: string | null,
): Promise<ShopifyCartMutationResult> {
  const data = await storefrontRequest<
    CartLinesRemoveResponse,
    { cartId: string; lineIds: string[] }
  >({
    buyerIp,
    cache: "no-store",
    query: `
      ${CART_FRAGMENT}
      mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            ...CartSnapshotFields
          }
          userErrors {
            code
            field
            message
          }
          warnings {
            code
            message
            target
          }
        }
      }
    `,
    variables: {
      cartId,
      lineIds,
    },
  });

  return normalizeCartMutationResult(data.cartLinesRemove, "cartLinesRemove");
}
