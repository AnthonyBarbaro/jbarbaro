import "server-only";

import { z } from "zod";

const blankToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
};

const optionalEnv = z.preprocess(blankToUndefined, z.string().min(1).optional());
const apiVersionEnv = z.preprocess(blankToUndefined, z.string().regex(/^\d{4}-\d{2}$/).default("2026-01"));

const shopifyEnvSchema = z.object({
  SHOPIFY_STORE_DOMAIN: optionalEnv,
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: optionalEnv,
  SHOPIFY_STOREFRONT_API_VERSION: apiVersionEnv,
});

export type ShopifyConfig = {
  storeDomain: string;
  storefrontAccessToken: string;
  apiVersion: string;
};

export type ShopifyConfigStatus = {
  configured: boolean;
  storeDomain: string | null;
  apiVersion: string;
  missingKeys: string[];
};

function normalizeStoreDomain(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function readShopifyEnv() {
  return shopifyEnvSchema.parse({
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    SHOPIFY_STOREFRONT_API_VERSION: process.env.SHOPIFY_STOREFRONT_API_VERSION,
  });
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
