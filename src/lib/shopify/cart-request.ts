let mutationPending = false;

export function isShopifyCartMutationPending(): boolean {
  return mutationPending;
}

export async function requestShopifyCartMutation<T>(operation: () => Promise<T>): Promise<T> {
  if (mutationPending) {
    throw new Error("Your bag is updating. Please wait before making another change.");
  }

  mutationPending = true;

  try {
    return await operation();
  } finally {
    mutationPending = false;
  }
}
