"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useRef } from "react";

import { Card } from "@/components/ui/Card";

export type CollectionRailItem = {
  slug: string;
  href: string;
  name: string;
  image: string;
};

type CollectionRailProps = {
  collections: CollectionRailItem[];
};

export function CollectionRail({ collections }: CollectionRailProps) {
  const railRef = useRef<HTMLUListElement | null>(null);
  const railId = useId();

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.82, 260),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={`${railId}-heading`} className="bg-[#f8f5ee]">
      <div className="flex items-center justify-between gap-3 border-b border-ink/15 px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <h2 id={`${railId}-heading`} className="font-heading text-3xl text-ink sm:text-4xl">
          Categories
        </h2>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/categories"
            className="group inline-flex min-h-11 items-center gap-1.5 px-1 text-xs font-semibold tracking-[0.12em] text-deep-teal uppercase transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
            aria-label="View all shop categories"
          >
            <span className="sm:hidden">View All</span>
            <span className="hidden sm:inline">View All Categories</span>
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>

          <div className="flex items-center gap-px" role="group" aria-label="Browse categories">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              className="inline-flex h-11 w-11 items-center justify-center border border-ink/20 bg-transparent text-ink transition-colors duration-200 hover:bg-ink hover:text-ivory focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal"
              aria-label="Show previous categories"
              aria-controls={railId}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              className="inline-flex h-11 w-11 items-center justify-center border border-ink/20 bg-transparent text-ink transition-colors duration-200 hover:bg-ink hover:text-ivory focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal"
              aria-label="Show more categories"
              aria-controls={railId}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <ul
        id={railId}
        ref={railRef}
        aria-label="Shop all collections"
        className="flex snap-x snap-mandatory scroll-px-0 gap-px overflow-x-auto overscroll-x-contain bg-ink/15 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {collections.map((collection) => (
          <li
            key={collection.slug}
            className="w-[76vw] shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-[23vw] xl:w-[19vw] 2xl:w-[16.666vw]"
          >
            <Link
              href={collection.href}
              className="group block h-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-deep-teal"
            >
              <Card className="h-full overflow-hidden rounded-none border-0 bg-white transition-[filter] duration-300 group-hover:brightness-[0.96] motion-reduce:transition-none">
                <div className="relative aspect-[4/5] bg-stone">
                  <Image
                    src={collection.image}
                    alt={`${collection.name} collection`}
                    fill
                    sizes="(max-width: 639px) 78vw, (max-width: 1024px) 17rem, 15rem"
                    className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/12 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                    <h3 className="min-w-0 font-heading text-3xl leading-none text-white">
                      {collection.name}
                    </h3>
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-white/55 bg-ivory text-ink transition-[background-color,color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:bg-gold">
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
