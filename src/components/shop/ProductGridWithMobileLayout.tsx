"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { useState } from "react";

import { ShopProductCard } from "@/components/shop/ShopProductCard";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { cn } from "@/lib/utils";

type ProductGridWithMobileLayoutProps = {
  products: ShopifyProduct[];
  headingLevel?: "h2" | "h3" | "h4";
};

export function ProductGridWithMobileLayout({
  products,
  headingLevel = "h2",
}: ProductGridWithMobileLayoutProps) {
  const [mobileLayout, setMobileLayout] = useState<"grid" | "single">("grid");

  return (
    <>
      <div className="mb-4 flex items-center justify-between sm:hidden">
        <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">View</p>
        <div
          className="flex items-center overflow-hidden rounded-full border border-ink/15 bg-white"
          role="group"
          aria-label="Product layout"
        >
          <button
            type="button"
            onClick={() => setMobileLayout("grid")}
            aria-pressed={mobileLayout === "grid"}
            aria-label="Two-column grid"
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center transition-colors",
              mobileLayout === "grid" ? "bg-ink text-white" : "text-smoke hover:text-ink",
            )}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setMobileLayout("single")}
            aria-pressed={mobileLayout === "single"}
            aria-label="Single-column vertical view"
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center border-l border-ink/15 transition-colors",
              mobileLayout === "single" ? "bg-ink text-white" : "text-smoke hover:text-ink",
            )}
          >
            <Rows3 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid min-w-0 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xl:gap-4",
          mobileLayout === "grid" ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        {products.map((product) => (
          <ShopProductCard
            key={product.id}
            product={product}
            headingLevel={headingLevel}
            imageSizes={
              mobileLayout === "grid"
                ? "(max-width: 639px) 50vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
                : undefined
            }
          />
        ))}
      </div>
    </>
  );
}
