"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, Store, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { HeaderCartButton } from "@/components/layout/HeaderCartButton";
import { HeaderProductSearch } from "@/components/layout/HeaderProductSearch";
import { HeaderWishlistButton } from "@/components/layout/HeaderWishlistButton";
import { cn } from "@/lib/utils";

function MobileNavLink({
  active,
  href,
  icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold text-ink/65 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-deep-teal",
        active && "text-deep-teal",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isCheckout = pathname === "/checkout" || pathname.startsWith("/checkout/");

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSearchOpen]);

  if (isCheckout) {
    return null;
  }

  const homeActive = pathname === "/";
  const shopActive = pathname === "/shop" || pathname.startsWith("/shop/");
  const wishlistActive = pathname === "/wishlist" || pathname.startsWith("/wishlist/");
  const cartActive = pathname === "/cart" || pathname.startsWith("/cart/");

  return (
    <>
      <nav
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[95] grid grid-cols-5 border-t border-ink/10 bg-white/98 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-24px_rgba(11,15,20,0.45)] backdrop-blur-md lg:hidden"
        aria-label="Mobile shopping navigation"
      >
        <MobileNavLink
          href="/"
          label="Home"
          active={homeActive}
          icon={<House className="h-[18px] w-[18px]" aria-hidden />}
        />
        <MobileNavLink
          href="/shop"
          label="Shop"
          active={shopActive}
          icon={<Store className="h-[18px] w-[18px]" aria-hidden />}
        />
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold text-ink/65 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-deep-teal",
            isSearchOpen && "text-deep-teal",
          )}
          aria-haspopup="dialog"
          aria-expanded={isSearchOpen}
        >
          <Search className="h-[18px] w-[18px]" aria-hidden />
          <span>Search</span>
        </button>
        <HeaderWishlistButton mobileNav active={wishlistActive} />
        <HeaderCartButton mobileNav active={cartActive} />
      </nav>

      {isSearchOpen ? (
        <div
          className="mobile-search-backdrop fixed inset-0 z-[180] flex items-start justify-center bg-ink/38 px-4 pt-[max(5.5rem,calc(env(safe-area-inset-top)+4rem))] pb-[max(5rem,env(safe-area-inset-bottom))] backdrop-blur-[10px] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsSearchOpen(false);
            }
          }}
        >
          <div className="mobile-search-panel relative w-full max-w-[32rem] rounded-xl border border-white/50 bg-white p-3 shadow-[0_28px_90px_-28px_rgba(0,0,0,0.58)]">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="absolute -top-14 right-0 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/45 bg-ink/75 text-white backdrop-blur-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              aria-label="Close search"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <p className="mb-3 px-1 font-heading text-2xl text-ink">What are you looking for?</p>
            <HeaderProductSearch
              autoFocus
              resultsClassName="max-h-[min(24rem,48dvh)]"
              onNavigate={() => setIsSearchOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
