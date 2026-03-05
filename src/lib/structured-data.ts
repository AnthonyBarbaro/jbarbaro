import { SITE_NAME } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";

export type BreadcrumbInput = {
  name: string;
  path: string;
};

export function breadcrumbJsonLd(items: BreadcrumbInput[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd({
  title,
  description,
  path,
  publishedAt,
  updatedAt,
  image,
  author,
}: {
  title: string;
  description: string;
  path: string;
  publishedAt: string;
  updatedAt?: string;
  image: string;
  author: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    image: absoluteUrl(image),
    mainEntityOfPage: absoluteUrl(path),
  };
}
