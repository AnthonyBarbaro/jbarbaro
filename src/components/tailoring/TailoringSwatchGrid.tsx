"use client";

import Image from "next/image";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

type TailoringSwatch = {
  sku: string;
  thumb: string;
  full: string;
};

type TailoringSwatchGridProps = {
  swatches: TailoringSwatch[];
};

const INITIAL_SWATCH_COUNT = 24;
const SWATCH_PAGE_SIZE = 36;

export function TailoringSwatchGrid({ swatches }: TailoringSwatchGridProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_SWATCH_COUNT);
  const visibleSwatches = swatches.slice(0, visibleCount);
  const remainingCount = Math.max(swatches.length - visibleCount, 0);

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {visibleSwatches.map((swatch) => (
          <a
            key={swatch.sku}
            href={swatch.full}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-2xl border border-ink/12 bg-ivory transition-all hover:-translate-y-1 hover:border-gold"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={swatch.thumb}
                alt={`Tailoring cloth swatch ${swatch.sku}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="text-[11px] font-semibold tracking-[0.12em] text-ink uppercase">
                {swatch.sku}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-deep-teal" aria-hidden />
            </div>
          </a>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-smoke" aria-live="polite">
        Showing {visibleSwatches.length} of {swatches.length} fabric swatches.
      </p>

      <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {remainingCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setVisibleCount((count) => Math.min(count + SWATCH_PAGE_SIZE, swatches.length))
            }
          >
            View {Math.min(SWATCH_PAGE_SIZE, remainingCount)} More Swatches
            <ChevronDown className="ml-2 h-4 w-4" aria-hidden />
          </Button>
        ) : null}
        {visibleCount > INITIAL_SWATCH_COUNT ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setVisibleCount(INITIAL_SWATCH_COUNT)}
          >
            Show Fewer
            <ChevronUp className="ml-2 h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
