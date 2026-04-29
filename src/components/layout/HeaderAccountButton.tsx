"use client";

import Link from "next/link";
import { CircleUserRound } from "lucide-react";

import { cn } from "@/lib/utils";

type HeaderAccountButtonProps = {
  className?: string;
  compact?: boolean;
  onNavigate?: () => void;
};

export function HeaderAccountButton({
  className,
  compact = false,
  onNavigate,
}: HeaderAccountButtonProps) {
  if (compact) {
    return (
      <Link
        href="/account"
        onClick={onNavigate}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/12 text-ink transition-colors duration-200 hover:border-ink/25 sm:h-10 sm:w-10",
          className,
        )}
        aria-label="Open customer account"
      >
        <CircleUserRound className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      onClick={onNavigate}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-ink/18 bg-ivory px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors duration-200 hover:border-ink/30",
        className,
      )}
    >
      <CircleUserRound className="h-4 w-4" />
      <span>Account</span>
    </Link>
  );
}
