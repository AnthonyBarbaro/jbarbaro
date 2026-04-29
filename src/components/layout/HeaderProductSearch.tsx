"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import type { ShopifyProductSearchResult } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type HeaderProductSearchProps = {
  className?: string;
  onNavigate?: () => void;
};

type SearchResponse = {
  configured: boolean;
  results: ShopifyProductSearchResult[];
  message?: string;
};

export function HeaderProductSearch({ className, onNavigate }: HeaderProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShopifyProductSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);

    async function loadResults() {
      try {
        const response = await fetch(`/api/shopify/search?q=${encodeURIComponent(normalizedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as SearchResponse;

        if (!isMounted || !payload.configured) {
          return;
        }

        setResults(payload.results);
        setIsOpen(true);
      } catch (error) {
        if (isMounted && !(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
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
        className="flex h-10 items-center rounded-md border border-ink/12 bg-ivory px-3 shadow-none"
      >
        <Search className="h-4 w-4 shrink-0 text-smoke" />
        <input
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
          className="h-10 w-full bg-transparent px-3 text-sm text-ink outline-none placeholder:text-smoke"
          aria-label="Search products"
        />
        <button
          type="submit"
          className="hidden h-8 shrink-0 items-center justify-center rounded-md bg-deep-teal px-3 text-[11px] font-semibold tracking-[0.12em] text-white uppercase transition-colors hover:bg-[#136868] sm:inline-flex"
        >
          Search
        </button>
      </form>

      {(isOpen || isLoading) && deferredQuery.trim().length >= 2 ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-[120] overflow-hidden rounded-lg border border-ink/10 bg-ivory shadow-xl shadow-ink/10">
          <div className="border-b border-ink/10 px-5 py-4">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">Product Search</p>
            <p className="mt-1 text-sm text-ink">{isLoading ? "Searching the catalog..." : `${results.length} product matches`}</p>
          </div>

          {results.length > 0 ? (
            <div className="max-h-[420px] overflow-y-auto">
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
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone">
                    {product.featuredImage ? (
                      <Image
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">
                      {[product.vendor, product.productType].filter(Boolean).join(" • ")}
                    </p>
                    <p className="mt-1 truncate font-heading text-2xl text-ink">{product.title}</p>
                    <p className="mt-1 text-sm font-semibold tracking-[0.08em] text-deep-teal uppercase">
                      {formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : isLoading ? null : (
            <div className="px-5 py-6">
              <p className="text-sm text-smoke">No direct product matches yet. Try a broader brand, category, or size search.</p>
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
    </div>
  );
}
