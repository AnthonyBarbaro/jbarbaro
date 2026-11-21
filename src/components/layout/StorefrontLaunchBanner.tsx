"use client";

import Link from "next/link";

import { useStorefrontLaunchCountdown } from "@/components/layout/useStorefrontLaunch";
import { STOREFRONT_LAUNCH_AT, STOREFRONT_LAUNCH_DATE } from "@/lib/storefront-launch";

const countdownUnits = [
  { label: "Days", seconds: 86400, cycle: null },
  { label: "Hours", seconds: 3600, cycle: 24 },
  { label: "Minutes", seconds: 60, cycle: 60 },
  { label: "Seconds", seconds: 1, cycle: 60 },
] as const;

export function StorefrontLaunchBanner() {
  const secondsUntilLaunch = useStorefrontLaunchCountdown();

  if (!secondsUntilLaunch) {
    return (
      <aside className="bg-ink text-white" aria-label="Store promotion">
        <div className="mx-auto flex max-w-[84rem] items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium tracking-[0.08em]">
          <span className="hidden sm:inline">
            Free shipping on $999+ orders. Eligible shipping rates up to $25.
          </span>
          <span className="sm:hidden">Free shipping on $999+. Rates up to $25.</span>
          <Link
            href="/shop"
            className="shrink-0 font-semibold text-gold underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Shop Now
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="border-b border-gold/45 bg-ink text-white"
      aria-label="Black Friday online launch"
    >
      <div className="mx-auto flex max-w-[84rem] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-3 text-center sm:py-3.5">
        <div className="sm:text-left">
          <p className="font-heading text-2xl leading-tight text-gold">
            Black Friday Online Launch
          </p>
          <p className="mt-0.5 text-xs leading-5 text-white/84 sm:text-sm">
            Checkout opens <time dateTime={STOREFRONT_LAUNCH_AT}>{STOREFRONT_LAUNCH_DATE}</time>
          </p>
        </div>
        <div
          role="timer"
          aria-label="Time until checkout opens"
          className="storefront-launch-countdown grid w-full max-w-[22rem] grid-cols-4 gap-px overflow-hidden rounded-md border border-gold/45 bg-gold/30 sm:w-72"
        >
          {countdownUnits.map(({ label, seconds, cycle }) => {
            const total = Math.floor(secondsUntilLaunch / seconds);
            const amount = cycle ? total % cycle : total;
            return (
              <div key={label} className="min-w-0 bg-ink px-1 py-1.5 text-white">
                <p className="text-base leading-tight font-semibold text-white tabular-nums sm:text-lg">
                  {String(amount).padStart(2, "0")}
                </p>
                <p className="text-[0.625rem] tracking-[0.08em] text-white/80 uppercase">{label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
