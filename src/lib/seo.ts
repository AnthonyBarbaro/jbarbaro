import type { Metadata } from "next";

import { siteSettings } from "@/data/site-settings";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants";

type SeoOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  robots?: Metadata["robots"];
  type?: "website" | "article";
};

export const defaultKeywords = [
  "luxury menswear",
  "designer clothing",
  "tailored suits",
  "tuxedo rentals",
  "Metro Detroit clothiers",
  "J. Barbaro Clothiers",
];

export function absoluteUrl(path: string) {
  if (!path) {
    return SITE_URL;
  }

  if (path.startsWith("http")) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  keywords = defaultKeywords,
  robots,
  type = "website",
}: SeoOptions): Metadata {
  const canonicalUrl = absoluteUrl(path);
  const ogImage = absoluteUrl(image || DEFAULT_OG_IMAGE);

  return {
    title,
    description,
    keywords,
    robots,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: siteSettings.siteName || SITE_NAME,
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function getDefaultSiteMetadata(): Metadata {
  const siteName = siteSettings.siteName || SITE_NAME;
  const siteDescription = siteSettings.siteDescription || SITE_DESCRIPTION;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${siteName} | Luxury Menswear`,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      siteName,
      title: `${siteName} | Luxury Menswear`,
      description: siteDescription,
      url: SITE_URL,
      type: "website",
      images: [
        {
          url: absoluteUrl(DEFAULT_OG_IMAGE),
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} | Luxury Menswear`,
      description: siteDescription,
      images: [absoluteUrl(DEFAULT_OG_IMAGE)],
    },
  };
}
