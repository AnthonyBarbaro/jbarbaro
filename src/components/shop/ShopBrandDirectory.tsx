"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { ShopBrand } from "@/lib/shopify/brands";
import { cn } from "@/lib/utils";

type ShopBrandDirectoryProps = {
  brands: ShopBrand[];
};

const ALL_BRANDS = "All";

function getBrandInitial(name: string) {
  const initial = name.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(initial) ? initial : "#";
}

export function ShopBrandDirectory({ brands }: ShopBrandDirectoryProps) {
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState(ALL_BRANDS);
  const availableLetters = useMemo(
    () => Array.from(new Set(brands.map((brand) => getBrandInitial(brand.name)))).sort(),
    [brands],
  );
  const filteredBrands = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return brands.filter((brand) => {
      const matchesLetter =
        activeLetter === ALL_BRANDS || getBrandInitial(brand.name) === activeLetter;
      const searchableContent = [brand.name, brand.vendor, brand.presentation?.description]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return matchesLetter && (!normalizedQuery || searchableContent.includes(normalizedQuery));
    });
  }, [activeLetter, brands, query]);

  function clearFilters() {
    setQuery("");
    setActiveLetter(ALL_BRANDS);
  }

  return (
    <>
      <section className="border-b border-ink/10 bg-ivory">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-end lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.16em] text-deep-teal uppercase">
              Online Brands
            </p>
            <h1 className="mt-3 font-heading text-4xl leading-tight text-ink sm:text-5xl">
              Shop by Brand
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
              Browse {brands.length} designer brand{brands.length === 1 ? "" : "s"} currently
              represented in the online shop.
            </p>
          </div>

          <div>
            <label htmlFor="shop-brand-search" className="text-sm font-semibold text-ink">
              Find a brand
            </label>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-smoke"
                aria-hidden
              />
              <input
                id="shop-brand-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search brand names"
                className="min-h-12 w-full rounded-md border border-ink/15 bg-white pr-11 pl-10 text-base text-ink outline-none transition-colors placeholder:text-smoke/80 focus:border-deep-teal focus:ring-4 focus:ring-deep-teal/15 sm:text-sm"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-1.5 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-smoke transition-colors hover:bg-stone hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/20"
                  aria-label="Clear brand search"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ivory py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
            aria-label="Filter brands by first letter"
          >
            {[ALL_BRANDS, ...availableLetters].map((letter) => {
              const isActive = activeLetter === letter;

              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setActiveLetter(letter)}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border px-3 text-xs font-semibold tracking-[0.1em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/20",
                    isActive
                      ? "border-deep-teal bg-deep-teal text-white"
                      : "border-ink/12 bg-white text-ink hover:border-deep-teal/40 hover:text-deep-teal",
                  )}
                >
                  {letter}
                </button>
              );
            })}
          </nav>

          <p className="mt-5 text-sm text-smoke" aria-live="polite" aria-atomic="true">
            {filteredBrands.length} brand{filteredBrands.length === 1 ? "" : "s"} shown
          </p>

          {filteredBrands.length > 0 ? (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:gap-4">
              {filteredBrands.map((brand) => {
                const brandImage = brand.presentation?.logo ?? brand.presentation?.image;

                return (
                  <li key={brand.slug}>
                    <Link
                      href={`/shop/brands/${brand.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-lg border border-ink/10 bg-white transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-deep-teal/35 hover:shadow-[0_18px_40px_-32px_rgba(11,15,20,0.32)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/20"
                    >
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-ink/8 bg-product-canvas p-4 sm:p-5">
                        {brandImage ? (
                          <Image
                            src={brandImage}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-contain p-5 transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.03] sm:p-6"
                          />
                        ) : brand.image ? (
                          <Image
                            src={brand.image.url}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-contain p-4 transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.03] sm:p-5"
                          />
                        ) : (
                          <span
                            className="text-center font-heading text-xl leading-tight text-ink/55 sm:text-2xl"
                            aria-hidden
                          >
                            {brand.name}
                          </span>
                        )}
                      </div>
                      <div className="flex min-h-[6.5rem] flex-1 flex-col justify-between gap-3 p-3 sm:min-h-[7rem] sm:p-4">
                        <div>
                          <h2 className="text-sm leading-5 font-semibold text-ink transition-colors group-hover:text-deep-teal sm:text-base sm:leading-6">
                            {brand.name}
                          </h2>
                          <p className="mt-1 text-xs leading-5 text-smoke">
                            {brand.productCount} product{brand.productCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-deep-teal uppercase">
                          Shop Brand
                          <ArrowRight
                            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-6 rounded-lg border border-ink/10 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">
                No brands match your search.
              </h2>
              <p className="mt-2 text-sm leading-7 text-smoke">
                Try another name or clear the filters to see every online brand.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-ink/15 bg-white px-4 text-xs font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/20"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
