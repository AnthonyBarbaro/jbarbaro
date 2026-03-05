import { useId } from "react";

import { cn } from "@/lib/utils";

type WaveVariant = "A" | "B" | "C";

type WaveDividerProps = {
  variant?: WaveVariant;
  flipped?: boolean;
  className?: string;
};

const waveStops: Record<WaveVariant, [string, string]> = {
  A: ["rgba(199,164,106,0.35)", "rgba(15,91,91,0.35)"],
  B: ["rgba(15,91,91,0.30)", "rgba(11,15,20,0.25)"],
  C: ["rgba(231,222,211,1)", "rgba(250,247,242,1)"],
};

export function WaveDivider({ variant = "A", flipped = false, className }: WaveDividerProps) {
  const gradientId = useId().replace(/:/g, "");
  const [from, to] = waveStops[variant];

  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("block h-12 w-full sm:h-16", flipped && "rotate-180", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M0,32 C180,108 360,108 540,76 C720,44 900,-4 1080,6 C1260,16 1350,58 1440,84 L1440,120 L0,120 Z"
      />
    </svg>
  );
}
