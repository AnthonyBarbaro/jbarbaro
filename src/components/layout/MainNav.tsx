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
  Shop:
    "Move straight into the online floor with the collections clients browse most, from suiting and shirts to shoes and finishing details.",
  Accessories:
    "Explore the details that complete the look, then cross-shop the categories that pair naturally with belts, ties, shoes, and occasion dressing.",
};

const dropdownMedia: Record<string, NavDropdownMedia> = {
  Shop: {
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
    ctaHref: "/categories/accessories",
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

    if (!media || !description || collectionItems.length === 0) {
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
          <p className="text-[11px] font-semibold tracking-[0.18em] text-smoke uppercase">Shop & Visit</p>
          <ul className="mt-3 space-y-2">
            {primaryItems.map((item) => (
              <li
                key={item.label}
                className={cn(
                  "overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white",
                  item.label === "Shop" && "border-gold/45 bg-gold/10",
                )}
              >
                {item.children?.length && item.label !== "Shop" ? (
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
                      item.label === "Shop" ? "text-deep-teal" : "text-ink",
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
                      emphasized={item.label === "Shop"}
                      external={item.external}
                      href={item.href || "/"}
                      label={item.label}
                      tier="primary"
                    >
                      {item.label === "Shop" ? getDesktopDropdown(item.label, index === 0 ? "left" : "center") : null}
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
