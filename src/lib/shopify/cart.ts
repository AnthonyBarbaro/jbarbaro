import "server-only";

import { storefrontRequest } from "@/lib/shopify/client";
import type { ShopifyCartSnapshot, ShopifyMoney, ShopifyProductVariant } from "@/lib/shopify/types";

type MoneyV2 = {
  amount: string;
  currencyCode: string;
};

type RawCart = {
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
  merchandise:
    | {
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
          variants: {
            nodes: RawProductVariant[];
          };
        };
      }
    | null;
};

type CartUserError = {
  field: string[] | null;
  message: string;
};

type CartMutationPayload = {
  cart: RawCart | null;
  userErrors: CartUserError[];
};

export type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
};

export type ShopifyCartLineUpdate = {
  id: string;
  quantity?: number;
  merchandiseId?: string;
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
              url
              altText
              width
              height
            }
            product {
              title
              handle
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
      selectedOptions: line.merchandise?.selectedOptions ?? [],
      image: line.merchandise?.image ?? null,
      unitPrice: toCartMoney(line.cost.amountPerQuantity),
      totalPrice: toCartMoney(line.cost.totalAmount),
      variants: line.merchandise ? normalizeCartVariants(line.merchandise.product.variants.nodes) : [],
    })),
  };
}

function assertCartMutationResult(payload: CartMutationPayload | undefined, operation: string): RawCart {
  if (!payload) {
    throw new Error(`Shopify ${operation} did not return a payload.`);
  }

  if (payload.userErrors.length > 0) {
    const message = payload.userErrors.map((error) => error.message).join(" ");

    throw new Error(`Shopify ${operation} failed. ${message}`);
  }

  if (!payload.cart) {
    throw new Error(`Shopify ${operation} did not return a cart.`);
  }

  return payload.cart;
}

export async function getCart(cartId: string, buyerIp?: string | null): Promise<ShopifyCartSnapshot | null> {
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
}): Promise<{ cartId: string; cart: ShopifyCartSnapshot }> {
  const data = await storefrontRequest<CartCreateResponse, { input?: { lines?: ShopifyCartLineInput[] } }>({
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
            field
            message
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

  const cart = assertCartMutationResult(data.cartCreate, "cartCreate");

  return {
    cartId: (cart as RawCart & { id: string }).id,
    cart: normalizeCart(cart),
  };
}

export async function addCartLines(cartId: string, lines: ShopifyCartLineInput[], buyerIp?: string | null) {
  const data = await storefrontRequest<CartLinesAddResponse, { cartId: string; lines: ShopifyCartLineInput[] }>({
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
            field
            message
          }
        }
      }
    `,
    variables: {
      cartId,
      lines,
    },
  });

  return normalizeCart(assertCartMutationResult(data.cartLinesAdd, "cartLinesAdd"));
}

export async function updateCartLines(cartId: string, lines: ShopifyCartLineUpdate[], buyerIp?: string | null) {
  const data = await storefrontRequest<CartLinesUpdateResponse, { cartId: string; lines: ShopifyCartLineUpdate[] }>({
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
            field
            message
          }
        }
      }
    `,
    variables: {
      cartId,
      lines,
    },
  });

  return normalizeCart(assertCartMutationResult(data.cartLinesUpdate, "cartLinesUpdate"));
}

export async function removeCartLines(cartId: string, lineIds: string[], buyerIp?: string | null) {
  const data = await storefrontRequest<CartLinesRemoveResponse, { cartId: string; lineIds: string[] }>({
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
            field
            message
          }
        }
      }
    `,
    variables: {
      cartId,
      lineIds,
    },
  });

  return normalizeCart(assertCartMutationResult(data.cartLinesRemove, "cartLinesRemove"));
}
