"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

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
  const railRef = useRef<HTMLDivElement | null>(null);

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
    <div className="mt-7">
      <div className="mb-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollRail(-1)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-white text-ink transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal"
          aria-label="Show previous collections"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollRail(1)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-white text-ink transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal"
          aria-label="Show more collections"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={railRef}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        aria-label="Shop all collections"
      >
        {collections.map((collection) => (
          <Link
            key={collection.slug}
            href={collection.href}
            className="group block w-[68vw] max-w-[18rem] shrink-0 snap-start sm:w-[17rem] lg:w-[15rem] xl:w-[12.5rem]"
          >
            <Card className="h-full overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:border-gold/40">
              <div className="relative aspect-[4/5] bg-stone">
                <Image
                  src={collection.image}
                  alt={`${collection.name} collection`}
                  fill
                  sizes="(max-width: 640px) 68vw, (max-width: 1024px) 17rem, 15rem"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/78 via-ink/12 to-transparent" />
                <h3 className="absolute inset-x-0 bottom-0 p-4 font-heading text-2xl text-white sm:text-3xl">
                  {collection.name}
                </h3>
                <span className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/25 bg-ink/35 text-white backdrop-blur transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
