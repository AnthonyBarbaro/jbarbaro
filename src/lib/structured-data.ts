import { SITE_NAME } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
import type { Location } from "@/types/site";

export type BreadcrumbInput = {
  name: string;
  path: string;
};

const DAY_NAMES: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function expandDayRange(days: string): string[] {
  const normalized = days.toLowerCase().replace(/\./g, "").trim();
  const [start, end] = normalized.split("-").map((part) => part.trim().slice(0, 3));

  if (!start || !DAY_NAMES[start]) {
    return [];
  }

  if (!end || !DAY_NAMES[end]) {
    return [DAY_NAMES[start]];
  }

  const startIndex = DAY_ORDER.indexOf(start);
  const endIndex = DAY_ORDER.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return [DAY_NAMES[start]];
  }

  return DAY_ORDER.slice(startIndex, endIndex + 1).map((day) => DAY_NAMES[day]);
}

function to24Hour(time: string): string | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]) % 12;

  if (match[3].toUpperCase() === "PM") {
    hours += 12;
  }

  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function parseUsAddress(address: string) {
  const match = address.match(/^(.*),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);

  if (!match) {
    return { streetAddress: address };
  }

  return {
    streetAddress: match[1].trim(),
    addressLocality: match[2].trim(),
    addressRegion: match[3],
    postalCode: match[4],
  };
}

export function clothingStoreJsonLd(location: Location) {
  const address = parseUsAddress(location.address);
  const openingHoursSpecification = (location.hours ?? [])
    .map((entry) => {
      const opens = to24Hour(entry.open);
      const closes = to24Hour(entry.close);
      const dayOfWeek = expandDayRange(entry.days);

      if (!opens || !closes || dayOfWeek.length === 0) {
        return null;
      }

      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek,
        opens,
        closes,
      };
    })
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": absoluteUrl(`/location/${location.slug}`),
    name: `${location.brand || SITE_NAME} - ${location.name}`,
    url: absoluteUrl(`/location/${location.slug}`),
    telephone: location.phone,
    image: location.photo ? absoluteUrl(location.photo) : undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
      ...address,
    },
    geo:
      location.latitude && location.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : undefined,
    openingHoursSpecification: openingHoursSpecification.length > 0 ? openingHoursSpecification : undefined,
    priceRange: "$$$",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/shop")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

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
