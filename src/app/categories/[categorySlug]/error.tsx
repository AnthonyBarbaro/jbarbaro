"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

type CategoryErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CategoryError({ reset }: CategoryErrorProps) {
  return (
    <section className="bg-stone/45 py-12 sm:py-16" aria-labelledby="category-error-heading">
      <Container>
        <div className="mx-auto max-w-2xl rounded-lg border border-ink/10 bg-white p-6 sm:p-8">
          <div role="alert">
            <h1 id="category-error-heading" className="font-heading text-3xl text-ink sm:text-4xl">
              We couldn&rsquo;t load this category.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-smoke sm:text-base">
              Live inventory is temporarily unavailable. Try loading the category again, or browse
              the full shop.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={reset} className="w-full sm:w-auto">
              Try Again
            </Button>
            <ButtonLink href="/shop" variant="secondary" className="w-full sm:w-auto">
              Browse Shop
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
