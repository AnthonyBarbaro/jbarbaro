import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "teal" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type SharedProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonProps = SharedProps & ComponentPropsWithoutRef<"button">;

type ButtonLinkProps = SharedProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
    href: string;
  };

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-[0.7rem] tracking-[0.14em]",
  md: "min-h-11 px-5 py-2.5 text-xs tracking-[0.16em]",
  lg: "min-h-12 px-6 py-3 text-sm tracking-[0.16em]",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-gold bg-gold text-ink shadow-[0_20px_36px_-24px_rgba(11,15,20,0.58)] hover:-translate-y-0.5 hover:border-[#d4b37d] hover:bg-[#d4b37d] focus-visible:ring-gold/45",
  secondary:
    "border border-ink/50 bg-transparent text-ink hover:-translate-y-0.5 hover:border-ink hover:bg-ink/[0.04] focus-visible:ring-gold/40",
  teal: "border border-deep-teal bg-deep-teal text-ivory shadow-[0_20px_36px_-24px_rgba(15,91,91,0.55)] hover:-translate-y-0.5 hover:border-[#136868] hover:bg-[#136868] focus-visible:ring-deep-teal/40",
  ghost:
    "border border-transparent bg-transparent text-ink hover:border-ink/20 hover:bg-stone/55 focus-visible:ring-gold/30",
};

const commonClassName =
  "inline-flex items-center justify-center gap-2 rounded-full text-center font-semibold leading-tight whitespace-normal uppercase transition-all duration-300 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60";

export function Button({ className, children, variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(commonClassName, sizeClasses[size], variantClasses[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({ className, children, variant = "primary", size = "md", ...props }: ButtonLinkProps) {
  return (
    <Link className={cn(commonClassName, sizeClasses[size], variantClasses[variant], className)} {...props}>
      {children}
    </Link>
  );
}
