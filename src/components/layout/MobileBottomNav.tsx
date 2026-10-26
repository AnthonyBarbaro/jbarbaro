"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, Store, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";

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
}): ReactElement {
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
      <span className="min-w-0 max-w-full text-center leading-snug [overflow-wrap:anywhere]">
        {label}
      </span>
    </Link>
  );
}

function MobileBottomNavForPath({ pathname }: { pathname: string }): ReactElement | null {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const isCheckout = pathname === "/checkout" || pathname.startsWith("/checkout/");

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const root = document.documentElement;
    const updateNavigationHeight = (): void => {
      root.style.setProperty("--mobile-nav-height", `${nav.getBoundingClientRect().height}px`);
    };
    updateNavigationHeight();
    const observer = new ResizeObserver(updateNavigationHeight);
    observer.observe(nav);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--mobile-nav-height");
    };
  }, [isCheckout]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const trigger = searchButtonRef.current;
    const dialog = dialogRef.current;
    const desktop = window.matchMedia("(min-width: 1024px)");
    document.body.style.overflow = "hidden";

    function focusableElements(): HTMLElement[] {
      return Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "a[href], button, input, select, textarea, [tabindex]",
        ) ?? [],
      ).filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.matches(":disabled") &&
          !element.closest("[inert]") &&
          element.getClientRects().length > 0 &&
          window.getComputedStyle(element).visibility !== "hidden",
      );
    }

    const focusFrame = window.requestAnimationFrame(() => {
      dialog?.querySelector<HTMLInputElement>('input[type="search"]')?.focus({
        preventScroll: true,
      });
    });

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsSearchOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const elements = focusableElements();
      const first = elements[0];
      const last = elements.at(-1);

      if (!first || !last) {
        event.preventDefault();
        dialog?.focus({ preventScroll: true });
      } else if (!dialog?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    function keepFocusInside(event: FocusEvent): void {
      if (event.target instanceof Node && !dialog?.contains(event.target)) {
        (focusableElements()[0] ?? dialog)?.focus({ preventScroll: true });
      }
    }

    function closeForDesktop(event: MediaQueryListEvent): void {
      if (event.matches) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("focusin", keepFocusInside);
    window.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", closeForDesktop);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("focusin", keepFocusInside);
      window.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", closeForDesktop);
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected && trigger.getClientRects().length > 0) {
        trigger.focus({ preventScroll: true });
      }
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
        ref={navRef}
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[95] grid grid-cols-5 border-t border-ink/10 px-1 shadow-[0_-10px_30px_-24px_rgba(11,15,20,0.45)] lg:hidden"
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
          ref={searchButtonRef}
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold text-ink/65 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-deep-teal",
            isSearchOpen && "text-deep-teal",
          )}
          aria-haspopup="dialog"
          aria-expanded={isSearchOpen}
          aria-controls="mobile-product-search"
        >
          <Search className="h-[18px] w-[18px]" aria-hidden />
          <span className="min-w-0 max-w-full text-center leading-snug [overflow-wrap:anywhere]">
            Search
          </span>
        </button>
        <HeaderWishlistButton mobileNav active={wishlistActive} />
        <HeaderCartButton mobileNav active={cartActive} />
      </nav>

      {isSearchOpen ? (
        <div
          ref={dialogRef}
          id="mobile-product-search"
          className="mobile-search-backdrop fixed inset-0 z-[180] flex items-start justify-center bg-ink/38 px-4 pt-[max(5.5rem,calc(env(safe-area-inset-top)+4rem))] pb-[max(5rem,env(safe-area-inset-bottom))] backdrop-blur-[10px] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
          tabIndex={-1}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              event.preventDefault();
              setIsSearchOpen(false);
            }
          }}
        >
          <div className="mobile-search-panel relative w-full max-w-[32rem] rounded-xl border border-white/50 bg-white p-3 shadow-[0_28px_90px_-28px_rgba(0,0,0,0.58)]">
            <button
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

export function MobileBottomNav(): ReactElement {
  const pathname = usePathname();

  return <MobileBottomNavForPath key={pathname} pathname={pathname} />;
}
