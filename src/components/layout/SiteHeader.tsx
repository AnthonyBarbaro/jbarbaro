"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Instagram,
  Linkedin,
  Menu,
  MoveUpRight,
  PinIcon,
  X,
  XIcon,
} from "lucide-react";
import { useState } from "react";

import { HeaderProductSearch } from "@/components/layout/HeaderProductSearch";
import { headerTopLinks, primaryNavigation } from "@/data/navigation";
import { siteSettings } from "@/data/site-settings";
import { socialLinks } from "@/data/social";
import { cn } from "@/lib/utils";

function iconForSocial(label: string) {
  const commonClasses = "h-3.5 w-3.5";

  switch (label.toLowerCase()) {
    case "facebook":
      return <Facebook className={commonClasses} aria-hidden />;
    case "x":
      return <XIcon className={commonClasses} aria-hidden />;
    case "linkedin":
      return <Linkedin className={commonClasses} aria-hidden />;
    case "pinterest":
      return <PinIcon className={commonClasses} aria-hidden />;
    case "instagram":
      return <Instagram className={commonClasses} aria-hidden />;
    default:
      return null;
  }
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[90] border-b border-ink/10 bg-ivory/95 lg:backdrop-blur-xl">
      <div className="hidden bg-ink text-ivory lg:block">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <Link
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ivory/20 text-ivory transition-colors hover:border-gold hover:text-gold"
                aria-label={social.label}
              >
                {iconForSocial(social.label)}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium tracking-[0.18em] uppercase">
            {headerTopLinks.map((item, index) => (
              <div key={item.href} className="flex items-center gap-4">
                {index > 0 ? (
                  <span aria-hidden className="text-ivory/40">
                    |
                  </span>
                ) : null}
                <Link href={item.href} className={index === 0 ? "text-gold hover:text-ivory" : "hover:text-gold"}>
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink sm:h-10 sm:w-10 lg:hidden"
          aria-label="Open navigation"
          aria-expanded={isOpen}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="mx-auto lg:mx-0" aria-label="J. Barbaro Clothiers Home">
          <Image
            src={siteSettings.logoUrl}
            alt={`${siteSettings.siteName} logo`}
            width={222}
            height={68}
            priority
            className="h-auto w-[140px] min-[400px]:w-[170px] sm:w-[220px]"
          />
        </Link>

        <div aria-hidden className="h-9 w-9 shrink-0 sm:h-10 sm:w-10 lg:hidden" />

        <div className="hidden min-w-0 flex-1 justify-end pl-6 lg:flex">
          <div className="w-full max-w-md">
            <HeaderProductSearch />
          </div>
        </div>
      </div>

      <nav className="hidden border-t border-ink/10 bg-ivory lg:block" aria-label="Primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-center gap-6 py-4 text-[11px] font-semibold tracking-[0.15em] uppercase">
            {primaryNavigation.map((item) => (
              <li key={item.label} className="group relative">
                {item.children ? (
                  <>
                    <Link
                      href={item.href || item.children[0]?.href || "/"}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className={cn(
                        "inline-flex items-center gap-1 text-ink transition-colors hover:text-deep-teal",
                        (pathname === item.href || item.children.some((child) => pathname === child.href)) && "text-deep-teal",
                      )}
                    >
                      {item.label}
                      {item.external ? <MoveUpRight className="h-3.5 w-3.5" /> : null}
                    </Link>
                    <div className="invisible absolute top-full left-1/2 mt-4 w-[300px] -translate-x-1/2 rounded-2xl border border-ink/10 bg-ivory p-3 opacity-0 shadow-xl transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      <ul className="space-y-1.5">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              target={child.external ? "_blank" : undefined}
                              rel={child.external ? "noopener noreferrer" : undefined}
                              className={cn(
                                "flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-medium tracking-[0.1em] text-ink uppercase transition-all hover:bg-stone hover:text-deep-teal",
                                pathname === child.href && "bg-stone text-deep-teal",
                              )}
                            >
                              <span>{child.label}</span>
                              {child.external ? <MoveUpRight className="h-3.5 w-3.5" /> : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href || "/"}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1 text-ink transition-colors hover:text-deep-teal",
                      pathname === item.href && "text-deep-teal",
                    )}
                  >
                    {item.label}
                    {item.external ? <MoveUpRight className="h-3.5 w-3.5" /> : null}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div
        className={cn(
          "fixed inset-0 z-[140] bg-ink/55 transition-opacity duration-300 lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[150] h-dvh w-screen overflow-y-auto bg-ivory p-5 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-2xl transition-transform duration-300 lg:hidden sm:max-w-md",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Mobile navigation panel"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-[0.18em] text-ink/70 uppercase">Menu</p>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/20"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <HeaderProductSearch className="mt-6" onNavigate={() => setIsOpen(false)} />

        <nav className="mt-6" aria-label="Mobile">
          <ul className="space-y-2">
            {primaryNavigation.map((item) => (
              <li key={item.label} className="rounded-2xl border border-ink/10 bg-stone/50">
                {item.children ? (
                  <details>
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold tracking-[0.08em] text-ink uppercase">
                      {item.label}
                    </summary>
                    {item.href ? (
                      <div className="px-2">
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold tracking-[0.08em] text-deep-teal uppercase hover:bg-ivory"
                        >
                          View {item.label}
                        </Link>
                      </div>
                    ) : null}
                    <ul className="space-y-1 border-t border-ink/10 p-2">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            target={child.external ? "_blank" : undefined}
                            rel={child.external ? "noopener noreferrer" : undefined}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-ink/85 hover:bg-ivory"
                          >
                            {child.label}
                            {child.external ? <MoveUpRight className="h-4 w-4" /> : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link
                    href={item.href || "/"}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-sm font-semibold tracking-[0.08em] text-ink uppercase"
                  >
                    {item.label}
                    {item.external ? <MoveUpRight className="h-4 w-4" /> : null}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
