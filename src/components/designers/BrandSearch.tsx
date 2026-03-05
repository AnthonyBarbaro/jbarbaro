"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import type { Brand } from "@/types/site";

type BrandSearchProps = {
  brands: Brand[];
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function BrandSearch({ brands }: BrandSearchProps) {
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string>("ALL");

  const fuse = useMemo(
    () =>
      new Fuse(brands, {
        keys: ["name", "slug", "description"],
        threshold: 0.3,
      }),
    [brands],
  );

  const filteredByQuery = useMemo(() => {
    if (!query.trim()) {
      return brands;
    }

    return fuse.search(query).map((entry) => entry.item);
  }, [brands, fuse, query]);

  const filtered = useMemo(() => {
    if (activeLetter === "ALL") {
      return filteredByQuery;
    }

    return filteredByQuery.filter((brand) => brand.name.toUpperCase().startsWith(activeLetter));
  }, [activeLetter, filteredByQuery]);

  return (
    <div>
      <div className="rounded-3xl border border-ink/10 bg-ivory p-5 luxe-shadow">
        <Badge variant="teal">Search Designers</Badge>
        <label htmlFor="brand-search" className="mt-4 block text-xs font-semibold tracking-[0.14em] text-smoke uppercase">
          Find by Name
        </label>
        <Input
          id="brand-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a designer name"
          className="mt-2"
        />

        <div className="mt-5 overflow-x-auto pb-1">
          <div className="flex w-max gap-2">
            <button
              type="button"
              onClick={() => setActiveLetter("ALL")}
              className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.1em] uppercase transition-colors ${
                activeLetter === "ALL"
                  ? "border-gold bg-gold/18 text-ink"
                  : "border-ink/20 bg-white text-ink/70 hover:border-deep-teal hover:text-deep-teal"
              }`}
            >
              All
            </button>
            {alphabet.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setActiveLetter(letter)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.1em] uppercase transition-colors ${
                  activeLetter === letter
                    ? "border-gold bg-gold/18 text-ink"
                    : "border-ink/20 bg-white text-ink/70 hover:border-deep-teal hover:text-deep-teal"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered
          .sort((left, right) => left.name.localeCompare(right.name))
          .map((brand) => (
            <Link
              href={`/collection-brand/${brand.slug}`}
              key={brand.slug}
              className="rounded-2xl border border-ink/10 bg-ivory px-4 py-3 text-sm font-semibold tracking-[0.08em] text-ink uppercase transition-colors hover:border-gold hover:text-deep-teal"
            >
              {brand.name}
            </Link>
          ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-smoke">No matching designers found. Try another keyword.</p>
      ) : null}
    </div>
  );
}
