import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

const baseInputClass =
  "mt-1 w-full rounded-2xl border border-ink/20 bg-ivory px-4 py-3 text-base text-ink outline-none transition-all placeholder:text-smoke/80 focus:border-deep-teal focus:ring-4 focus:ring-deep-teal/15 sm:py-2.5 sm:text-sm";

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-ink/90">
      {children}
    </label>
  );
}

export function Input(props: ComponentPropsWithoutRef<"input">) {
  const { className, ...rest } = props;
  return <input className={cn(baseInputClass, className)} {...rest} />;
}

export function Select(props: ComponentPropsWithoutRef<"select">) {
  const { className, ...rest } = props;
  return <select className={cn(baseInputClass, className)} {...rest} />;
}

export function Textarea(props: ComponentPropsWithoutRef<"textarea">) {
  const { className, ...rest } = props;
  return <textarea className={cn(baseInputClass, "py-3", className)} {...rest} />;
}
