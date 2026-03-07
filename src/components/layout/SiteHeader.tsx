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

import { ButtonLink } from "@/components/ui/Button";
import type { NavigationContent, SiteSettingsContent } from "@/lib/cms-defaults";
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

type SiteHeaderProps = {
  navigation: NavigationContent;
  siteSettings: SiteSettingsContent;
};

export function SiteHeader({ navigation, siteSettings }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const mobileShortcut = navigation.headerCtas[0];
  const mobileLinks = navigation.primaryNavigation;

  return (
    <header className="sticky top-0 z-[90] border-b border-ink/10 bg-ivory/95 lg:backdrop-blur-xl">
      <div className="hidden bg-ink text-ivory lg:block">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            {siteSettings.socialLinks.map((social) => (
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
            {navigation.headerTopLinks.map((link, index) => (
              <div key={`${link.href}-${index}`} className="flex items-center gap-4">
                {index > 0 ? (
                  <span aria-hidden className="text-ivory/40">
                    |
                  </span>
                ) : null}
                <Link
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className={index === 0 ? "text-gold hover:text-ivory" : "hover:text-gold"}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink sm:h-10 sm:w-10 lg:hidden"
          aria-label="Open navigation"
          aria-expanded={isOpen}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="mx-auto lg:mx-0" aria-label={`${siteSettings.siteName} Home`}>
          <Image
            src={siteSettings.logoUrl}
            alt={`${siteSettings.siteName} logo`}
            width={222}
            height={68}
            priority
            className="h-auto w-[140px] min-[400px]:w-[170px] sm:w-[220px]"
          />
        </Link>

        <div className="lg:hidden">
          {mobileShortcut ? (
            <Link
              href={mobileShortcut.href}
              target={mobileShortcut.external ? "_blank" : undefined}
              rel={mobileShortcut.external ? "noopener noreferrer" : undefined}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-gold/75 bg-gold px-3 py-1.5 text-[0.65rem] font-semibold tracking-[0.12em] text-ink uppercase transition-colors hover:bg-ink hover:text-ivory"
            >
              {mobileShortcut.label}
            </Link>
          ) : null}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {navigation.headerCtas.map((cta, index) => (
            <ButtonLink
              key={`${cta.href}-${index}`}
              href={cta.href}
              target={cta.external ? "_blank" : undefined}
              rel={cta.external ? "noopener noreferrer" : undefined}
              size="sm"
              variant={index === 0 ? "teal" : "primary"}
            >
              {cta.label}
            </ButtonLink>
          ))}
        </div>
      </div>

      <nav className="hidden border-t border-ink/10 bg-ivory lg:block" aria-label="Primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-center gap-6 py-4 text-[11px] font-semibold tracking-[0.15em] uppercase">
            {navigation.primaryNavigation.map((item) => (
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

        <nav className="mt-6" aria-label="Mobile">
          <ul className="space-y-2">
            {mobileLinks.map((item) => (
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

        <div className="mt-6 space-y-2">
          {navigation.headerCtas.map((cta, index) => (
            <ButtonLink
              key={`${cta.href}-${index}`}
              href={cta.href}
              target={cta.external ? "_blank" : undefined}
              rel={cta.external ? "noopener noreferrer" : undefined}
              variant={index === 0 ? "teal" : "primary"}
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              {cta.label}
            </ButtonLink>
          ))}
        </div>
      </div>
    </header>
  );
}
