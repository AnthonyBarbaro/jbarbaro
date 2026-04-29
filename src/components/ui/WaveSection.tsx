import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type WaveVariant = "A" | "B" | "C";

type WaveSectionProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  background?: "ivory" | "stone" | "ink" | "transparent";
  topWave?: WaveVariant;
  bottomWave?: WaveVariant;
  padded?: boolean;
};

const backgroundClass = {
  ivory: "bg-ivory text-ink",
  stone: "bg-stone text-ink",
  ink: "bg-[#0b0f14] text-white",
  transparent: "text-ink",
};

export function WaveSection({
  as = "section",
  children,
  className,
  contentClassName,
  background = "ivory",
  padded = true,
}: WaveSectionProps) {
  const Component = as;

  return (
    <Component className={cn("relative", backgroundClass[background], className)}>
      <div className={cn(padded && "py-12 sm:py-14 lg:py-16", contentClassName)}>{children}</div>
    </Component>
  );
}
