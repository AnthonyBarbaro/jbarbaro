import type { Metadata } from "next";

import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants";

type SeoOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
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
  type = "website",
}: SeoOptions): Metadata {
  const canonicalUrl = absoluteUrl(path);
  const ogImage = absoluteUrl(image || DEFAULT_OG_IMAGE);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
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
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} | Luxury Menswear`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      siteName: SITE_NAME,
      title: `${SITE_NAME} | Luxury Menswear`,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      type: "website",
      images: [
        {
          url: absoluteUrl(DEFAULT_OG_IMAGE),
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} | Luxury Menswear`,
      description: SITE_DESCRIPTION,
      images: [absoluteUrl(DEFAULT_OG_IMAGE)],
    },
  };
}
