"use client";

import { useEffect, useState } from "react";

import type { Location } from "@/types/site";
import { getCurrentOpenStatus } from "@/lib/hours";

type LocationOpenBadgeProps = {
  location: Location;
};

export function LocationOpenBadge({ location }: LocationOpenBadgeProps) {
  const [status, setStatus] = useState(() => getCurrentOpenStatus(location));

  useEffect(() => {
    const update = () => setStatus(getCurrentOpenStatus(location));
    update();
    const timer = setInterval(update, 60_000);

    return () => clearInterval(timer);
  }, [location]);

  return (
    <div className="space-y-1" aria-live="polite">
      <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase">
        <span className={`h-2.5 w-2.5 rounded-full ${status.isOpen ? "bg-deep-teal" : "bg-smoke"}`} aria-hidden />
        <span className={status.isOpen ? "text-deep-teal" : "text-smoke"}>
          {status.isOpen ? "Open now" : "Closed now"}
        </span>
      </p>
      <p className="text-xs text-smoke">· {status.label}</p>
    </div>
  );
}
