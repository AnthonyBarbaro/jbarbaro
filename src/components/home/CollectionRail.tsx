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
      behavior: "smooth",
    });
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={`${railId}-heading`}>
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 pb-3">
        <h2 id={`${railId}-heading`} className="font-heading text-2xl text-ink sm:text-4xl">
          Shop Categories
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

          <div
            className="hidden items-center gap-2 border-l border-ink/12 pl-3 sm:flex"
            role="group"
            aria-label="Browse shop categories"
          >
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-ink/15 bg-white text-ink transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal"
              aria-label="Show previous categories"
              aria-controls={railId}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-ink/15 bg-white text-ink transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal"
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
        className="mt-4 -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:mt-5 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {collections.map((collection) => (
          <li
            key={collection.slug}
            className="w-[78vw] max-w-[19rem] shrink-0 snap-start sm:w-[17rem] lg:w-[15rem] xl:w-[12.5rem]"
          >
            <Link
              href={collection.href}
              className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
            >
              <Card className="h-full overflow-hidden bg-white transition-[border-color,transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:border-gold/50 group-hover:shadow-[0_20px_44px_-34px_rgba(11,15,20,0.45)]">
                <div className="relative aspect-[4/5] bg-stone">
                  <Image
                    src={collection.image}
                    alt={`${collection.name} collection`}
                    fill
                    sizes="(max-width: 639px) 78vw, (max-width: 1024px) 17rem, 15rem"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/88 via-ink/16 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">
                        Shop
                      </p>
                      <h3 className="mt-1 font-heading text-2xl leading-tight text-white sm:text-3xl">
                        {collection.name}
                      </h3>
                    </div>
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold bg-gold text-ink shadow-sm transition-transform group-hover:translate-x-1">
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
