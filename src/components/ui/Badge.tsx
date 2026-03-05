import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "gold" | "teal" | "neutral";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantClass: Record<BadgeVariant, string> = {
  gold: "bg-gold text-ink border-gold/95 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.65)]",
  teal: "bg-deep-teal text-ivory border-deep-teal/95 shadow-[0_10px_24px_-14px_rgba(11,15,20,0.55)]",
  neutral: "bg-ivory text-ink border-ink/30",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[0.7rem] font-semibold tracking-[0.12em] uppercase sm:text-[11px] sm:tracking-[0.14em]",
        variantClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
