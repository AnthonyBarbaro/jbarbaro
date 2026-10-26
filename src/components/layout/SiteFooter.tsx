import Link from "next/link";
import type { ReactElement } from "react";
import { Facebook, Instagram, Linkedin, PinIcon, XIcon } from "lucide-react";

import { footerShoppingLinks, footerUtilityLinks } from "@/data/navigation";
import { locations } from "@/data/locations";
import { socialLinks } from "@/data/social";
import { ButtonLink } from "@/components/ui/Button";
import { AccessibilityNavButton } from "@/components/ui/AccessibilityNavButton";
import { LEGAL_OWNER } from "@/lib/constants";
import { formatPhone } from "@/lib/utils";

function socialIcon(label: string): ReactElement | null {
  const classes = "h-4 w-4";

  switch (label.toLowerCase()) {
    case "facebook":
      return <Facebook className={classes} aria-hidden />;
    case "x":
      return <XIcon className={classes} aria-hidden />;
    case "linkedin":
      return <Linkedin className={classes} aria-hidden />;
    case "pinterest":
      return <PinIcon className={classes} aria-hidden />;
    case "instagram":
      return <Instagram className={classes} aria-hidden />;
    default:
      return null;
  }
}

export function SiteFooter(): ReactElement {
  return (
    <footer className="mt-16 bg-[#0b0f14] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)] lg:px-8 lg:py-14">
        <section>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
            J. Barbaro Clothiers
          </p>
          <h2 className="mt-4 font-heading text-3xl sm:text-4xl">
            Luxury Menswear, Tailored Locally.
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/shop" size="sm">
              Shop Now
            </ButtonLink>
            <ButtonLink
              href="/schedule-appointment"
              variant="secondary"
              size="sm"
              className="border-white/45 bg-transparent text-white hover:border-gold hover:bg-transparent hover:text-gold"
            >
              Book Appointment
            </ButtonLink>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {socialLinks.map((social) => (
              <Link
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/25 text-white transition-colors hover:border-gold hover:text-gold"
                aria-label={social.label}
              >
                {socialIcon(social.label)}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">Shop & Visit</h2>
          <ul className="mt-5 space-y-2.5 text-sm text-white/80">
            {footerShoppingLinks.map((item, index) => (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  className={index === 0 ? "text-gold hover:text-white" : "hover:text-gold"}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">Visit Us</h2>
          <div className="mt-5 space-y-4">
            {locations.map((location) => (
              <article
                key={location.slug}
                className="rounded-lg border border-white/16 bg-white/[0.06] p-4"
              >
                <h3 className="font-semibold text-white">{location.name}</h3>
                <p className="mt-1 text-sm leading-6 text-white/75">{location.address}</p>
                <a
                  className="mt-3 inline-flex text-sm text-gold hover:text-white"
                  href={formatPhone(location.phone)}
                >
                  {location.phone}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">Help &amp; Policies</h2>
          <ul className="mt-5 space-y-2 text-sm text-white/76">
            {footerUtilityLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <AccessibilityNavButton
            showLabel
            className="mt-3 justify-start text-sm text-white hover:text-gold"
          />
        </section>
      </div>

      <div className="border-t border-white/15 py-4 text-xs text-white/72">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="leading-5 text-white/60">
            This site uses an essential cookie for your shopping bag and optional browser storage
            for saved Smart Fit and accessibility preferences.{" "}
            <Link
              href="/privacy-policy"
              className="text-white/85 underline decoration-white/30 underline-offset-4 hover:text-gold focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Privacy Policy
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-between">
            <p>
              © {new Date().getFullYear()} {LEGAL_OWNER}. All rights reserved.
            </p>
            <p>Premium menswear shopping with personal in-store service.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
