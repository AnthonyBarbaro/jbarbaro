import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  description: string;
  eyebrow?: string;
  className?: string;
  children?: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function PageHero({
  title,
  description,
  eyebrow = "J. Barbaro Clothiers",
  className,
  children,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-ink/10 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-ink",
        className,
      )}
    >
      <Container className="relative py-8 sm:py-10 lg:py-12">
        <div className="max-w-5xl">
          {eyebrow ? (
            <div className="inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.18em] text-smoke uppercase">
              <span className="h-px w-7 bg-gold" aria-hidden />
              <span>{eyebrow}</span>
            </div>
          ) : null}
          <h1 className="mt-3 max-w-4xl text-balance font-heading text-3xl leading-tight text-ink sm:text-4xl lg:text-[3.25rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-pretty text-[0.98rem] leading-7 text-smoke sm:text-base sm:leading-8">
            {description}
          </p>
        </div>
        {(ctaHref && ctaLabel) || (secondaryHref && secondaryLabel) ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {ctaHref && ctaLabel ? (
              <ButtonLink href={ctaHref} className="w-full sm:w-auto">
                {ctaLabel}
              </ButtonLink>
            ) : null}
            {secondaryHref && secondaryLabel ? (
              <ButtonLink
                href={secondaryHref}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {secondaryLabel}
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
