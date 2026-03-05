import Link from "next/link";
import { ArrowRight, Facebook, Instagram, Linkedin, PinIcon, Star, XIcon } from "lucide-react";

import { aggregateRating } from "@/data/testimonials";
import { locations } from "@/data/locations";
import { socialLinks } from "@/data/social";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
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
    <footer className="mt-12 bg-ink text-ivory">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">Visit Us</h2>
          <div className="mt-5 space-y-4">
            {locations.map((location) => (
              <article key={location.slug} className="rounded-2xl border border-ivory/20 bg-ivory/6 p-4">
                <h3 className="font-semibold text-ivory">{location.name}</h3>
                <p className="mt-1 text-sm text-ivory/75">{location.address}</p>
                <a className="mt-2 inline-flex text-sm text-gold hover:text-ivory" href={formatPhone(location.phone)}>
                  {location.phone}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">People Love Us</h2>
          <div className="mt-5 rounded-2xl border border-ivory/20 bg-ivory/8 p-5">
            <div className="flex items-end gap-2">
              <p className="text-4xl font-semibold">{aggregateRating.ratingValue}</p>
              <p className="pb-1 text-sm text-ivory/75">/ 5.0</p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-gold">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-2 text-sm text-ivory/75">Based on {aggregateRating.reviewCount} verified reviews.</p>
            <Link href="/reviews" className="mt-4 inline-flex items-center gap-2 text-xs tracking-[0.14em] text-gold uppercase hover:text-ivory">
              Read Reviews <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">Shopping</h2>
          <ul className="mt-5 space-y-2 text-sm text-ivory/80">
            <li>
              <Link href="/shop-coming-soon" className="text-gold hover:text-ivory">
                Shop Online
              </Link>
            </li>
            <li>
              <Link href="/schedule-appointment" className="hover:text-gold">
                Schedule Appointment
              </Link>
            </li>
            <li>
              <Link href="/suit-tuxedo-rentals" className="hover:text-gold">
                Tuxedo Rentals
              </Link>
            </li>
            <li>
              <Link href="/register-your-wedding" className="hover:text-gold">
                Register Wedding
              </Link>
            </li>
            <li>
              <Link href="/sale-coming-soon" className="hover:text-gold">
                Sale Coming Soon
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-gold">
                Cart
              </Link>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">Stay in the Loop</h2>
          <p className="mt-4 text-sm leading-6 text-ivory/78">
            New arrivals, seasonal edits, and private appointment windows. Newsletter signup backend is coming soon.
          </p>
          <form className="mt-4 space-y-3">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <Input
              id="newsletter-email"
              type="email"
              placeholder="Your email"
              className="border-ivory/30 bg-ivory/10 text-ivory placeholder:text-ivory/60 focus:border-gold focus:ring-gold/20"
            />
            <Button type="submit" variant="teal" className="w-full">
              Notify Me
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
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
      </div>

      <div className="border-t border-ivory/15 py-4 text-xs text-ivory/72">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 text-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} J. Barbaro Clothiers. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="hover:text-gold">
              Home
            </Link>
            <Link href="/about/our-history" className="hover:text-gold">
              Our History
            </Link>
            <Link href="/locations" className="hover:text-gold">
              Locations
            </Link>
            <Link href="/contact-us" className="hover:text-gold">
              Contact Us
            </Link>
            <Link href="/sitemap" className="hover:text-gold">
              Sitemap
            </Link>
            <Link href="/sitemap.xml" className="hover:text-gold">
              XML
            </Link>
            <Link href="/rss.xml" className="hover:text-gold">
              RSS
            </Link>
            <Link href="/terms-of-use" className="hover:text-gold">
              Terms
            </Link>
            <Link href="/privacy-policy" className="hover:text-gold">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
