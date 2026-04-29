import "server-only";

import { z } from "zod";

export const SHOPIFY_STOREFRONT_REVALIDATE_SECONDS = 300;

const blankToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
};

const optionalEnv = z.preprocess(blankToUndefined, z.string().min(1).optional());
const apiVersionEnv = z.preprocess(
  blankToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .default("2026-01"),
);

const shopifyEnvSchema = z.object({
  SHOPIFY_STORE_DOMAIN: optionalEnv,
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: optionalEnv,
  SHOPIFY_STOREFRONT_API_VERSION: apiVersionEnv,
  SHOPIFY_CUSTOMER_ACCOUNT_URL: optionalEnv,
});

export type ShopifyConfig = {
  storeDomain: string;
  storefrontAccessToken: string;
  apiVersion: string;
  customerAccountUrl: string | null;
};

export type ShopifyConfigStatus = {
  configured: boolean;
  storeDomain: string | null;
  apiVersion: string;
  missingKeys: string[];
  customerAccountUrl: string | null;
};

function normalizeStoreDomain(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function normalizeExternalUrl(value: string) {
  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function readShopifyEnv() {
  return shopifyEnvSchema.parse({
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    SHOPIFY_STOREFRONT_API_VERSION: process.env.SHOPIFY_STOREFRONT_API_VERSION,
    SHOPIFY_CUSTOMER_ACCOUNT_URL: process.env.SHOPIFY_CUSTOMER_ACCOUNT_URL,
  });
}

export function getShopifyCustomerAccountUrl() {
  const env = readShopifyEnv();

  if (env.SHOPIFY_CUSTOMER_ACCOUNT_URL) {
    const customerAccountUrl = normalizeExternalUrl(env.SHOPIFY_CUSTOMER_ACCOUNT_URL);

    if (customerAccountUrl) {
      return customerAccountUrl;
    }
  }

  if (!env.SHOPIFY_STORE_DOMAIN) {
    return null;
  }

  return `https://${normalizeStoreDomain(env.SHOPIFY_STORE_DOMAIN)}/account`;
}

export function getShopifyConfigStatus(): ShopifyConfigStatus {
  const env = readShopifyEnv();
  const missingKeys = [
    env.SHOPIFY_STORE_DOMAIN ? null : "SHOPIFY_STORE_DOMAIN",
    env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ? null : "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
  ].filter((value): value is string => Boolean(value));

  return {
    configured: missingKeys.length === 0,
    storeDomain: env.SHOPIFY_STORE_DOMAIN ? normalizeStoreDomain(env.SHOPIFY_STORE_DOMAIN) : null,
    apiVersion: env.SHOPIFY_STOREFRONT_API_VERSION,
    missingKeys,
    customerAccountUrl: getShopifyCustomerAccountUrl(),
  };
}

export function getShopifyConfig(): ShopifyConfig | null {
  const env = readShopifyEnv();

  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    return null;
  }

  return {
    storeDomain: normalizeStoreDomain(env.SHOPIFY_STORE_DOMAIN),
    storefrontAccessToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_STOREFRONT_API_VERSION,
    customerAccountUrl: getShopifyCustomerAccountUrl(),
  };
}

export function requireShopifyConfig(): ShopifyConfig {
  const config = getShopifyConfig();

  if (!config) {
    const status = getShopifyConfigStatus();

    throw new Error(
      `Shopify Storefront API is not configured. Missing environment variables: ${status.missingKeys.join(", ")}`,
    );
  }

  return config;
}
