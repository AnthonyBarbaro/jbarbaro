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
    "bg-gold text-ink border border-gold hover:bg-ink hover:border-ink hover:text-ivory focus-visible:ring-gold/45",
  secondary:
    "bg-transparent text-ink border border-ink/65 hover:border-gold hover:text-gold focus-visible:ring-gold/40",
  teal: "bg-deep-teal text-ivory border border-deep-teal hover:bg-gold hover:border-gold hover:text-ink focus-visible:ring-deep-teal/40",
  ghost:
    "bg-transparent text-ink border border-transparent hover:border-ink/20 hover:bg-stone/55 focus-visible:ring-gold/30",
};

const commonClassName =
  "inline-flex items-center justify-center rounded-full text-center font-semibold leading-tight whitespace-normal uppercase transition-all duration-300 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60";

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
