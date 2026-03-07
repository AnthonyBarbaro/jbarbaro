import Link from "next/link";
import { ArrowRight, Facebook, Instagram, Linkedin, PinIcon, Star, XIcon } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import type { NavigationContent, SiteSettingsContent } from "@/lib/cms-defaults";
import { formatPhone } from "@/lib/utils";
import type { Location } from "@/types/site";

type SiteFooterProps = {
  navigation: NavigationContent;
  siteSettings: SiteSettingsContent;
  locations: Location[];
};

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

export function SiteFooter({ navigation, siteSettings, locations }: SiteFooterProps) {
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
              <p className="text-4xl font-semibold">{siteSettings.ratingValue}</p>
              <p className="pb-1 text-sm text-ivory/75">/ 5.0</p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-gold">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-2 text-sm text-ivory/75">Based on {siteSettings.reviewCount} verified reviews.</p>
            <Link href="/reviews" className="mt-4 inline-flex items-center gap-2 text-xs tracking-[0.14em] text-gold uppercase hover:text-ivory">
              Read Reviews <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">Shopping</h2>
          <ul className="mt-5 space-y-2 text-sm text-ivory/80">
            {navigation.footerShoppingLinks.map((link, index) => (
              <li key={`${link.href}-${index}`}>
                <Link
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className={index === 0 ? "text-gold hover:text-ivory" : "hover:text-gold"}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl sm:text-3xl">{navigation.footerNewsletterTitle}</h2>
          <p className="mt-4 text-sm leading-6 text-ivory/78">
            {navigation.footerNewsletterCopy}
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
            {siteSettings.socialLinks.map((social) => (
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
            {navigation.footerUtilityLinks.map((link, index) => (
              <Link
                key={`${link.href}-${index}`}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
