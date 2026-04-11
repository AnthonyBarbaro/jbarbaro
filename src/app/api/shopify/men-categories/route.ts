import { NextResponse } from "next/server";

import { getShopifyConfigStatus, SHOPIFY_STOREFRONT_REVALIDATE_SECONDS } from "@/lib/shopify/config";
import { resolveMenCategories } from "@/lib/shopify/men-categories";

export const revalidate = 300;

export async function GET() {
  const status = getShopifyConfigStatus();
  const categories = await resolveMenCategories(24, 1);

  return NextResponse.json(
    {
      configured: status.configured,
      categories: categories.map((category) => ({
        label: category.name,
        href: category.href,
        source: category.source,
      })),
    },
    {
      headers: {
        "Cache-Control": `public, max-age=${SHOPIFY_STOREFRONT_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      },
    },
  );
}
