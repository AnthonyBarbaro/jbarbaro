import { NextResponse } from "next/server";

import { getShopifyConfigStatus } from "@/lib/shopify/config";
import { searchShopProducts } from "@/lib/shopify/products";

export async function GET(request: Request) {
  const status = getShopifyConfigStatus();

  if (!status.configured) {
    return NextResponse.json(
      {
        configured: false,
        results: [],
        message: `Shopify search is unavailable. Missing environment variables: ${status.missingKeys.join(", ")}`,
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ configured: true, results: [] });
  }

  try {
    const results = await searchShopProducts(query, 6);
    return NextResponse.json({ configured: true, results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ configured: true, results: [], message: "Unable to search products right now." }, { status: 500 });
  }
}
