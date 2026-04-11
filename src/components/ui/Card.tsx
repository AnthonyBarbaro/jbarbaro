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
  stone: "bg-[linear-gradient(180deg,rgba(245,239,231,0.95),rgba(231,222,211,0.95))] text-ink",
  ink: "bg-ink text-ivory",
};

export function Card({ children, className, tone = "ivory", ...props }: CardProps) {
  return (
    <article
      className={cn(
        "luxe-shadow overflow-hidden rounded-[1.75rem] border border-ink/8",
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
