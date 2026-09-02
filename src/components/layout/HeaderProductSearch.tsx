"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";

import type { ShopifyProductSearchResult } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type HeaderProductSearchProps = {
  autoFocus?: boolean;
  className?: string;
  onNavigate?: () => void;
  resultsClassName?: string;
};

type SearchResponse = {
  configured: boolean;
  results: ShopifyProductSearchResult[];
  message?: string;
};

function formatSearchResultPrice(product: ShopifyProductSearchResult) {
  const minimum = product.priceRange.minVariantPrice;
  const maximum = product.priceRange.maxVariantPrice;
  const minimumLabel = formatMoney(minimum.amount, minimum.currencyCode);

  if (minimum.amount === maximum.amount) {
    return minimumLabel;
  }

  return `${minimumLabel} – ${formatMoney(maximum.amount, maximum.currencyCode)}`;
}

function formatAvailableSizes(availableSizes: string[], limit: number) {
  const visibleSizes = availableSizes.slice(0, limit);
  const remainingCount = availableSizes.length - visibleSizes.length;

  return [...visibleSizes, remainingCount > 0 ? `+${remainingCount} more` : null]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
}

export function HeaderProductSearch({
  autoFocus = false,
  className,
  onNavigate,
  resultsClassName,
}: HeaderProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShopifyProductSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resultsId = useId();
  const statusId = useId();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const normalizedQuery = deferredQuery.trim();

    if (normalizedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      setSearchError(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);

    async function loadResults() {
      try {
        const response = await fetch(
          `/api/shopify/search?q=${encodeURIComponent(normalizedQuery)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = (await response.json()) as SearchResponse;

        if (!isMounted) {
          return;
        }

        if (!response.ok || !payload.configured) {
          throw new Error(payload.message || "Product search is temporarily unavailable.");
        }

        setSearchError(null);
        setResults(payload.results);
        setIsOpen(true);
      } catch (error) {
        if (isMounted && !(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
          setSearchError(
            error instanceof Error ? error.message : "Product search is temporarily unavailable.",
          );
          setIsOpen(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadResults();
    }, 180);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [deferredQuery]);

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-xl", className)}>
      <form
        action="/shop"
        method="get"
        className="flex h-11 items-center rounded-md border border-ink/12 bg-ivory px-3 shadow-none transition-[border-color,box-shadow] focus-within:border-deep-teal focus-within:ring-4 focus-within:ring-deep-teal/15"
      >
        <Search className="h-4 w-4 shrink-0 text-smoke" />
        <input
          autoFocus={autoFocus}
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Search products, brands, sizes, or colors"
          className="h-11 w-full bg-transparent px-3 text-base text-ink outline-none placeholder:text-smoke sm:text-sm"
          aria-label="Search products"
          aria-controls={resultsId}
          aria-describedby={statusId}
        />
        <button
          type="submit"
          className="hidden h-8 shrink-0 items-center justify-center rounded-md bg-deep-teal px-3 text-[11px] font-semibold tracking-[0.12em] text-white uppercase transition-colors hover:bg-[#136868] sm:inline-flex"
        >
          Search
        </button>
      </form>

      {(isOpen || isLoading) && deferredQuery.trim().length >= 2 ? (
        <div
          id={resultsId}
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-[120] overflow-hidden rounded-lg border border-ink/10 bg-ivory shadow-xl shadow-ink/10"
          role="region"
          aria-label="Product search results"
        >
          <div className="border-b border-ink/10 px-5 py-4">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">
              Product Search
            </p>
            <p className="mt-1 text-sm text-ink">
              {isLoading ? "Searching the catalog..." : `${results.length} product matches`}
            </p>
          </div>

          {searchError ? (
            <div className="px-5 py-6" role="alert">
              <p className="font-semibold text-ink">Search is unavailable.</p>
              <p className="mt-1 text-sm leading-6 text-smoke">{searchError}</p>
              <p className="mt-2 text-sm text-smoke">
                Submit the search to browse matching catalog results.
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className={cn("max-h-[420px] overflow-y-auto", resultsClassName)}>
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.handle}`}
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate?.();
                  }}
                  className="flex items-center gap-4 border-b border-ink/8 px-5 py-4 transition-colors hover:bg-stone/60"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-product-canvas">
                    {product.featuredImage ? (
                      <Image
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">
                      {[product.vendor, product.productType].filter(Boolean).join(" • ")}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-ink">{product.title}</p>
                    {product.availableSizes.length > 0 ? (
                      <p className="mt-1 truncate text-xs text-smoke">
                        <span className="sr-only">
                          Available sizes {product.availableSizes.join(", ")}
                        </span>
                        <span aria-hidden="true">
                          <span className="font-semibold text-ink/75">Sizes</span>{" "}
                          <span className="sm:hidden">
                            {formatAvailableSizes(product.availableSizes, 3)}
                          </span>
                          <span className="hidden sm:inline">
                            {formatAvailableSizes(product.availableSizes, 5)}
                          </span>
                        </span>
                      </p>
                    ) : null}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {!product.availableForSale ? (
                        <span className="inline-flex rounded-full bg-ink/85 px-2 py-0.5 text-xs font-semibold tracking-[0.12em] text-white uppercase">
                          Sold out
                        </span>
                      ) : null}
                      <p className="text-sm font-bold tracking-[-0.01em] text-ink">
                        {formatSearchResultPrice(product)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : isLoading ? null : (
            <div className="px-5 py-6">
              <p className="text-sm text-smoke">
                No direct product matches yet. Try a broader brand, category, or size search.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 bg-stone/55 px-5 py-4">
            <Link
              href={`/shop?q=${encodeURIComponent(query.trim())}`}
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className="text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-ink"
            >
              View all search results
            </Link>
          </div>
        </div>
      ) : null}

      <p id={statusId} className="sr-only" aria-live="polite">
        {searchError
          ? searchError
          : isLoading
            ? "Searching the product catalog"
            : deferredQuery.trim().length >= 2
              ? `${results.length} product matches`
              : ""}
      </p>
    </div>
  );
}
