"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Facebook, Instagram, Linkedin, Menu, PinIcon, X, XIcon } from "lucide-react";

import { HeaderCartButton } from "@/components/layout/HeaderCartButton";
import { HeaderProductSearch } from "@/components/layout/HeaderProductSearch";
import { MainNav } from "@/components/layout/MainNav";
import { headerCtas, headerTopLinks, primaryNavigation } from "@/data/navigation";
import type { NavItem } from "@/data/navigation";
import { siteSettings } from "@/data/site-settings";
import type { CollectionNavItem } from "@/lib/shopify/collection-nav";
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

type SiteHeaderProps = {
  navItems?: NavItem[];
  collectionItems?: CollectionNavItem[];
};

export function SiteHeader({ navItems = primaryNavigation, collectionItems = [] }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const primaryCta = headerCtas[0];

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function matchesPath(href?: string) {
    if (!href) {
      return false;
    }

    if (href === "/") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <div className="hidden border-b border-ink/8 bg-ink text-ivory lg:block">
        <div className="mx-auto flex h-10 max-w-[84rem] items-center justify-between px-4 sm:px-6 lg:px-8">
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
                <Link href={item.href} className={cn("transition-colors hover:text-gold", matchesPath(item.href) && "text-gold")}>
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-[96] border-b border-ink/10 bg-ivory/95 backdrop-blur-xl transition-shadow duration-200",
          isScrolled ? "shadow-[0_18px_34px_-30px_rgba(14,23,38,0.24)]" : "shadow-none",
        )}
      >
        <div className="mx-auto max-w-[84rem] px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <div className="grid h-16 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3 sm:h-[4.5rem] sm:grid-cols-[2.75rem_1fr_2.75rem]">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 text-ink"
                aria-label="Open navigation"
                aria-expanded={isOpen}
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link href="/" className="flex justify-center" aria-label="J. Barbaro Clothiers Home">
                <Image
                  src={siteSettings.logoUrl}
                  alt={`${siteSettings.siteName} logo`}
                  width={222}
                  height={68}
                  priority
                  className="h-auto w-[148px] min-[400px]:w-[176px] sm:w-[188px]"
                />
              </Link>

              <div className="flex justify-end">
                <HeaderCartButton compact />
              </div>
            </div>

            <div className="pb-4">
              <HeaderProductSearch />
            </div>
          </div>

          <div className="hidden lg:flex lg:h-[5rem] lg:items-center lg:justify-between lg:gap-8">
            <Link href="/" className="shrink-0" aria-label="J. Barbaro Clothiers Home">
              <Image
                src={siteSettings.logoUrl}
                alt={`${siteSettings.siteName} logo`}
                width={222}
                height={68}
                priority
                className="h-auto w-[190px] xl:w-[208px]"
              />
            </Link>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 xl:gap-3">
              <div className="w-full max-w-[24rem] xl:max-w-[30rem]">
                <HeaderProductSearch />
              </div>
              {primaryCta ? (
                <ButtonLink href={primaryCta.href} size="sm" variant="primary" className="shrink-0">
                  {primaryCta.label}
                </ButtonLink>
              ) : null}
              <HeaderCartButton compact className="h-10 w-10 shrink-0 border-ink/14 bg-white hover:bg-stone/55" />
            </div>
          </div>
        </div>

        <MainNav primaryItems={navItems} collectionItems={collectionItems} />
      </header>

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
          <p className="text-xs font-semibold tracking-[0.18em] text-ink/70 uppercase">Navigation</p>
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

        {primaryCta ? (
          <div className="mt-4">
            <ButtonLink href={primaryCta.href} onClick={() => setIsOpen(false)} size="sm" className="w-full">
              {primaryCta.label}
            </ButtonLink>
          </div>
        ) : null}

        <MainNav
          mobile
          primaryItems={navItems}
          collectionItems={collectionItems}
          onNavigate={() => setIsOpen(false)}
        />

        <div className="mt-6 border-t border-ink/10 pt-6">
          <div className="grid grid-cols-3 gap-2">
            {headerTopLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-2xl border border-ink/10 bg-white px-3 py-3 text-center text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-gold/35"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
