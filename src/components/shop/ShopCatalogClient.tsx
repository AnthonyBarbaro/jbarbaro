"use client";

import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";

import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { FieldLabel, Input, Select } from "@/components/ui/Field";
import type { ShopifyCollectionPreview, ShopifyProduct } from "@/lib/shopify/types";
import { cn } from "@/lib/utils";

type ShopCatalogClientProps = {
  products: ShopifyProduct[];
  collections: ShopifyCollectionPreview[];
};

type SortOption = "featured" | "price-low" | "price-high" | "title-asc";
type AvailabilityOption = "all" | "in-stock" | "sold-out";
type PriceOption = "all" | "under-100" | "100-250" | "250-500" | "500-plus";
type GridColumns = 1 | 2;

const DEFAULT_AVAILABILITY: AvailabilityOption = "in-stock";

function getProductPrice(product: ShopifyProduct) {
  return Number(product.priceRange.minVariantPrice.amount);
}

function matchesPriceFilter(product: ShopifyProduct, priceFilter: PriceOption) {
  const price = getProductPrice(product);

  switch (priceFilter) {
    case "under-100":
      return price < 100;
    case "100-250":
      return price >= 100 && price < 250;
    case "250-500":
      return price >= 250 && price < 500;
    case "500-plus":
      return price >= 500;
    default:
      return true;
  }
}

function matchesAvailability(product: ShopifyProduct, availability: AvailabilityOption) {
  const inStock = product.variants.some((variant) => variant.availableForSale);

  if (availability === "in-stock") {
    return inStock;
  }

  if (availability === "sold-out") {
    return !inStock;
  }

  return true;
}

function matchesVariantOption(product: ShopifyProduct, optionName: string, selectedValues: string[]) {
  if (selectedValues.length === 0) {
    return true;
  }

  return product.variants.some((variant) =>
    variant.selectedOptions.some(
      (option) => option.name.toLowerCase().includes(optionName) && selectedValues.includes(option.value),
    ),
  );
}

function formatSearchText(product: ShopifyProduct) {
  return [
    product.title,
    product.vendor,
    product.productType,
    product.tags.join(" "),
    product.variants.flatMap((variant) => variant.selectedOptions.map((option) => option.value)).join(" "),
    product.collections.map((collection) => collection.title).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function getOptionValues(products: ShopifyProduct[], optionName: string) {
  return Array.from(
    new Set(
      products.flatMap((product) =>
        product.variants.flatMap((variant) =>
          variant.selectedOptions
            .filter((option) => option.name.toLowerCase().includes(optionName))
            .map((option) => option.value),
        ),
      ),
    ),
  ).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function ShopCatalogClient({ products, collections }: ShopCatalogClientProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q")?.trim() || "";
  const [isPending, startTransition] = useTransition();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<GridColumns>(1);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortOption>("featured");
  const [availability, setAvailability] = useState<AvailabilityOption>(DEFAULT_AVAILABILITY);
  const [priceFilter, setPriceFilter] = useState<PriceOption>("all");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToResultsRef = useRef(false);
  const hasMountedRef = useRef(false);
  const deferredQuery = useDeferredValue(query);
  const deferredSort = useDeferredValue(sort);
  const deferredAvailability = useDeferredValue(availability);
  const deferredPriceFilter = useDeferredValue(priceFilter);
  const deferredSelectedCollections = useDeferredValue(selectedCollections);
  const deferredSelectedTypes = useDeferredValue(selectedTypes);
  const deferredSelectedVendors = useDeferredValue(selectedVendors);
  const deferredSelectedSizes = useDeferredValue(selectedSizes);
  const deferredSelectedColors = useDeferredValue(selectedColors);

  const productTypes = Array.from(new Set(products.map((product) => product.productType).filter(Boolean))).sort();
  const vendors = Array.from(new Set(products.map((product) => product.vendor).filter(Boolean))).sort();
  const sizes = getOptionValues(products, "size");
  const colors = getOptionValues(products, "color");
  const searchableQuery = deferredQuery.trim().toLowerCase();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const appliedFilterSignature = JSON.stringify({
    sort: deferredSort,
    availability: deferredAvailability,
    priceFilter: deferredPriceFilter,
    collections: deferredSelectedCollections,
    types: deferredSelectedTypes,
    vendors: deferredSelectedVendors,
    sizes: deferredSelectedSizes,
    colors: deferredSelectedColors,
  });

  let filteredProducts = products.filter((product) => {
    const matchesQuery = searchableQuery.length === 0 || formatSearchText(product).includes(searchableQuery);
    const matchesCollection =
      deferredSelectedCollections.length === 0 ||
      product.collections.some((collection) => deferredSelectedCollections.includes(collection.handle));
    const matchesType = deferredSelectedTypes.length === 0 || deferredSelectedTypes.includes(product.productType);
    const matchesVendor = deferredSelectedVendors.length === 0 || deferredSelectedVendors.includes(product.vendor);
    const matchesSize = matchesVariantOption(product, "size", deferredSelectedSizes);
    const matchesColor = matchesVariantOption(product, "color", deferredSelectedColors);

    return (
      matchesQuery &&
      matchesCollection &&
      matchesType &&
      matchesVendor &&
      matchesSize &&
      matchesColor &&
      matchesAvailability(product, deferredAvailability) &&
      matchesPriceFilter(product, deferredPriceFilter)
    );
  });

  if (deferredSort === "price-low") {
    filteredProducts = [...filteredProducts].sort((a, b) => getProductPrice(a) - getProductPrice(b));
  } else if (deferredSort === "price-high") {
    filteredProducts = [...filteredProducts].sort((a, b) => getProductPrice(b) - getProductPrice(a));
  } else if (deferredSort === "title-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.title.localeCompare(b.title));
  }

  function toggleValue(list: string[], value: string, setter: (next: string[]) => void) {
    shouldScrollToResultsRef.current = !isMobileFiltersOpen;

    startTransition(() => {
      setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    });
  }

  function clearFilters() {
    shouldScrollToResultsRef.current = !isMobileFiltersOpen;

    startTransition(() => {
      setQuery("");
      setSort("featured");
      setAvailability(DEFAULT_AVAILABILITY);
      setPriceFilter("all");
      setSelectedCollections([]);
      setSelectedTypes([]);
      setSelectedVendors([]);
      setSelectedSizes([]);
      setSelectedColors([]);
    });
  }

  const hasActiveFilters =
    query.trim().length > 0 ||
    availability !== DEFAULT_AVAILABILITY ||
    priceFilter !== "all" ||
    selectedCollections.length > 0 ||
    selectedTypes.length > 0 ||
    selectedVendors.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    sort !== "featured";
  const isFiltering =
    isPending ||
    query !== deferredQuery ||
    sort !== deferredSort ||
    availability !== deferredAvailability ||
    priceFilter !== deferredPriceFilter ||
    !arraysEqual(selectedCollections, deferredSelectedCollections) ||
    !arraysEqual(selectedTypes, deferredSelectedTypes) ||
    !arraysEqual(selectedVendors, deferredSelectedVendors) ||
    !arraysEqual(selectedSizes, deferredSelectedSizes) ||
    !arraysEqual(selectedColors, deferredSelectedColors);
  const activeFilterCount =
    selectedCollections.length +
    selectedTypes.length +
    selectedVendors.length +
    selectedSizes.length +
    selectedColors.length +
    (availability !== DEFAULT_AVAILABILITY ? 1 : 0) +
    (priceFilter !== "all" ? 1 : 0) +
    (sort !== "featured" ? 1 : 0);

  useEffect(() => {
    if (isMobileFiltersOpen) {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!shouldScrollToResultsRef.current || isFiltering) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      if (!resultsAnchorRef.current) {
        return;
      }

      const targetY = resultsAnchorRef.current.getBoundingClientRect().top + window.scrollY - 148;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });

      shouldScrollToResultsRef.current = false;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [appliedFilterSignature, isFiltering, isMobileFiltersOpen]);

  useEffect(() => {
    if (!isMobileFiltersOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileFiltersOpen]);

  useEffect(() => {
    if (!isMobileFiltersOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileFiltersOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileFiltersOpen]);

  function renderFilterPanel(variant: "desktop" | "mobile") {
    const searchId = `${variant}-shop-search`;
    const sortId = `${variant}-shop-sort`;

    return (
      <Card
        tone="stone"
        className={cn(
          variant === "mobile" && "flex max-h-[min(82dvh,48rem)] flex-col border-ink/12 shadow-[0_30px_80px_-50px_rgba(14,23,38,0.4)]",
          variant === "desktop" &&
            "flex h-full max-h-[calc(100dvh-7.5rem)] flex-col border-ink/8 bg-[#f8f5ee] shadow-[0_30px_70px_-52px_rgba(14,23,38,0.32)]",
        )}
      >
        <CardContent className={cn((variant === "mobile" || variant === "desktop") && "flex min-h-0 flex-1 flex-col")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-smoke uppercase">Refine the Rack</p>
              <h2 className="mt-2 font-heading text-3xl text-ink">Filter Products</h2>
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase transition-colors duration-200 hover:text-ink"
                >
                  Clear
                </button>
              ) : null}
              {variant === "mobile" ? (
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-gold hover:text-gold"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "mt-5 space-y-5",
              (variant === "mobile" || variant === "desktop") &&
                "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]",
            )}
          >
            <div>
              <FieldLabel htmlFor={searchId}>Search the collection</FieldLabel>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-smoke" />
                <Input
                  id={searchId}
                  value={query}
                  onChange={(event) => {
                    shouldScrollToResultsRef.current = variant === "desktop";
                    setQuery(event.target.value);
                  }}
                  placeholder="Search by brand, collection, or style"
                  className="mt-0 pl-11 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor={sortId}>Sort by</FieldLabel>
              <Select
                id={sortId}
                value={sort}
                onChange={(event) => {
                  shouldScrollToResultsRef.current = variant === "desktop";

                  startTransition(() => {
                    setSort(event.target.value as SortOption);
                  });
                }}
                className="mt-2 transition-all duration-200"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="title-asc">Alphabetical</option>
              </Select>
            </div>

            <div>
              <p className="text-sm font-medium text-ink/90">Availability</p>
              <div className="mt-3 space-y-2">
                {[
                  { label: "All items", value: "all" },
                  { label: "In stock", value: "in-stock" },
                  { label: "Sold out", value: "sold-out" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-smoke transition-all duration-200 hover:border-ink/10 hover:bg-ivory/65 hover:text-ink"
                  >
                    <input
                      type="radio"
                      name={`${variant}-availability`}
                      checked={availability === option.value}
                      onChange={() => {
                        shouldScrollToResultsRef.current = variant === "desktop";

                        startTransition(() => {
                          setAvailability(option.value as AvailabilityOption);
                        });
                      }}
                      className="h-4 w-4 accent-deep-teal"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-ink/90">Price</p>
              <div className="mt-3 space-y-2">
                {[
                  { label: "All prices", value: "all" },
                  { label: "Under $100", value: "under-100" },
                  { label: "$100 to $250", value: "100-250" },
                  { label: "$250 to $500", value: "250-500" },
                  { label: "$500 and up", value: "500-plus" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-smoke transition-all duration-200 hover:border-ink/10 hover:bg-ivory/65 hover:text-ink"
                  >
                    <input
                      type="radio"
                      name={`${variant}-price-range`}
                      checked={priceFilter === option.value}
                      onChange={() => {
                        shouldScrollToResultsRef.current = variant === "desktop";

                        startTransition(() => {
                          setPriceFilter(option.value as PriceOption);
                        });
                      }}
                      className="h-4 w-4 accent-deep-teal"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {productTypes.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-ink/90">Category</p>
                <div className="mt-3 space-y-2">
                  {productTypes.map((productType) => (
                    <label
                      key={productType}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-smoke transition-all duration-200 hover:border-ink/10 hover:bg-ivory/65 hover:text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(productType)}
                        onChange={() => toggleValue(selectedTypes, productType, setSelectedTypes)}
                        className="h-4 w-4 rounded border-ink/30 accent-deep-teal"
                      />
                      <span>{productType}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {vendors.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-ink/90">Brand</p>
                <div className="mt-3 space-y-2">
                  {vendors.map((vendor) => (
                    <label
                      key={vendor}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-smoke transition-all duration-200 hover:border-ink/10 hover:bg-ivory/65 hover:text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor)}
                        onChange={() => toggleValue(selectedVendors, vendor, setSelectedVendors)}
                        className="h-4 w-4 rounded border-ink/30 accent-deep-teal"
                      />
                      <span>{vendor}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {sizes.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-ink/90">Size</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleValue(selectedSizes, size, setSelectedSizes)}
                      className={`min-h-10 rounded-full border px-4 text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-200 ${
                        selectedSizes.includes(size)
                          ? "border-deep-teal bg-deep-teal text-ivory shadow-[0_18px_34px_-24px_rgba(15,91,91,0.75)]"
                          : "border-ink/15 bg-ivory text-ink hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {colors.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-ink/90">Color</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleValue(selectedColors, color, setSelectedColors)}
                      className={`min-h-10 rounded-full border px-4 text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-200 ${
                        selectedColors.includes(color)
                          ? "border-deep-teal bg-deep-teal text-ivory shadow-[0_18px_34px_-24px_rgba(15,91,91,0.75)]"
                          : "border-ink/15 bg-ivory text-ink hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {collections.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-ink/90">Collections</p>
                <div className="mt-3 space-y-2">
                  {collections.map((collection) => (
                    <label
                      key={collection.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-smoke transition-all duration-200 hover:border-ink/10 hover:bg-ivory/65 hover:text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(collection.handle)}
                        onChange={() => toggleValue(selectedCollections, collection.handle, setSelectedCollections)}
                        className="h-4 w-4 rounded border-ink/30 accent-deep-teal"
                      />
                      <span>{collection.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {variant === "mobile" ? (
            <div className="mt-6 border-t border-ink/10 pt-5">
              <button
                type="button"
                onClick={() => {
                  setIsMobileFiltersOpen(false);
                  shouldScrollToResultsRef.current = true;

                  window.requestAnimationFrame(() => {
                    const targetY = resultsAnchorRef.current
                      ? resultsAnchorRef.current.getBoundingClientRect().top + window.scrollY - 148
                      : 0;

                    window.scrollTo({
                      top: Math.max(0, targetY),
                      behavior: "smooth",
                    });
                  });
                }}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold bg-gold px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-ink uppercase transition-all duration-300 hover:bg-ink hover:text-ivory"
              >
                View {filteredProducts.length} Result{filteredProducts.length === 1 ? "" : "s"}
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  function renderActiveFilterBadges({ includeSearchStatus }: { includeSearchStatus: boolean }) {
    return (
      <>
        {includeSearchStatus ? (
          <Badge variant="teal">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Live search
          </Badge>
        ) : null}
        {isFiltering ? <Badge variant="neutral">Refreshing results</Badge> : null}
        {selectedCollections.map((handle) => {
          const collection = collections.find((item) => item.handle === handle);
          return collection ? (
            <Badge key={handle} variant="neutral">
              {collection.title}
            </Badge>
          ) : null;
        })}
        {selectedTypes.map((productType) => (
          <Badge key={productType} variant="neutral">
            {productType}
          </Badge>
        ))}
        {selectedVendors.map((vendor) => (
          <Badge key={vendor} variant="neutral">
            {vendor}
          </Badge>
        ))}
        {selectedSizes.map((size) => (
          <Badge key={size} variant="neutral">
            Size {size}
          </Badge>
        ))}
        {selectedColors.map((color) => (
          <Badge key={color} variant="neutral">
            {color}
          </Badge>
        ))}
        {availability !== DEFAULT_AVAILABILITY ? <Badge variant="neutral">{availability === "in-stock" ? "In stock" : "Sold out"}</Badge> : null}
        {priceFilter !== "all" ? (
          <Badge variant="neutral">
            {priceFilter === "under-100"
              ? "Under $100"
              : priceFilter === "100-250"
                ? "$100-$250"
                : priceFilter === "250-500"
                  ? "$250-$500"
                  : "$500+"}
          </Badge>
        ) : null}
      </>
    );
  }

  function renderViewToggle() {
    return (
      <div className="inline-flex rounded-full border border-ink/10 bg-ivory p-1">
        {([
          { label: "List view", shortLabel: "List", value: 1 as GridColumns },
          { label: "Two-column grid", shortLabel: "Grid", value: 2 as GridColumns },
        ]).map((option) => {
          const isActive = gridColumns === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setGridColumns(option.value)}
              className={cn(
                "rounded-full px-3 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase transition-all duration-200 sm:px-4",
                isActive ? "bg-ink text-ivory shadow-[0_16px_28px_-20px_rgba(14,23,38,0.7)]" : "text-smoke hover:text-ink",
              )}
              aria-pressed={isActive}
              aria-label={option.label}
            >
              {option.shortLabel}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Container>
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="hidden xl:sticky xl:top-28 xl:block xl:h-[calc(100dvh-7.5rem)] xl:overflow-hidden">{renderFilterPanel("desktop")}</aside>

        <div>
          <div className="xl:hidden">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen((current) => !current)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 bg-ivory px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-ink uppercase transition-all duration-300 hover:border-gold hover:text-gold"
                aria-expanded={isMobileFiltersOpen}
                aria-controls="mobile-shop-filters"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 ? <span className="ml-2 rounded-full bg-deep-teal px-2 py-0.5 text-[10px] text-ivory">{activeFilterCount}</span> : null}
              </button>
              <div className="flex items-center justify-between gap-3 sm:flex-1">
                <p className="min-w-0 flex-1 text-sm text-smoke">
                  {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
                  {activeFilterCount > 0 ? ` • ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"}` : ""}
                </p>
                {renderViewToggle()}
              </div>
            </div>

            {hasActiveFilters || isFiltering ? (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {renderActiveFilterBadges({ includeSearchStatus: false })}
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-ink/15 bg-ivory px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-all duration-200 hover:border-gold hover:text-gold"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>
            ) : null}

            {isMobileFiltersOpen ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="fixed inset-0 z-[130] bg-ink/55 xl:hidden"
                  aria-label="Close filters"
                />
                <div className="fixed inset-x-0 bottom-0 z-[140] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] xl:hidden">
                  <div id="mobile-shop-filters" role="dialog" aria-modal="true" aria-label="Filter products" className="mx-auto w-full max-w-lg">
                    {renderFilterPanel("mobile")}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <Card className="hidden overflow-hidden border-ink/8 bg-[linear-gradient(135deg,#fcfbf7_0%,#f3eee3_48%,#f9f7f2_100%)] xl:block">
            <CardContent className="p-6 sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-deep-teal uppercase">
                    <SlidersHorizontal className="h-4 w-4" />
                    Curated Inventory
                  </div>
                  <h2 className="mt-3 font-heading text-4xl text-ink">Ready to Wear</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-smoke">
                    Search, sort, compare, and move directly into product detail or bag without the catalog feeling heavy.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 lg:justify-end">
                  <p className={cn("text-sm text-smoke", isFiltering && "text-deep-teal")}>
                    {filteredProducts.length} of {products.length} products
                    {activeFilterCount > 0 ? ` • ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"}` : ""}
                    {isFiltering ? " • Updating" : ""}
                  </p>
                  {renderViewToggle()}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-ink/8 pt-5">
                {renderActiveFilterBadges({ includeSearchStatus: true })}
              </div>
            </CardContent>
          </Card>

          <div ref={resultsAnchorRef} className="h-px" />

          {filteredProducts.length > 0 ? (
            <div
              aria-busy={isFiltering}
              className={cn(
                "mt-6 grid transition-[opacity,transform,filter] duration-300 ease-out",
                gridColumns === 1 ? "grid-cols-1 gap-2.5 sm:gap-3" : "grid-cols-2 gap-3 sm:gap-4",
                isFiltering ? "translate-y-1 opacity-60 blur-[1px]" : "translate-y-0 opacity-100 blur-0",
              )}
            >
              {filteredProducts.map((product) => (
                <ShopProductCard key={product.id} product={product} columns={gridColumns} />
              ))}
            </div>
          ) : (
            <Card
              className={cn(
                "mt-8 transition-[opacity,transform,filter] duration-300 ease-out",
                isFiltering ? "translate-y-1 opacity-60 blur-[1px]" : "translate-y-0 opacity-100 blur-0",
              )}
            >
              <CardContent>
                <h3 className="font-heading text-3xl text-ink">No products match your filters</h3>
                <p className="mt-3 text-sm leading-7 text-smoke">
                  Try broadening the search, clearing a collection filter, or switching the sort order to bring more products back into view.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-gold bg-gold px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-ink uppercase transition-all duration-300 hover:bg-ink hover:text-ivory"
                >
                  Reset Filters
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
