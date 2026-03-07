import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SITE_URL } from "@/lib/constants";
import { getLocations, getNavigation, getSiteSettings } from "@/lib/cms";
import { absoluteUrl } from "@/lib/seo";

import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${settings.siteName} | Luxury Menswear`,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.siteDescription,
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      siteName: settings.siteName,
      title: `${settings.siteName} | Luxury Menswear`,
      description: settings.siteDescription,
      url: SITE_URL,
      type: "website",
      images: [
        {
          url: absoluteUrl(settings.logoUrl),
          width: 1200,
          height: 630,
          alt: settings.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.siteName} | Luxury Menswear`,
      description: settings.siteDescription,
      images: [absoluteUrl(settings.logoUrl)],
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [navigation, siteSettings, locations] = await Promise.all([
    getNavigation(),
    getSiteSettings(),
    getLocations(),
  ]);
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteSettings.siteName,
    url: SITE_URL,
    description: siteSettings.siteDescription,
    founder: siteSettings.siteOwner,
    sameAs: siteSettings.socialLinks.map((link) => link.href),
    logo: siteSettings.logoUrl,
  };

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="luxe-shell antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-full bg-ink px-4 py-2 text-ivory"
        >
          Skip to content
        </a>
        <SeoJsonLd data={organizationJsonLd} />
        <SiteHeader navigation={navigation} siteSettings={siteSettings} />
        <main id="main-content" className="min-h-[60vh]">
          {children}
        </main>
        <SiteFooter navigation={navigation} siteSettings={siteSettings} locations={locations} />
      </body>
    </html>
  );
}
