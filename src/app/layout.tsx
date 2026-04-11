import type { Metadata } from "next";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { FloatingCartBar } from "@/components/shop/FloatingCartBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { buildPrimaryNavigation } from "@/data/navigation";
import { siteSettings } from "@/data/site-settings";
import { socialLinks } from "@/data/social";
import { SITE_URL } from "@/lib/constants";
import { getDefaultSiteMetadata } from "@/lib/seo";
import { resolveCollectionNavItems } from "@/lib/shopify/collection-nav";
import { resolveMenCategories } from "@/lib/shopify/men-categories";

import "./globals.css";

export const metadata: Metadata = getDefaultSiteMetadata();
export const revalidate = 300;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteSettings.siteName,
  url: SITE_URL,
  description: siteSettings.siteDescription,
  founder: siteSettings.siteOwner,
  sameAs: socialLinks.map((link) => link.href),
  logo: siteSettings.logoUrl,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await resolveMenCategories(24, 1);
  const collectionNavItems = await resolveCollectionNavItems(40);
  const navItems = buildPrimaryNavigation(
    categories.map((category) => ({
      label: category.name,
      href: category.href,
    })),
  );

  return (
    <html lang="en">
      <body className="luxe-shell antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-full bg-ink px-4 py-2 text-ivory"
        >
          Skip to content
        </a>
        <SeoJsonLd data={organizationJsonLd} />
        <SiteHeader navItems={navItems} collectionItems={collectionNavItems} />
        <main id="main-content" className="min-h-[60vh]">
          {children}
        </main>
        <FloatingCartBar />
        <SiteFooter />
      </body>
    </html>
  );
}
