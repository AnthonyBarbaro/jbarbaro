"use client";

import Link from "next/link";
import { MoveUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type NavItemProps = {
  active?: boolean;
  children?: ReactNode;
  emphasized?: boolean;
  external?: boolean;
  href: string;
  label: string;
  tier?: "primary" | "secondary";
};

export function NavItem({
  active = false,
  children,
  emphasized = false,
  external = false,
  href,
  label,
  tier = "primary",
}: NavItemProps) {
  const baseClasses =
    tier === "primary"
      ? "inline-flex items-center gap-1 border-b-2 border-transparent pb-1 text-[10.5px] font-semibold tracking-[0.16em] uppercase transition-colors duration-200"
      : "inline-flex items-center gap-1 border-b-2 border-transparent py-1.5 text-[10.5px] font-semibold tracking-[0.16em] uppercase transition-colors duration-200";

  return (
    <div className="group relative">
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={cn(
          baseClasses,
          emphasized
            ? "text-gold hover:border-gold/60 hover:text-gold"
            : "text-ink hover:border-gold/35 hover:text-deep-teal",
          active && (emphasized ? "border-gold text-gold" : "border-gold/60 text-deep-teal"),
        )}
      >
        {label}
        {external ? <MoveUpRight className="h-3.5 w-3.5" /> : null}
      </Link>
      {children}
    </div>
  );
}
