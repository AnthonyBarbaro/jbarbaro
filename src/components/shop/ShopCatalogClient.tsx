"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { ChevronDown, Footprints, LayoutGrid, Ruler, Search, Shirt, SlidersHorizontal, Sparkles, Square, X } from "lucide-react";
import Link from "next/link";

import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { FieldLabel, Input, Select } from "@/components/ui/Field";
import {
  buildFitProfile,
  FIT_PROFILE_STORAGE_KEY,
  getMatchingProfileSizes,
  parseFitProfile,
  type FitBuild,
  type FitEstimate,
  type FitProfile,
  type FitProfileInput,
} from "@/lib/fit-profile";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type ShopCatalogClientProps = {
  products: ShopifyProduct[];
  bestSellers?: ShopifyProduct[];
};

type FacetKey = "availability" | "price" | "brand" | "size" | "color";
type FacetPill = { key: FacetKey; label: string; activeCount: number };

type SortOption = "featured" | "newest" | "price-low" | "price-high" | "title-asc";
type AvailabilityOption = "all" | "in-stock" | "sold-out";
type PriceOption = "all" | "under-100" | "100-250" | "250-500" | "500-plus";
type FitDraftInput = Omit<FitProfileInput, "build" | "heightFeet" | "heightInches" | "weightLbs"> & {
  build: FitBuild | "";
  heightFeet: number | "";
  heightInches: number | "";
  weightLbs: number | "";
};
const DEFAULT_AVAILABILITY: AvailabilityOption = "in-stock";
const DEFAULT_FIT_INPUT: FitDraftInput = {
  heightFeet: "",
  heightInches: "",
  weightLbs: "",
  build: "",
  knownSuitSize: "",
  knownTopSize: "",
  knownDressShirtSize: "",
  knownWaistSize: "",
  shoeSize: "",
};
const fitBuildOptions: Array<{ label: string; value: FitBuild }> = [
  { label: "Slim", value: "slim" },
  { label: "Average", value: "average" },
  { label: "Athletic", value: "athletic" },
  { label: "Broad", value: "broad" },
  { label: "Full", value: "full" },
];
const FIT_WIDGET_IMAGE = "/images/campaign/showroom-hero-v2.webp";

function getEmptyFitEstimate(input: FitDraftInput): FitEstimate {
  return {
    suit: input.knownSuitSize?.trim() || "Not set",
    jacketChest: 0,
    jacketLength: "R",
    alpha: input.knownTopSize?.trim() || "Not set",
    dressShirt: input.knownDressShirtSize?.trim() || "Not set",
    waist: input.knownWaistSize?.trim() || "Not set",
    shoe: input.shoeSize?.trim() || undefined,
    notes: [],
  };
}

function getFitDisplayValue(value?: string, fallback = "Not set") {
  const trimmed = value?.trim();

  if (!trimmed || /nan|undefined|null/i.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

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

function matchesVariantOption(product: ShopifyProduct, optionName: string, selectedValues: string[], requireAvailable = false) {
  if (selectedValues.length === 0) {
    return true;
  }

  return product.variants.some((variant) =>
    (!requireAvailable || variant.availableForSale) &&
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

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function isFitBuildValue(value: FitDraftInput["build"]): value is FitBuild {
  return fitBuildOptions.some((option) => option.value === value);
}

export function ShopCatalogClient({ products, bestSellers = [] }: ShopCatalogClientProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q")?.trim() || "";
  const [isPending, startTransition] = useTransition();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileLayout, setMobileLayout] = useState<"grid" | "single">("grid");
  const [openFacet, setOpenFacet] = useState<FacetKey | null>(null);
  const [activeTopPicksId, setActiveTopPicksId] = useState<string | null>(null);
  const pillBarRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("featured");
  const [availability, setAvailability] = useState<AvailabilityOption>(DEFAULT_AVAILABILITY);
  const [priceFilter, setPriceFilter] = useState<PriceOption>("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [fitProfile, setFitProfile] = useState<FitProfile | null>(null);
  const [fitDraft, setFitDraft] = useState<FitDraftInput>(DEFAULT_FIT_INPUT);
  const [isFitEditorOpen, setIsFitEditorOpen] = useState(false);
  const [isFitDrawerOpen, setIsFitDrawerOpen] = useState(false);
  const [isManualSizeEditorOpen, setIsManualSizeEditorOpen] = useState(false);
  const [smartFitEnabled, setSmartFitEnabled] = useState(false);
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToResultsRef = useRef(false);
  const hasMountedRef = useRef(false);
  const hasLoadedFitProfileRef = useRef(false);
  const deferredQuery = useDeferredValue(query);
  const deferredSort = useDeferredValue(sort);
  const deferredAvailability = useDeferredValue(availability);
  const deferredPriceFilter = useDeferredValue(priceFilter);
  const deferredSelectedTypes = useDeferredValue(selectedTypes);
  const deferredSelectedVendors = useDeferredValue(selectedVendors);
  const deferredSelectedSizes = useDeferredValue(selectedSizes);
  const deferredSelectedColors = useDeferredValue(selectedColors);

  const productTypes = useMemo(() => Array.from(new Set(products.map((product) => product.productType).filter(Boolean))).sort(), [products]);
  const vendors = useMemo(() => Array.from(new Set(products.map((product) => product.vendor).filter(Boolean))).sort(), [products]);
  const sizes = useMemo(() => getOptionValues(products, "size"), [products]);
  const colors = useMemo(() => getOptionValues(products, "color"), [products]);
  const smartFitSizes = useMemo(() => getMatchingProfileSizes(sizes, fitProfile), [fitProfile, sizes]);
  const searchableQuery = deferredQuery.trim().toLowerCase();

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (!openFacet) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (pillBarRef.current && !pillBarRef.current.contains(event.target as Node)) {
        setOpenFacet(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenFacet(null);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openFacet]);

  useEffect(() => {
    if (hasLoadedFitProfileRef.current) {
      return;
    }

    hasLoadedFitProfileRef.current = true;
    const storedFitProfile = window.localStorage.getItem(FIT_PROFILE_STORAGE_KEY);
    const storedProfile = parseFitProfile(storedFitProfile);

    if (!storedProfile) {
      if (storedFitProfile) {
        window.localStorage.removeItem(FIT_PROFILE_STORAGE_KEY);
      }

      return;
    }

    const matchingSizes = getMatchingProfileSizes(sizes, storedProfile);
    const frameId = window.requestAnimationFrame(() => {
      setFitProfile(storedProfile);
      setFitDraft({
        heightFeet: storedProfile.heightFeet,
        heightInches: storedProfile.heightInches,
        weightLbs: storedProfile.weightLbs,
        build: storedProfile.build,
        knownSuitSize: storedProfile.knownSuitSize ?? "",
        knownTopSize: storedProfile.knownTopSize ?? "",
        knownDressShirtSize: storedProfile.knownDressShirtSize ?? "",
        knownWaistSize: storedProfile.knownWaistSize ?? "",
        shoeSize: storedProfile.shoeSize ?? "",
      });

      if (matchingSizes.length > 0) {
        setSmartFitEnabled(true);
        setSelectedSizes(matchingSizes);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [sizes]);

  const appliedFilterSignature = JSON.stringify({
    sort: deferredSort,
    availability: deferredAvailability,
    priceFilter: deferredPriceFilter,
    types: deferredSelectedTypes,
    vendors: deferredSelectedVendors,
    sizes: deferredSelectedSizes,
    colors: deferredSelectedColors,
  });

  let filteredProducts = products.filter((product) => {
    const matchesQuery = searchableQuery.length === 0 || formatSearchText(product).includes(searchableQuery);
    const matchesType = deferredSelectedTypes.length === 0 || deferredSelectedTypes.includes(product.productType);
    const matchesVendor = deferredSelectedVendors.length === 0 || deferredSelectedVendors.includes(product.vendor);
    const matchesSize = matchesVariantOption(product, "size", deferredSelectedSizes, deferredAvailability === "in-stock");
    const matchesColor = matchesVariantOption(product, "color", deferredSelectedColors);

    return (
      matchesQuery &&
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
  } else if (deferredSort === "newest") {
    filteredProducts = [...filteredProducts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } else if (deferredSort === "title-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.title.localeCompare(b.title));
  }

  function toggleValue(list: string[], value: string, setter: (next: string[]) => void) {
    shouldScrollToResultsRef.current = false;

    startTransition(() => {
      setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    });
  }

  function toggleSize(size: string) {
    shouldScrollToResultsRef.current = false;
    setSmartFitEnabled(false);

    startTransition(() => {
      setSelectedSizes((current) => (current.includes(size) ? current.filter((item) => item !== size) : [...current, size]));
    });
  }

  function applySmartFit(profile = fitProfile) {
    if (!profile) {
      setIsFitEditorOpen(true);
      return;
    }

    const matchingSizes = getMatchingProfileSizes(sizes, profile);
    shouldScrollToResultsRef.current = false;

    startTransition(() => {
      setSelectedSizes(matchingSizes);
      setSmartFitEnabled(matchingSizes.length > 0);
    });
  }

  function saveFitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedFit = normalizeFitInput(fitDraft);

    if (!normalizedFit) {
      return;
    }

    const nextProfile = buildFitProfile(normalizedFit);

    window.localStorage.setItem(FIT_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    setFitProfile(nextProfile);
    setFitDraft({
      heightFeet: nextProfile.heightFeet,
      heightInches: nextProfile.heightInches,
      weightLbs: nextProfile.weightLbs,
      build: nextProfile.build,
      knownSuitSize: nextProfile.knownSuitSize ?? "",
      knownTopSize: nextProfile.knownTopSize ?? "",
      knownDressShirtSize: nextProfile.knownDressShirtSize ?? "",
      knownWaistSize: nextProfile.knownWaistSize ?? "",
      shoeSize: nextProfile.shoeSize ?? "",
    });
    setIsFitEditorOpen(false);
    applySmartFit(nextProfile);
  }

  function clearFitProfile() {
    window.localStorage.removeItem(FIT_PROFILE_STORAGE_KEY);
    setFitProfile(null);
    setFitDraft(DEFAULT_FIT_INPUT);
    setIsManualSizeEditorOpen(false);
    setSmartFitEnabled(false);

    if (smartFitEnabled) {
      startTransition(() => {
        setSelectedSizes([]);
      });
    }
  }

  function normalizeFitInput(input: FitDraftInput): FitProfileInput | null {
    if (input.heightFeet === "" || input.heightInches === "" || input.weightLbs === "" || !isFitBuildValue(input.build)) {
      return null;
    }

    const heightFeet = Number(input.heightFeet);
    const heightInches = Number(input.heightInches);
    const weightLbs = Number(input.weightLbs);

    if (!Number.isFinite(heightFeet) || !Number.isFinite(heightInches) || !Number.isFinite(weightLbs)) {
      return null;
    }

    return {
      heightFeet,
      heightInches,
      weightLbs,
      build: input.build,
      knownSuitSize: input.knownSuitSize?.trim() || undefined,
      knownTopSize: input.knownTopSize?.trim() || undefined,
      knownDressShirtSize: input.knownDressShirtSize?.trim() || undefined,
      knownWaistSize: input.knownWaistSize?.trim() || undefined,
      shoeSize: input.shoeSize?.trim() || undefined,
    };
  }

  function clearSearch() {
    startTransition(() => {
      setQuery("");
    });

    const url = new URL(window.location.href);

    if (url.searchParams.has("q")) {
      url.searchParams.delete("q");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  function clearFilters() {
    shouldScrollToResultsRef.current = !isMobileFiltersOpen;

    startTransition(() => {
      setQuery("");
      setSort("featured");
      setAvailability(DEFAULT_AVAILABILITY);
      setPriceFilter("all");
      setSelectedTypes([]);
      setSelectedVendors([]);
      setSelectedSizes([]);
      setSelectedColors([]);
      setSmartFitEnabled(false);
    });
  }

  const hasActiveFilters =
    query.trim().length > 0 ||
    availability !== DEFAULT_AVAILABILITY ||
    priceFilter !== "all" ||
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
    !arraysEqual(selectedTypes, deferredSelectedTypes) ||
    !arraysEqual(selectedVendors, deferredSelectedVendors) ||
    !arraysEqual(selectedSizes, deferredSelectedSizes) ||
    !arraysEqual(selectedColors, deferredSelectedColors);
  const activeFilterCount =
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
        className={cn(
          "border-ink/10 bg-white",
          variant === "mobile" && "flex h-full flex-col shadow-[0_30px_80px_-50px_rgba(14,23,38,0.4)]",
          variant === "desktop" &&
            "flex h-full max-h-[calc(100dvh-6rem)] flex-col rounded-lg border border-ink/10 shadow-none",
        )}
      >
        <CardContent className={cn((variant === "mobile" || variant === "desktop") && "flex min-h-0 flex-1 flex-col")}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold tracking-[0.22em] text-smoke uppercase sm:text-sm">
              {variant === "mobile" ? "Filter & Sort" : "Filters"}
            </p>
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
            {variant === "mobile" ? (
              <>
                <div>
                  <FieldLabel htmlFor={searchId}>Search</FieldLabel>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-smoke" />
                    <Input
                      id={searchId}
                      value={query}
                      onChange={(event) => {
                        shouldScrollToResultsRef.current = false;
                        setQuery(event.target.value);
                      }}
                      placeholder="Search products"
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
                      shouldScrollToResultsRef.current = false;

                      startTransition(() => {
                        setSort(event.target.value as SortOption);
                      });
                    }}
                    className="mt-2 transition-all duration-200"
                  >
                    <option value="featured">Featured / Popular</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="title-asc">Alphabetical</option>
                  </Select>
                </div>
              </>
            ) : null}

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
                        shouldScrollToResultsRef.current = false;

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
                        shouldScrollToResultsRef.current = false;

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
                      onClick={() => toggleSize(size)}
                      className={`min-h-10 rounded-full border px-4 text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-200 ${
                        selectedSizes.includes(size)
                          ? "border-deep-teal bg-deep-teal text-white shadow-[0_18px_34px_-24px_rgba(15,91,91,0.75)]"
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
                          ? "border-deep-teal bg-deep-teal text-white shadow-[0_18px_34px_-24px_rgba(15,91,91,0.75)]"
                          : "border-ink/15 bg-ivory text-ink hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                      }`}
                    >
                      {color}
                    </button>
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
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-deep-teal bg-deep-teal px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors duration-200 hover:bg-[#136868]"
              >
                View {filteredProducts.length} Result{filteredProducts.length === 1 ? "" : "s"}
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  function renderActiveFilterBadges() {
    return (
      <>
        {isFiltering ? <Badge variant="neutral">Refreshing results</Badge> : null}
        {smartFitEnabled && fitProfile ? <Badge variant="teal">Smart Fit</Badge> : null}
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

  function renderFitProfileCard(mode: "inline" | "drawer" = "inline") {
    const isDrawer = mode === "drawer";
    const estimate = fitProfile?.estimate;
    const normalizedFitDraft = normalizeFitInput(fitDraft);
    const previewProfile = normalizedFitDraft ? buildFitProfile(normalizedFitDraft) : null;
    const hasSmartFitMatches = smartFitSizes.length > 0;
    const showFitForm = isFitEditorOpen || !fitProfile;
    const emptyEstimate = getEmptyFitEstimate(fitDraft);
    const previewEstimate = showFitForm ? previewProfile?.estimate ?? emptyEstimate : estimate ?? previewProfile?.estimate ?? emptyEstimate;
    const manualSizeItems = [
      { label: "Suit", value: fitDraft.knownSuitSize },
      { label: "Top", value: fitDraft.knownTopSize },
      { label: "Shirt", value: fitDraft.knownDressShirtSize },
      { label: "Waist", value: fitDraft.knownWaistSize },
      { label: "Shoe", value: fitDraft.shoeSize },
    ].filter((item): item is { label: string; value: string } => Boolean(item.value?.trim()));
    const hasManualSizeValues = manualSizeItems.length > 0;
    const selectedBuildLabel = fitDraft.build ? fitBuildOptions.find((option) => option.value === fitDraft.build)?.label ?? "Average" : "Select build";
    const measurementSummary = normalizedFitDraft
      ? `Based on ${fitDraft.heightFeet}'${fitDraft.heightInches}", ${fitDraft.weightLbs} lb, ${selectedBuildLabel.toLowerCase()} build.`
      : hasManualSizeValues
        ? "Known sizes are ready. Complete measurements to calculate the full profile."
        : "Complete your measurements to generate personalized size recommendations.";
    const visualStats = [
      { label: "Suit", value: getFitDisplayValue(previewEstimate.suit) },
      { label: "Tops", value: getFitDisplayValue(previewEstimate.alpha) },
      { label: "Shoes", value: getFitDisplayValue(previewEstimate.shoe) },
    ];
    const estimateItems = [
      { label: "Suit", value: getFitDisplayValue(previewEstimate.suit), icon: Ruler },
      { label: "Tops", value: getFitDisplayValue(previewEstimate.alpha), icon: Shirt },
      { label: "Dress shirt", value: getFitDisplayValue(previewEstimate.dressShirt), icon: Shirt },
      { label: "Waist", value: getFitDisplayValue(previewEstimate.waist), icon: Ruler },
      { label: "Shoes", value: getFitDisplayValue(previewEstimate.shoe), icon: Footprints },
    ];

    return (
      <Card
        className={cn(
          "w-full max-w-full overflow-hidden border-ink/10 bg-white shadow-sm shadow-ink/[0.03]",
          isDrawer ? "h-full rounded-none border-0 shadow-none" : "mb-5 rounded-lg",
        )}
      >
        <CardContent className={cn("grid min-w-0 gap-0 p-0", isDrawer ? "h-full grid-cols-1 overflow-y-auto" : "lg:grid-cols-[minmax(19rem,0.84fr)_minmax(0,1.16fr)]")}>
          <div
            className={cn(
              "relative min-w-0 overflow-hidden bg-ink text-white",
              isDrawer ? "min-h-[16.5rem]" : "min-h-[19rem] sm:min-h-[22rem] lg:min-h-full",
            )}
          >
            <Image
              src={FIT_WIDGET_IMAGE}
              alt="Menswear fitting appointment with suit jackets"
              fill
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-cover"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#071016]/90 via-[#071016]/52 to-[#071016]/12" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#071016] to-transparent" />

            <div className={cn("relative flex flex-col justify-between p-5 sm:p-6", isDrawer ? "min-h-[16.5rem]" : "min-h-[19rem] sm:min-h-[22rem]")}>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex min-h-8 items-center rounded-full bg-white px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-ink uppercase shadow-sm">
                  Smart Fit Profile
                </span>
                {isDrawer ? (
                  <button
                    type="button"
                    onClick={() => setIsFitDrawerOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/18 bg-white/12 text-white backdrop-blur transition-colors hover:bg-white/20"
                    aria-label="Close Smart Fit"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : fitProfile ? (
                  <span className="rounded-full bg-deep-teal px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-white uppercase">
                    Saved
                  </span>
                ) : null}
              </div>

              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-white/70 uppercase">Starting estimate</p>
                <p className="mt-2 text-4xl font-semibold tracking-normal text-white sm:text-5xl">{getFitDisplayValue(previewEstimate.suit)}</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/78">{measurementSummary}</p>

                <div className={cn("mt-5 grid gap-2", isDrawer ? "grid-cols-3" : "grid-cols-3")}>
                  {visualStats.map((item) => (
                    <div key={item.label} className="min-w-0 rounded-md border border-white/14 bg-white/10 px-3 py-2 backdrop-blur">
                      <p className="text-[9px] font-semibold tracking-[0.14em] text-white/58 uppercase">{item.label}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={cn("min-w-0 p-4 sm:p-6", isDrawer ? "pb-7" : "lg:p-7")}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="inline-flex min-h-7 items-center rounded-full border border-deep-teal/20 bg-deep-teal/8 px-3 text-[10px] font-semibold tracking-[0.16em] text-deep-teal uppercase">
                  Smart Fit
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">Find your best starting size.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-smoke">
                  Save a fit profile once. The shop can surface matching suit, shirt, waist, and shoe variants while you browse.
                </p>
              </div>

              {fitProfile ? (
                <div className={cn("flex shrink-0 flex-wrap gap-2 xl:justify-end", isDrawer && "grid grid-cols-2")}>
                  <button
                    type="button"
                    onClick={() => applySmartFit()}
                    className={cn(
                      "inline-flex min-h-10 items-center justify-center rounded-md border border-deep-teal bg-deep-teal px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-[#136868]",
                      isDrawer && "col-span-2",
                    )}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Apply Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFitEditorOpen((current) => !current)}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/15 bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-ink/30 hover:bg-stone"
                  >
                    {isFitEditorOpen ? "Hide Form" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={clearFitProfile}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/12 bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase transition-colors hover:border-ink/30 hover:text-ink"
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>

            <div className={cn("mt-5 grid gap-2", isDrawer ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-5")}>
              {estimateItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="min-h-[5.5rem] min-w-0 rounded-md border border-ink/8 bg-stone px-3 py-3">
                    <div className="flex items-center justify-between gap-2 text-smoke">
                      <p className="text-[10px] font-semibold tracking-[0.14em] uppercase">{item.label}</p>
                      <Icon className="h-4 w-4 shrink-0" />
                    </div>
                    <p className="mt-2 text-base leading-5 font-semibold text-ink">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-md border border-deep-teal/16 bg-deep-teal/7 px-4 py-3">
              <p className="text-sm leading-6 text-ink">
                {fitProfile
                  ? hasSmartFitMatches
                    ? `Ready to shop: matching catalog sizes include ${smartFitSizes.join(", ")}.`
                    : "Profile saved. No exact size matches are visible yet, so broaden filters or add more products to the catalog."
                  : "Enter measurements below to preview recommendations before applying size-aware product filters."}
              </p>
            </div>

            {showFitForm ? (
              <form onSubmit={saveFitProfile} className="mt-5 border-t border-ink/8 pt-5">
                <div className={cn("grid gap-3", isDrawer ? "grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4")}>
                  <div>
                    <FieldLabel htmlFor="fit-height-feet">Height ft</FieldLabel>
                    <Select
                      id="fit-height-feet"
                      value={fitDraft.heightFeet}
                      onChange={(event) => setFitDraft((current) => ({ ...current, heightFeet: event.target.value === "" ? "" : Number(event.target.value) }))}
                      className="mt-2 bg-white"
                      required
                    >
                      <option value="">Feet</option>
                      {[4, 5, 6, 7].map((feet) => (
                        <option key={feet} value={feet}>
                          {feet}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="fit-height-inches">Inches</FieldLabel>
                    <Select
                      id="fit-height-inches"
                      value={fitDraft.heightInches}
                      onChange={(event) => setFitDraft((current) => ({ ...current, heightInches: event.target.value === "" ? "" : Number(event.target.value) }))}
                      className="mt-2 bg-white"
                      required
                    >
                      <option value="">Inches</option>
                      {Array.from({ length: 12 }, (_, index) => index).map((inches) => (
                        <option key={inches} value={inches}>
                          {inches}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="fit-weight">Weight</FieldLabel>
                    <Input
                      id="fit-weight"
                      type="number"
                      min={95}
                      max={340}
                      value={fitDraft.weightLbs}
                      onChange={(event) => setFitDraft((current) => ({ ...current, weightLbs: event.target.value === "" ? "" : Number(event.target.value) }))}
                      className={cn("mt-2 bg-white", isDrawer && "text-base")}
                      placeholder="Weight"
                      required
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="fit-build">Build</FieldLabel>
                    <Select
                      id="fit-build"
                      value={fitDraft.build}
                      onChange={(event) => setFitDraft((current) => ({ ...current, build: event.target.value === "" ? "" : (event.target.value as FitBuild) }))}
                      className="mt-2 bg-white"
                      required
                    >
                      <option value="">Select build</option>
                      {fitBuildOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="mt-5 rounded-md border border-ink/10 bg-stone p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-deep-teal uppercase">Known sizes</p>
                      <p className="mt-1 text-xs leading-5 text-smoke">
                        Optional manual sizes override the estimate.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsManualSizeEditorOpen((current) => !current)}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/15 bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-ink/30"
                    >
                      {isManualSizeEditorOpen ? "Hide Known Sizes" : hasManualSizeValues ? "Edit Known Sizes" : "Add Known Sizes"}
                    </button>
                  </div>

                  {!isManualSizeEditorOpen && hasManualSizeValues ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {manualSizeItems.map((item) => (
                        <span key={item.label} className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink">
                          {item.label}: {item.value}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {isManualSizeEditorOpen ? (
                    <div className={cn("mt-3 grid gap-3", isDrawer ? "grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-5")}>
                      <div>
                        <FieldLabel htmlFor="fit-known-suit">Suit</FieldLabel>
                        <Input
                          id="fit-known-suit"
                          value={fitDraft.knownSuitSize ?? ""}
                          onChange={(event) => setFitDraft((current) => ({ ...current, knownSuitSize: event.target.value }))}
                          placeholder="40L"
                          className={cn("mt-2 bg-white", isDrawer && "text-base")}
                        />
                      </div>

                      <div>
                        <FieldLabel htmlFor="fit-known-top">Top</FieldLabel>
                        <Input
                          id="fit-known-top"
                          value={fitDraft.knownTopSize ?? ""}
                          onChange={(event) => setFitDraft((current) => ({ ...current, knownTopSize: event.target.value }))}
                          placeholder="M"
                          className={cn("mt-2 bg-white", isDrawer && "text-base")}
                        />
                      </div>

                      <div>
                        <FieldLabel htmlFor="fit-known-shirt">Dress shirt</FieldLabel>
                        <Input
                          id="fit-known-shirt"
                          value={fitDraft.knownDressShirtSize ?? ""}
                          onChange={(event) => setFitDraft((current) => ({ ...current, knownDressShirtSize: event.target.value }))}
                          placeholder="16 x 34/35"
                          className={cn("mt-2 bg-white", isDrawer && "text-base")}
                        />
                      </div>

                      <div>
                        <FieldLabel htmlFor="fit-known-waist">Waist</FieldLabel>
                        <Input
                          id="fit-known-waist"
                          value={fitDraft.knownWaistSize ?? ""}
                          onChange={(event) => setFitDraft((current) => ({ ...current, knownWaistSize: event.target.value }))}
                          placeholder="33"
                          className={cn("mt-2 bg-white", isDrawer && "text-base")}
                        />
                      </div>

                      <div className={cn(isDrawer && "col-span-2")}>
                        <FieldLabel htmlFor="fit-shoe">Shoe</FieldLabel>
                        <Input
                          id="fit-shoe"
                          value={fitDraft.shoeSize ?? ""}
                          onChange={(event) => setFitDraft((current) => ({ ...current, shoeSize: event.target.value }))}
                          placeholder="10"
                          className={cn("mt-2 bg-white", isDrawer && "text-base")}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-gold bg-gold px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:bg-[#d7b979]"
                >
                  Calculate Fit
                </button>

                <p className="mt-3 text-xs leading-5 text-smoke">
                  Fit is an estimate for browsing. A tailor or in-store appointment is still best for final suit adjustments.
                </p>
              </form>
            ) : (
              <div className="mt-5 flex flex-col gap-2 border-t border-ink/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-smoke">
                  Saved to this browser as {fitDraft.heightFeet}&apos;{fitDraft.heightInches}&quot;, {fitDraft.weightLbs} lb, {selectedBuildLabel.toLowerCase()} build.
                </p>
                <button
                  type="button"
                  onClick={() => setIsFitEditorOpen(true)}
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/15 bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-ink/30 hover:bg-stone"
                >
                  Update Profile
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderFitProfileLauncher() {
    const estimate = fitProfile?.estimate;
    const savedSizeSummary = estimate
      ? [
          { label: "Suit", value: getFitDisplayValue(estimate.suit, "") },
          { label: "Top", value: getFitDisplayValue(estimate.alpha, "") },
          { label: "Waist", value: getFitDisplayValue(estimate.waist, "") },
          { label: "Shoe", value: getFitDisplayValue(estimate.shoe, "") },
        ]
          .filter((item) => item.value)
          .map((item) => `${item.label} ${item.value}`)
          .join(" · ")
      : "";
    const launcherTitle = fitProfile ? "Smart Fit profile saved" : "Find your size with Smart Fit";
    const launcherSubtitle = fitProfile
      ? savedSizeSummary || "Tap to review your saved measurements."
      : "Save your measurements once and we'll flag pieces in your size.";
    const launcherAction = fitProfile ? "Review" : "Set Up";

    return (
      <button
        type="button"
        onClick={() => setIsFitDrawerOpen(true)}
        className="mb-4 flex w-full items-center justify-between gap-3 rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 text-left shadow-sm shadow-ink/[0.03] transition-colors hover:border-deep-teal/30 hover:bg-[#fbfcfc]"
        aria-controls="smart-fit-panel"
        aria-expanded={isFitDrawerOpen}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-deep-teal/15 bg-deep-teal/8 text-deep-teal">
            <Ruler className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">{launcherTitle}</span>
            <span className="mt-0.5 block truncate text-xs text-smoke">{launcherSubtitle}</span>
          </span>
        </span>

        <span className="shrink-0 rounded-md border border-gold/90 bg-gold px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-ink uppercase">
          {launcherAction}
        </span>
      </button>
    );
  }

  const topPickTabs = [
    { id: "best", label: "Best Sellers", items: bestSellers.slice(0, 10) },
    { id: "new", label: "New Arrivals", items: products.slice(0, 10) },
    {
      id: "under-100",
      label: "Under $100",
      items: products.filter((product) => getProductPrice(product) < 100).slice(0, 10),
    },
  ].filter((tab) => tab.items.length > 0);
  const activeTopPicksTab = topPickTabs.find((tab) => tab.id === activeTopPicksId) ?? topPickTabs[0];

  function renderTopPicks() {
    if (bestSellers.length === 0 || !activeTopPicksTab) {
      return null;
    }

    return (
      <section className="mb-6" aria-label="Top picks">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink sm:text-xl">Top Picks</h2>
        </div>

        <div className="mt-2 flex gap-5 overflow-x-auto border-b border-ink/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {topPickTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTopPicksId(tab.id)}
              className={cn(
                "-mb-px shrink-0 border-b-2 pb-2 text-sm transition-colors",
                tab.id === activeTopPicksTab.id
                  ? "border-ink font-semibold text-ink"
                  : "border-transparent font-medium text-smoke hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {activeTopPicksTab.items.map((product) => {
            const isOnSale =
              Boolean(product.variants[0]?.compareAtPrice) &&
              Number(product.variants[0].compareAtPrice?.amount) > Number(product.variants[0].price.amount);

            return (
              <Link
                key={`${activeTopPicksTab.id}-${product.id}`}
                href={`/shop/${product.handle}`}
                className="group w-36 shrink-0 snap-start sm:w-44"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-ink/10 bg-white">
                  {product.featuredImage ? (
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      fill
                      sizes="176px"
                      className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  ) : null}
                </div>
                {product.vendor ? (
                  <p className="mt-2 truncate text-[10px] font-semibold tracking-[0.14em] text-smoke uppercase">
                    {product.vendor}
                  </p>
                ) : null}
                <p className="mt-0.5 truncate text-sm font-medium text-ink transition-colors group-hover:text-deep-teal">
                  {product.title}
                </p>
                <p className={cn("mt-0.5 text-sm font-bold", isOnSale ? "text-[#8f2632]" : "text-ink")}>
                  {formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  const facetPillOptions: FacetPill[] = [
    { key: "availability", label: "Availability", activeCount: availability !== DEFAULT_AVAILABILITY ? 1 : 0 },
    { key: "price", label: "Price", activeCount: priceFilter !== "all" ? 1 : 0 },
    { key: "brand", label: "Brand", activeCount: selectedVendors.length },
    { key: "size", label: "Size", activeCount: selectedSizes.length },
    { key: "color", label: "Color", activeCount: selectedColors.length },
  ];
  const facetPills = facetPillOptions.filter((pill) => {
    if (pill.key === "brand") return vendors.length > 0;
    if (pill.key === "size") return sizes.length > 0;
    if (pill.key === "color") return colors.length > 0;
    return true;
  });

  function clearFacet(key: FacetKey) {
    startTransition(() => {
      if (key === "availability") setAvailability(DEFAULT_AVAILABILITY);
      if (key === "price") setPriceFilter("all");
      if (key === "brand") setSelectedVendors([]);
      if (key === "color") setSelectedColors([]);

      if (key === "size") {
        setSelectedSizes([]);
        setSmartFitEnabled(false);
      }
    });
  }

  function renderFacetPopoverContent(key: FacetKey) {
    if (key === "availability") {
      return (
        <div className="space-y-1">
          {[
            { label: "All items", value: "all" },
            { label: "In stock", value: "in-stock" },
            { label: "Sold out", value: "sold-out" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-ink transition-colors hover:bg-stone/60"
            >
              <input
                type="radio"
                name="pill-availability"
                checked={availability === option.value}
                onChange={() => {
                  shouldScrollToResultsRef.current = false;
                  startTransition(() => setAvailability(option.value as AvailabilityOption));
                }}
                className="h-4 w-4 accent-deep-teal"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    if (key === "price") {
      return (
        <div className="space-y-1">
          {[
            { label: "All prices", value: "all" },
            { label: "Under $100", value: "under-100" },
            { label: "$100 to $250", value: "100-250" },
            { label: "$250 to $500", value: "250-500" },
            { label: "$500 and up", value: "500-plus" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-ink transition-colors hover:bg-stone/60"
            >
              <input
                type="radio"
                name="pill-price"
                checked={priceFilter === option.value}
                onChange={() => {
                  shouldScrollToResultsRef.current = false;
                  startTransition(() => setPriceFilter(option.value as PriceOption));
                }}
                className="h-4 w-4 accent-deep-teal"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    if (key === "brand") {
      return (
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {vendors.map((vendor) => (
            <label
              key={vendor}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-ink transition-colors hover:bg-stone/60"
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
      );
    }

    const values = key === "size" ? sizes : colors;
    const selected = key === "size" ? selectedSizes : selectedColors;

    return (
      <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => (key === "size" ? toggleSize(value) : toggleValue(selectedColors, value, setSelectedColors))}
            className={cn(
              "min-h-9 rounded-full border px-3.5 text-xs font-semibold tracking-[0.08em] uppercase transition-colors",
              selected.includes(value)
                ? "border-deep-teal bg-deep-teal text-white"
                : "border-ink/15 bg-white text-ink hover:border-ink/40",
            )}
          >
            {value}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 sm:px-5 lg:px-6 xl:px-8">
      {renderTopPicks()}
      {renderFitProfileLauncher()}

      {isFitDrawerOpen ? (
        <>
          <button
            type="button"
            onClick={() => setIsFitDrawerOpen(false)}
            className="fixed inset-0 z-[150] bg-[#0b0f14]/55"
            aria-label="Close Smart Fit"
          />
          <div className="fixed inset-y-0 left-0 z-[160] w-full max-w-[24rem] sm:max-w-[28rem] lg:max-w-[32rem]">
            <div id="smart-fit-panel" role="dialog" aria-modal="true" aria-label="Smart Fit calculator" className="h-full bg-white shadow-xl">
              {renderFitProfileCard("drawer")}
            </div>
          </div>
        </>
      ) : null}

      <div ref={pillBarRef} className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-ink/40 lg:hidden"
            aria-expanded={isMobileFiltersOpen}
            aria-controls="shop-filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            All Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-deep-teal px-2 py-0.5 text-[10px] font-semibold text-white">{activeFilterCount}</span>
            ) : null}
          </button>

          <div className="relative shrink-0">
            <label htmlFor="shop-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(event) => {
                shouldScrollToResultsRef.current = false;
                startTransition(() => {
                  setSort(event.target.value as SortOption);
                });
              }}
              className="h-10 appearance-none rounded-full border border-ink/15 bg-white pr-9 pl-4 text-sm font-medium text-ink outline-none transition-colors hover:border-ink/40 focus:border-deep-teal"
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">Sort: Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="title-asc">Alphabetical</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-smoke" />
          </div>

          {facetPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setOpenFacet((current) => (current === pill.key ? null : pill.key))}
              aria-expanded={openFacet === pill.key}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors lg:hidden",
                pill.activeCount > 0 || openFacet === pill.key
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 bg-white text-ink hover:border-ink/40",
              )}
            >
              {pill.label}
              {pill.activeCount > 0 ? (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">{pill.activeCount}</span>
              ) : null}
              <ChevronDown className={cn("h-4 w-4 transition-transform", openFacet === pill.key && "rotate-180")} />
            </button>
          ))}

          {isSearchOpen ? (
            <div className="relative hidden shrink-0 lg:block">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-smoke" />
              <Input
                autoFocus
                value={query}
                onChange={(event) => {
                  shouldScrollToResultsRef.current = false;
                  setQuery(event.target.value);
                }}
                placeholder="Search products"
                aria-label="Search products"
                className="mt-0 h-10 w-56 rounded-full py-0 pr-9 pl-10 text-sm xl:w-64"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute top-1/2 right-1.5 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-smoke transition-colors hover:text-ink"
                aria-label="Close search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white text-ink transition-colors hover:border-ink/40 lg:inline-flex"
              aria-label="Search products"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          <div className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full border border-ink/15 bg-white p-1 sm:hidden" role="group" aria-label="Product layout">
            <button
              type="button"
              onClick={() => setMobileLayout("grid")}
              aria-pressed={mobileLayout === "grid"}
              aria-label="Two column grid"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                mobileLayout === "grid" ? "bg-ink text-white" : "text-smoke hover:text-ink",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileLayout("single")}
              aria-pressed={mobileLayout === "single"}
              aria-label="Single column view"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                mobileLayout === "single" ? "bg-ink text-white" : "text-smoke hover:text-ink",
              )}
            >
              <Square className="h-4 w-4" />
            </button>
          </div>
        </div>

        {openFacet ? (
          <div className="absolute top-full left-0 z-[60] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-ink/10 bg-white p-4 shadow-[0_30px_70px_-40px_rgba(11,15,20,0.5)] lg:hidden">
            {renderFacetPopoverContent(openFacet)}
            <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
              <button
                type="button"
                onClick={() => clearFacet(openFacet)}
                className="text-xs font-semibold tracking-[0.12em] text-smoke uppercase transition-colors hover:text-ink"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpenFacet(null)}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-ink bg-ink px-4 text-xs font-semibold tracking-[0.12em] text-white uppercase transition-colors hover:bg-deep-teal"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <p className={cn("mt-3 text-sm text-smoke", isFiltering && "text-deep-teal")}>
        {filteredProducts.length === products.length
          ? `${products.length} ${pluralize(products.length, "product")}`
          : `Showing ${filteredProducts.length} of ${products.length} ${pluralize(products.length, "product")}`}
        {isFiltering ? " · Updating" : ""}
      </p>

      {hasActiveFilters || isFiltering ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {query.trim() ? (
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-1.5 rounded-full border border-deep-teal/25 bg-deep-teal/8 px-3 py-1.5 text-xs font-semibold text-deep-teal transition-colors hover:border-deep-teal/50"
              aria-label={`Clear search for ${query.trim()}`}
            >
              &ldquo;{query.trim()}&rdquo;
              <X className="h-3 w-3" />
            </button>
          ) : null}
          {renderActiveFilterBadges()}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase transition-colors hover:text-ink"
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
            className="fixed inset-0 z-[130] bg-[#0b0f14]/55"
            aria-label="Close filters"
          />
          <div className="fixed inset-y-0 right-0 z-[140] w-full max-w-md p-3 sm:p-4">
            <div id="shop-filters" role="dialog" aria-modal="true" aria-label="Filter products" className="h-full">
              {renderFilterPanel("mobile")}
            </div>
          </div>
        </>
      ) : null}

      <div className="lg:mt-6 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-24 lg:block">{renderFilterPanel("desktop")}</aside>

        <div className="min-w-0">
          <div ref={resultsAnchorRef} className="h-px" />

          {filteredProducts.length > 0 ? (
            <div
              aria-busy={isFiltering}
              className={cn(
                "mt-6 grid gap-3 transition-[opacity,transform,filter] duration-300 ease-out sm:grid-cols-2 md:grid-cols-3 lg:mt-0 lg:grid-cols-2 xl:grid-cols-3 xl:gap-4",
                mobileLayout === "grid" ? "grid-cols-2" : "grid-cols-1",
                isFiltering ? "translate-y-1 opacity-60 blur-[1px]" : "translate-y-0 opacity-100 blur-0",
              )}
            >
              {filteredProducts.map((product) => (
                <ShopProductCard
                  key={product.id}
                  product={product}
                  fitSizes={smartFitEnabled ? smartFitSizes : []}
                  imageSizes={
                    mobileLayout === "grid"
                      ? "(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <Card
              className={cn(
                "mt-8 transition-[opacity,transform,filter] duration-300 ease-out lg:mt-0",
                isFiltering ? "translate-y-1 opacity-60 blur-[1px]" : "translate-y-0 opacity-100 blur-0",
              )}
            >
              <CardContent>
                <h3 className="text-2xl font-semibold tracking-[-0.02em] text-ink">No products match your filters</h3>
                <p className="mt-3 text-sm leading-7 text-smoke">
                  Try a broader search or clear filters to bring more products back into view.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-deep-teal bg-deep-teal px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors duration-200 hover:bg-[#136868]"
                >
                  Reset Filters
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
