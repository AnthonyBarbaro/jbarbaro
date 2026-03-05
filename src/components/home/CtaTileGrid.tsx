import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { CtaTile } from "@/types/site";

type CtaTileGridProps = {
  tiles: CtaTile[];
};

export function CtaTileGrid({ tiles }: CtaTileGridProps) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="teal">Client Journeys</Badge>
            <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">What We Can Help You With</h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <article key={tile.id} className="group relative min-h-[300px] overflow-hidden rounded-3xl border border-ink/10 luxe-shadow">
              <Image
                src={tile.image}
                alt={tile.title}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,15,14,0.86),rgba(11,15,14,0.18))]" />
              <div className="relative z-10 flex h-full flex-col justify-end p-6 text-ivory">
                <h3 className="font-heading text-3xl leading-tight">{tile.title}</h3>
                <p className="mt-3 text-sm text-ivory/85">{tile.description}</p>
                <Link
                  href={tile.href}
                  target={tile.external ? "_blank" : undefined}
                  rel={tile.external ? "noopener noreferrer" : undefined}
                  className="mt-5 inline-flex self-start border-b border-ivory/65 text-xs font-semibold tracking-[0.14em] uppercase transition-colors hover:border-gold hover:text-gold"
                >
                  Learn More
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
