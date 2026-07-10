import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { buildPrimaryNavigation } from "@/data/navigation";
import { locations } from "@/data/locations";
import { siteSettings } from "@/data/site-settings";
import { socialLinks } from "@/data/social";
import { SITE_URL } from "@/lib/constants";
import { absoluteUrl, getDefaultSiteMetadata } from "@/lib/seo";
import { clothingStoreJsonLd, websiteJsonLd } from "@/lib/structured-data";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

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
  logo: absoluteUrl(siteSettings.logoUrl),
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const navItems = buildPrimaryNavigation();

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="luxe-shell antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-full bg-ink px-4 py-2 text-ivory"
        >
          Skip to content
        </a>
        <SeoJsonLd
          data={[organizationJsonLd, websiteJsonLd(), ...locations.map((location) => clothingStoreJsonLd(location))]}
        />
        <SiteHeader navItems={navItems} />
        <main id="main-content" className="min-h-[60vh]">
          {children}
        </main>
        <SiteFooter />
        <CartDrawer />
      </body>
    </html>
  );
}
