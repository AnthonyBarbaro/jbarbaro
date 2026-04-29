import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardTone = "ivory" | "stone" | "ink";

type CardProps = {
  children: ReactNode;
  className?: string;
  tone?: CardTone;
} & ComponentPropsWithoutRef<"article">;

const toneClasses: Record<CardTone, string> = {
  ivory: "bg-ivory text-ink",
  stone: "bg-stone text-ink",
  ink: "bg-[#0b0f14] text-white",
};

export function Card({ children, className, tone = "ivory", ...props }: CardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-ink/10 shadow-sm shadow-ink/[0.03]",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </article>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-5 sm:p-6 lg:p-7", className)}>{children}</div>;
}
