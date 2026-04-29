"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, MoveUpRight, X } from "lucide-react";

import { HeaderCartButton } from "@/components/layout/HeaderCartButton";
import { HeaderProductSearch } from "@/components/layout/HeaderProductSearch";
import { primaryNavigation } from "@/data/navigation";
import type { NavItem } from "@/data/navigation";
import { siteSettings } from "@/data/site-settings";
import type { CollectionNavItem } from "@/lib/shopify/collection-nav";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  navItems?: NavItem[];
  collectionItems?: CollectionNavItem[];
};

const dropdownMedia: Record<string, { href: string; imageAlt: string; imageSrc: string }> = {
  Shop: {
    href: "/shop",
    imageAlt: "Tailored menswear fitting room",
    imageSrc: "/images/hero-suits-299.jpg",
  },
  Designers: {
    href: "/designers",
    imageAlt: "Canali designer tailoring campaign",
    imageSrc: "/images/remote/www.jasonbarbaro.com/assets/media/2020/02/canali-072319-080-500x500.jpg",
  },
  Formalwear: {
    href: "/suit-tuxedo-rentals",
    imageAlt: "Black tie formalwear and tuxedo styling",
    imageSrc: "/images/remote/www.jasonbarbaro.com/assets/media/2020/06/h_cta_tux.jpg",
  },
};

export function SiteHeader({ navItems = primaryNavigation }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const desktopNavItems = navItems.filter((item) => item.label !== "Cart");

  function matchesPath(href?: string) {
    if (!href) {
      return false;
    }

    if (href === "/shop") {
      return pathname === href || pathname.startsWith("/shop/");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function getDropdownLinks(item: NavItem) {
    const children = item.children ?? [];

    if (children.length === 0) {
      return [];
    }

    if (item.label === "Shop") {
      return [{ label: "All Products", href: item.href || "/shop" }, ...children];
    }

    if (item.label === "Designers") {
      return children;
    }

    if (!item.href || children.some((child) => child.href === item.href)) {
      return children;
    }

    return [{ label: `${item.label} Overview`, href: item.href }, ...children];
  }

  function isActive(item: NavItem) {
    return matchesPath(item.href) || (item.children ?? []).some((child) => matchesPath(child.href));
  }

  function renderDesktopNav(items: NavItem[]) {
    return items.map((item) => {
      const dropdownLinks = getDropdownLinks(item);
      const active = isActive(item);

      if (dropdownLinks.length > 0) {
        const media = dropdownMedia[item.label];

        return (
          <div key={item.href || item.label} className="group relative">
            <Link
              href={item.href || dropdownLinks[0]?.href || "/"}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 text-[12px] font-semibold tracking-[0.12em] text-smoke uppercase transition-colors hover:text-ink",
                active && "text-ink",
              )}
            >
              <span>{item.label}</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
            </Link>

            <div
              className={cn(
                "invisible pointer-events-none absolute top-full z-[130] pt-3 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100",
                item.label === "Shop"
                  ? "left-0 w-[min(44rem,calc(100vw-2rem))]"
                  : "left-1/2 w-[min(38rem,calc(100vw-2rem))] -translate-x-1/2",
              )}
            >
              <div className={cn("rounded-lg border border-ink/10 bg-white p-2 shadow-[0_26px_80px_-48px_rgba(14,23,38,0.55)]", media && "grid grid-cols-[13rem_minmax(0,1fr)] gap-2")}>
                {media ? (
                  <Link href={media.href} className="group/media relative min-h-[17rem] overflow-hidden rounded-md bg-stone">
                    <Image
                      src={media.imageSrc}
                      alt={media.imageAlt}
                      fill
                      sizes="13rem"
                      quality={92}
                      className="object-cover transition-transform duration-500 group-hover/media:scale-[1.03]"
                    />
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/18 via-transparent to-transparent" />
                  </Link>
                ) : null}

                <ul className={cn("grid max-h-[min(28rem,calc(100vh-8rem))] gap-1 overflow-y-auto p-1", dropdownLinks.length > 6 ? "grid-cols-2" : "grid-cols-1")}>
                  {dropdownLinks.map((child) => (
                    <li key={`${item.label}-${child.href}`}>
                      <Link
                        href={child.href}
                        target={child.external ? "_blank" : undefined}
                        rel={child.external ? "noopener noreferrer" : undefined}
                        className="flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-stone/70"
                      >
                        <span className="min-w-0 truncate">{child.label}</span>
                        {child.external ? <MoveUpRight className="mt-1 h-4 w-4 shrink-0 text-smoke" /> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      }

      return (
        <Link
          key={item.href || item.label}
          href={item.href || "/"}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          className={cn(
            "inline-flex h-10 items-center text-[12px] font-semibold tracking-[0.12em] text-smoke uppercase transition-colors hover:text-ink",
            active && "text-ink",
          )}
        >
          {item.label}
        </Link>
      );
    });
  }

  function renderMobileNav(items: NavItem[]) {
    return items.map((item) => {
      const dropdownLinks = getDropdownLinks(item);
      const active = isActive(item);

      if (dropdownLinks.length > 0) {
        return (
          <details key={item.href || item.label} className="group border-b border-ink/10">
            <summary
              className={cn(
                "flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-semibold tracking-[0.08em] text-ink uppercase [&::-webkit-details-marker]:hidden",
                active && "text-deep-teal",
              )}
            >
              {item.label}
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="space-y-1 pb-3">
              {dropdownLinks.map((child) => (
                <Link
                  key={`${item.label}-${child.href}`}
                  href={child.href}
                  target={child.external ? "_blank" : undefined}
                  rel={child.external ? "noopener noreferrer" : undefined}
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-11 items-center justify-between rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-stone/55"
                >
                  <span>{child.label}</span>
                  {child.external ? <MoveUpRight className="h-4 w-4 shrink-0 text-smoke" /> : null}
                </Link>
              ))}
            </div>
          </details>
        );
      }

      return (
      <Link
        key={item.href || item.label}
        href={item.href || "/"}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
        onClick={() => setIsOpen(false)}
        className={cn(
          "flex min-h-12 items-center justify-between border-b border-ink/10 text-sm font-semibold tracking-[0.08em] text-ink uppercase",
          active && "text-deep-teal",
        )}
      >
        {item.label}
      </Link>
      );
    });
  }

  return (
    <>
      <header className="sticky top-0 z-[96] border-b border-ink/10 bg-ivory/96 backdrop-blur-xl">
        <div className="mx-auto max-w-[84rem] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center gap-3 lg:min-h-[4.5rem]">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-ink/12 text-ink lg:hidden"
              aria-label="Open navigation"
              aria-expanded={isOpen}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="shrink-0" aria-label="J. Barbaro Clothiers Home">
              <Image
                src={siteSettings.logoUrl}
                alt={`${siteSettings.siteName} logo`}
                width={222}
                height={68}
                priority
                className="brand-logo h-auto w-[138px] sm:w-[168px] lg:w-[176px]"
              />
            </Link>

            <nav className="hidden items-center gap-5 lg:flex xl:gap-6" aria-label="Primary">
              {renderDesktopNav(desktopNavItems)}
            </nav>

            <div className="ml-auto hidden w-full max-w-[24rem] xl:block">
              <HeaderProductSearch />
            </div>

            <div className="ml-auto flex items-center gap-2 xl:ml-0">
              <div className="hidden w-[17rem] lg:block xl:hidden">
                <HeaderProductSearch />
              </div>
              <HeaderCartButton compact className="h-10 w-10 rounded-md bg-ivory" />
            </div>
          </div>

          <div className="pb-3 lg:hidden">
            <HeaderProductSearch />
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[140] bg-[#0b0f14]/45 transition-opacity duration-200 lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[150] h-dvh w-screen max-w-sm overflow-y-auto border-l border-ink/10 bg-ivory p-5 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-xl transition-transform duration-200 lg:hidden",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Mobile navigation panel"
      >
        <div className="flex items-center justify-between">
          <Image
            src={siteSettings.logoUrl}
            alt={`${siteSettings.siteName} logo`}
            width={222}
            height={68}
            className="brand-logo h-auto w-[150px]"
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/12 text-ink"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <HeaderProductSearch className="mt-6" onNavigate={() => setIsOpen(false)} />

        <nav className="mt-6" aria-label="Mobile primary">
          {renderMobileNav(navItems)}
        </nav>
      </aside>
    </>
  );
}
