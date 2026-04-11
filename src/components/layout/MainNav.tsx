"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoveUpRight } from "lucide-react";

import { NavDropdown, type NavDropdownLink, type NavDropdownMedia } from "@/components/layout/NavDropdown";
import { NavItem } from "@/components/layout/NavItem";
import type { NavItem as PrimaryNavItem } from "@/data/navigation";
import type { CollectionNavItem } from "@/lib/shopify/collection-nav";
import { cn } from "@/lib/utils";

type MainNavProps = {
  collectionItems: CollectionNavItem[];
  mobile?: boolean;
  onNavigate?: () => void;
  primaryItems: PrimaryNavItem[];
};

const dropdownDescriptions: Record<string, string> = {
  "Shop All":
    "Move straight into the online floor with the collections clients browse most, from suiting and shirts to shoes and finishing details.",
  Accessories:
    "Explore the details that complete the look, then cross-shop the categories that pair naturally with belts, ties, shoes, and occasion dressing.",
};

const dropdownMedia: Record<string, NavDropdownMedia> = {
  "Shop All": {
    eyebrow: "Spring Collection",
    title: "Premium Tailoring",
    description: "Designed to feel like the front door to the online store, with the strongest categories ready to browse immediately.",
    imageSrc: "/images/remote/www.jasonbarbaro.com/assets/media/2020/06/h3_lg.jpg",
    imageAlt: "Luxury tailored menswear campaign image",
    ctaLabel: "Shop All Products",
    ctaHref: "/shop",
  },
  Accessories: {
    eyebrow: "Finishing Details",
    title: "Luxury Essentials",
    description: "Belts, ties, shoes, and wardrobe details that sharpen the final look without overwhelming the outfit.",
    imageSrc: "/images/remote/www.jasonbarbaro.com/assets/media/2020/02/tateossian-111716-278-500x500.jpg",
    imageAlt: "Luxury menswear accessories presentation",
    ctaLabel: "Browse Accessories",
    ctaHref: "/for-men/accessories",
  },
};

export function MainNav({ collectionItems, mobile = false, onNavigate, primaryItems }: MainNavProps) {
  const pathname = usePathname();

  function matchesPath(href?: string) {
    if (!href) {
      return false;
    }

    if (href === "/") {
      return pathname === href;
    }

    if (href === "/shop") {
      return pathname === href || pathname.startsWith("/shop/");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function getDropdownLinks(label: string): NavDropdownLink[] {
    if (label === "Accessories") {
      return collectionItems
        .filter((item) => item.label !== "Accessories")
        .slice(0, 4)
        .map((item) => ({
          label: item.label,
          href: item.href,
          description: item.description,
        }));
    }

    return collectionItems.map((item) => ({
      label: item.label,
      href: item.href,
      description: item.description,
    }));
  }

  function getDesktopDropdown(label: string, align: "left" | "center" | "right") {
    const media = dropdownMedia[label];
    const description = dropdownDescriptions[label];

    if (!media || !description) {
      return null;
    }

    return (
      <NavDropdown
        align={align}
        description={description}
        links={getDropdownLinks(label)}
        media={{
          ...media,
          ctaHref: label === "Accessories" ? collectionItems.find((item) => item.label === label)?.href || media.ctaHref : media.ctaHref,
        }}
        title={label}
      />
    );
  }

  if (mobile) {
    return (
      <div className="mt-6 space-y-6">
        <section>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-smoke uppercase">Browse</p>
          <ul className="mt-3 space-y-2">
            {primaryItems.map((item) => (
              <li
                key={item.label}
                className={cn(
                  "overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white",
                  item.label === "Shop All" && "border-gold/45 bg-gold/10",
                )}
              >
                {item.children?.length && item.label !== "Shop All" ? (
                  <details>
                    <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold tracking-[0.08em] text-ink uppercase">
                      {item.label}
                    </summary>
                    <ul className="space-y-1 border-t border-ink/10 bg-[#fcfbf8] p-2">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            target={child.external ? "_blank" : undefined}
                            rel={child.external ? "noopener noreferrer" : undefined}
                            onClick={onNavigate}
                            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-ink/85 transition-colors hover:bg-white"
                          >
                            <span>{child.label}</span>
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
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 text-sm font-semibold tracking-[0.08em] uppercase transition-colors",
                      item.label === "Shop All" ? "text-deep-teal" : "text-ink",
                    )}
                  >
                    {item.label}
                    {item.external ? <MoveUpRight className="h-4 w-4" /> : null}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[1.75rem] border border-ink/10 bg-white p-4 shadow-[0_20px_44px_-34px_rgba(14,23,38,0.18)]">
          <details open>
            <summary className="cursor-pointer list-none text-[11px] font-semibold tracking-[0.18em] text-smoke uppercase">
              Shop Categories
            </summary>

            <ul className="mt-4 space-y-2">
              {collectionItems.map((item) => (
                <li key={item.href} className="overflow-hidden rounded-[1.35rem] border border-ink/8 bg-[#fcfbf8]">
                  {item.label === "Accessories" ? (
                    <details>
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold tracking-[0.08em] text-ink uppercase">
                        {item.label}
                      </summary>
                      <div className="border-t border-ink/10 bg-white px-4 py-4">
                        <p className="text-sm leading-6 text-smoke">{item.description}</p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {getDropdownLinks("Accessories").map((link) => (
                            <Link
                              key={`${link.href}-${link.label}`}
                              href={link.href}
                              onClick={onNavigate}
                              className="rounded-xl border border-ink/10 bg-[#fcfbf8] px-3 py-3 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-gold/35"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-deep-teal uppercase"
                        >
                          Browse Accessories
                          <MoveUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </details>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 text-sm font-semibold tracking-[0.08em] text-ink uppercase transition-colors hover:bg-white",
                        matchesPath(item.href) && "text-deep-teal",
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </details>
        </section>
      </div>
    );
  }

  return (
    <div className="hidden lg:block">
      <nav className="border-t border-ink/8 bg-ivory/92" aria-label="Primary">
        <div className="mx-auto max-w-[84rem] px-4 sm:px-6 lg:px-8">
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max justify-center">
              <ul className="flex h-12 items-center gap-7 px-6 text-center xl:gap-8">
                {primaryItems.map((item, index) => (
                  <li key={item.label}>
                    <NavItem
                      active={matchesPath(item.href)}
                      emphasized={item.label === "Shop All"}
                      external={item.external}
                      href={item.href || "/"}
                      label={item.label}
                      tier="primary"
                    >
                      {item.label === "Shop All" ? getDesktopDropdown(item.label, index === 0 ? "left" : "center") : null}
                    </NavItem>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <nav className="border-t border-ink/8 bg-ivory/92" aria-label="Shop categories">
        <div className="mx-auto max-w-[84rem] px-4 sm:px-6 lg:px-8">
          <div className="relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="pointer-events-none absolute inset-y-0 left-4 z-[1] hidden w-10 bg-gradient-to-r from-ivory via-ivory/95 to-transparent xl:block" />
            <div className="pointer-events-none absolute inset-y-0 right-4 z-[1] hidden w-10 bg-gradient-to-l from-ivory via-ivory/95 to-transparent xl:block" />
            <div className="flex min-w-max justify-center">
              <ul className="flex h-12 items-center gap-7 px-6 xl:gap-8">
                {collectionItems.map((item, index) => (
                  <li key={item.href}>
                    <NavItem active={matchesPath(item.href)} href={item.href} label={item.label} tier="secondary">
                      {item.label === "Accessories" ? getDesktopDropdown(item.label, index === 0 ? "left" : "center") : null}
                    </NavItem>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
