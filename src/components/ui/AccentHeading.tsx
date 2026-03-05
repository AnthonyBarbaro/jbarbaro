import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type AccentHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
};

export function AccentHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  children,
}: AccentHeadingProps) {
  const centered = align === "center";

  return (
    <div className={cn(centered && "mx-auto text-center", className)}>
      {eyebrow ? <Badge variant="gold">{eyebrow}</Badge> : null}
      <h2 className="mt-3 font-heading text-3xl leading-tight text-ink sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 max-w-2xl text-base leading-7 text-smoke">{description}</p> : null}
      {children}
    </div>
  );
}
