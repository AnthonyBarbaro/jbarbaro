import type { ElementType, ReactNode } from "react";

import { WaveDivider } from "@/components/ui/WaveDivider";
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
  ink: "bg-ink text-ivory",
  transparent: "text-ink",
};

export function WaveSection({
  as = "section",
  children,
  className,
  contentClassName,
  background = "ivory",
  topWave,
  bottomWave,
  padded = true,
}: WaveSectionProps) {
  const Component = as;

  return (
    <Component className={cn("relative", backgroundClass[background], className)}>
      {topWave ? <WaveDivider variant={topWave} /> : null}
      <div className={cn(padded && "py-14 sm:py-18 lg:py-22", contentClassName)}>{children}</div>
      {bottomWave ? <WaveDivider variant={bottomWave} flipped /> : null}
    </Component>
  );
}
