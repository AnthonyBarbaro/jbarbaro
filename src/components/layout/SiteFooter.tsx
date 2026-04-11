import Link from "next/link";
import { ArrowRight, Facebook, Instagram, Linkedin, PinIcon, Star, XIcon } from "lucide-react";

import {
  footerNewsletterCopy,
  footerNewsletterTitle,
  footerShoppingLinks,
  footerUtilityLinks,
} from "@/data/navigation";
import { aggregateRating } from "@/data/testimonials";
import { locations } from "@/data/locations";
import { socialLinks } from "@/data/social";
import { ButtonLink } from "@/components/ui/Button";
import { formatPhone } from "@/lib/utils";

function socialIcon(label: string) {
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

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink text-ivory">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_0.9fr_1fr_1fr] lg:px-8 lg:py-14">
        <section>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">{footerNewsletterTitle}</p>
          <h2 className="mt-4 font-heading text-3xl sm:text-4xl">Luxury Menswear, Tailored Locally.</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-ivory/76">{footerNewsletterCopy}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/shop" size="sm">
              Shop Online
            </ButtonLink>
            <ButtonLink
              href="/schedule-appointment"
              variant="secondary"
              size="sm"
              className="border-ivory/45 text-ivory hover:border-gold hover:bg-transparent hover:text-gold"
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-gold hover:text-gold"
                aria-label={social.label}
              >
                {socialIcon(social.label)}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">Shopping</h2>
          <ul className="mt-5 space-y-2.5 text-sm text-ivory/80">
            {footerShoppingLinks.map((item, index) => (
              <li key={`${item.href}-${item.label}`}>
                <Link href={item.href} className={index === 0 ? "text-gold hover:text-ivory" : "hover:text-gold"}>
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
              <article key={location.slug} className="rounded-[1.5rem] border border-ivory/16 bg-ivory/6 p-4">
                <h3 className="font-semibold text-ivory">{location.name}</h3>
                <p className="mt-1 text-sm leading-6 text-ivory/75">{location.address}</p>
                <a className="mt-3 inline-flex text-sm text-gold hover:text-ivory" href={formatPhone(location.phone)}>
                  {location.phone}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">Client Trust</h2>
          <div className="mt-5 rounded-[1.5rem] border border-ivory/16 bg-ivory/8 p-5">
            <div className="flex items-end gap-2">
              <p className="text-4xl font-semibold">{aggregateRating.ratingValue}</p>
              <p className="pb-1 text-sm text-ivory/75">/ 5.0</p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-gold">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-2 text-sm leading-6 text-ivory/75">Based on {aggregateRating.reviewCount} verified reviews.</p>
            <Link href="/reviews" className="mt-4 inline-flex items-center gap-2 text-xs tracking-[0.14em] text-gold uppercase hover:text-ivory">
              Read Reviews <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-ivory/76">
            {footerUtilityLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="border-t border-ivory/15 py-4 text-xs text-ivory/72">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 text-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} J. Barbaro Clothiers. All rights reserved.</p>
          <p>Designed for refined wardrobe planning, in-store service, and future online growth.</p>
        </div>
      </div>
    </footer>
  );
}
