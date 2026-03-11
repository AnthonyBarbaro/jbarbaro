import "server-only";

import { requireShopifyConfig } from "@/lib/shopify/config";

type StorefrontError = {
  message: string;
  extensions?: {
    code?: string;
  };
};

type StorefrontResponse<TData> = {
  data?: TData;
  errors?: StorefrontError[];
};

type StorefrontRequest<TVariables> = {
  query: string;
  variables?: TVariables;
  buyerIp?: string | null;
  cache?: RequestCache;
};

export async function storefrontRequest<TData, TVariables = Record<string, never>>({
  query,
  variables,
  buyerIp,
  cache = "no-store",
}: StorefrontRequest<TVariables>): Promise<TData> {
  const config = requireShopifyConfig();
  const response = await fetch(`https://${config.storeDomain}/api/${config.apiVersion}/graphql.json`, {
    method: "POST",
    cache,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": config.storefrontAccessToken,
      ...(buyerIp ? { "Shopify-Storefront-Buyer-IP": buyerIp } : {}),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Shopify Storefront API request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as StorefrontResponse<TData>;

  if (payload.errors?.length) {
    const message = payload.errors
      .map((error) => (error.extensions?.code ? `${error.extensions.code}: ${error.message}` : error.message))
      .join(" ");

    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error("Shopify Storefront API response did not include data.");
  }

  return payload.data;
}
