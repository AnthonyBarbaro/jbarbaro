import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
};

export function SectionHeading({
  title,
  eyebrow,
  description,
  align = "left",
  className,
  children,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={cn(centered && "mx-auto text-center", className)}>
      {eyebrow ? <Badge variant="gold">{eyebrow}</Badge> : null}
      <h2 className="mt-4 text-balance font-heading text-3xl leading-tight text-ink sm:text-4xl lg:text-5xl">{title}</h2>
      {description ? (
        <p className={cn("mt-4 max-w-3xl text-pretty text-[0.98rem] leading-7 text-smoke sm:text-base sm:leading-8", centered && "mx-auto")}>
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
