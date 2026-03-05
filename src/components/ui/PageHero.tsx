import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
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
    <section className={cn("relative overflow-hidden bg-ink text-ivory", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(199,164,106,0.2),_transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_90%,_rgba(15,91,91,0.3),_transparent_46%)]" />
      <Container className="relative py-12 sm:py-16 lg:py-20">
        <Badge
          variant="gold"
          className="border-gold/95 bg-gold px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[0.13em] text-ink shadow-[0_10px_26px_-16px_rgba(0,0,0,0.9)] sm:text-xs"
        >
          {eyebrow}
        </Badge>
        <h1 className="mt-4 max-w-4xl text-balance font-heading text-3xl leading-tight sm:mt-5 sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-pretty text-[0.98rem] leading-7 text-ivory/82 sm:mt-5 sm:text-lg sm:leading-8">
          {description}
        </p>
        {(ctaHref && ctaLabel) || (secondaryHref && secondaryLabel) ? (
          <div className="mt-7 flex flex-wrap gap-3">
            {ctaHref && ctaLabel ? (
              <ButtonLink href={ctaHref} className="w-full sm:w-auto">
                {ctaLabel}
              </ButtonLink>
            ) : null}
            {secondaryHref && secondaryLabel ? (
              <ButtonLink
                href={secondaryHref}
                variant="secondary"
                className="w-full border-ivory/75 text-ivory hover:border-gold hover:text-gold sm:w-auto"
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
