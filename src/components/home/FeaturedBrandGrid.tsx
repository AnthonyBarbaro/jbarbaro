import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { Brand } from "@/types/site";

type FeaturedBrandGridProps = {
  brands: Brand[];
};

export function FeaturedBrandGrid({ brands }: FeaturedBrandGridProps) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="gold">Designer Spotlight</Badge>
            <h2 className="mt-4 font-heading text-4xl leading-tight text-ink sm:text-5xl">Featured Brands We Carry</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-smoke">
              Curated labels selected for premium construction, strong silhouettes, and modern versatility.
            </p>
          </div>
          <Link
            href="/designers/all-designer-brands"
            className="text-sm font-semibold tracking-[0.12em] text-deep-teal uppercase hover:text-gold"
          >
            View All Brands
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <Link
              href={`/collection-brand/${brand.slug}`}
              key={brand.slug}
              className="group overflow-hidden rounded-3xl border border-ink/10 bg-ivory transition-all hover:-translate-y-1 hover:border-gold"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={brand.image}
                  alt={`${brand.name} designer collection`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/66 via-ink/12 to-transparent" />
                <div className="absolute right-3 bottom-3 left-3 rounded-xl border border-white/45 bg-white/88 p-2 backdrop-blur-sm">
                  <div className="relative h-10">
                    <Image src={brand.logo} alt={`${brand.name} logo`} fill sizes="200px" className="object-contain" />
                  </div>
                </div>
              </div>
              <h3 className="px-4 pt-4 text-xs font-semibold tracking-[0.12em] text-ink uppercase group-hover:text-deep-teal">
                {brand.name}
              </h3>
              <p className="mt-1 px-4 pb-4 line-clamp-2 text-xs text-smoke">{brand.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
