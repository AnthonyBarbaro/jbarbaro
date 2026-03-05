import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SITE_DESCRIPTION, SITE_NAME, SITE_OWNER, SITE_URL } from "@/lib/constants";
import { getDefaultSiteMetadata } from "@/lib/seo";

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
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = getDefaultSiteMetadata();

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  founder: SITE_OWNER,
  sameAs: [
    "https://www.facebook.com/barbaroclothiers",
    "https://twitter.com/JBarbaroClothie",
    "https://www.linkedin.com/in/jason-barbaro-6a4a5a28",
    "https://www.pinterest.com/jasonbarbaro/",
    "https://www.instagram.com/j.barbaroclothiers/",
  ],
  logo: "/images/remote/www.jasonbarbaro.com/assets/media/2020/05/logo_trans.png",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
        <SiteHeader />
        <main id="main-content" className="min-h-[60vh]">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
