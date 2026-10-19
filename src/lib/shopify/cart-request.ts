import {
  SHOPIFY_CART_MUTATION_FINISHED_EVENT,
  SHOPIFY_CART_MUTATION_STARTED_EVENT,
} from "@/lib/shopify/cart-events";

let mutationPending = false;

export function isShopifyCartMutationPending(): boolean {
  return mutationPending;
}

export async function requestShopifyCartMutation<T>(operation: () => Promise<T>): Promise<T> {
  if (mutationPending) {
    throw new Error("Your bag is updating. Please wait before making another change.");
  }

  mutationPending = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SHOPIFY_CART_MUTATION_STARTED_EVENT));
  }

  try {
    return await operation();
  } finally {
    mutationPending = false;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SHOPIFY_CART_MUTATION_FINISHED_EVENT));
    }
  }
}
