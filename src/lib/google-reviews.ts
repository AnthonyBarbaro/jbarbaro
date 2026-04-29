import "server-only";

import { unstable_cache } from "next/cache";

import { aggregateRating, testimonials } from "@/data/testimonials";
import { locations } from "@/data/locations";

const GOOGLE_PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const GOOGLE_REVIEW_REVALIDATE_SECONDS = 60 * 60 * 12;

type GoogleTextValue = {
  text?: string;
  languageCode?: string;
};

type GooglePlaceReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: GoogleTextValue;
  originalText?: GoogleTextValue;
  publishTime?: string;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
};

type GooglePlaceDetailsResponse = {
  id?: string;
  displayName?: GoogleTextValue;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GooglePlaceReview[];
  attributions?: Array<{
    provider?: string;
    providerUri?: string;
  }>;
};

type GoogleTextSearchResponse = {
  places?: Array<{
    id?: string;
  }>;
};

export type StoreReview = {
  id: string;
  authorName: string;
  authorUri: string | null;
  rating: number;
  text: string;
  relativeTime: string | null;
  publishTime: string | null;
  locationName: string;
  googleMapsUri: string | null;
};

export type StoreReviewLocationSummary = {
  slug: string;
  name: string;
  address: string;
  ratingValue: number;
  reviewCount: number;
  googleMapsUri: string | null;
};

export type StoreReviewSnapshot = {
  source: "google" | "fallback";
  ratingValue: number;
  reviewCount: number;
  reviews: StoreReview[];
  locations: StoreReviewLocationSummary[];
  attributionLabel: string;
};

function getConfiguredPlaceId(locationSlug: string) {
  if (locationSlug === "partridge-creek") {
    return process.env.GOOGLE_PARTRIDGE_CREEK_PLACE_ID || null;
  }

  if (locationSlug === "great-lakes-crossing-outlet") {
    return process.env.GOOGLE_GREAT_LAKES_PLACE_ID || null;
  }

  return null;
}

function getFallbackReviewSnapshot(): StoreReviewSnapshot {
  return {
    source: "fallback",
    ratingValue: aggregateRating.ratingValue,
    reviewCount: aggregateRating.reviewCount,
    reviews: testimonials.map((testimonial) => {
      const location = locations.find((item) => item.slug === testimonial.locationSlug);

      return {
        id: testimonial.id,
        authorName: testimonial.name,
        authorUri: null,
        rating: testimonial.rating,
        text: testimonial.quote,
        relativeTime: null,
        publishTime: testimonial.date,
        locationName: location ? `${location.brand} ${location.name}` : "J. Barbaro Clothiers",
        googleMapsUri: null,
      };
    }),
    locations: [],
    attributionLabel: "Curated customer reviews",
  };
}

async function resolvePlaceId(location: (typeof locations)[number]) {
  const configuredPlaceId = getConfiguredPlaceId(location.slug);

  if (configuredPlaceId) {
    return configuredPlaceId;
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({
      textQuery: `${location.brand} ${location.name} ${location.address}`,
      locationBias: {
        circle: {
          center: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          radius: 1200,
        },
      },
    }),
    next: {
      revalidate: GOOGLE_REVIEW_REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as GoogleTextSearchResponse | null;

  return payload?.places?.[0]?.id ?? null;
}

function normalizeGooglePlaceReview(
  review: GooglePlaceReview,
  locationName: string,
  googleMapsUri: string | null,
): StoreReview | null {
  const text = review.text?.text || review.originalText?.text || "";
  const authorName = review.authorAttribution?.displayName || "Google reviewer";
  const rating = Number(review.rating);

  if (!text.trim() || !Number.isFinite(rating) || rating <= 0) {
    return null;
  }

  return {
    id: review.name || `${locationName}-${authorName}-${review.publishTime || text.slice(0, 24)}`,
    authorName,
    authorUri: review.authorAttribution?.uri || null,
    rating,
    text: text.trim(),
    relativeTime: review.relativePublishTimeDescription || null,
    publishTime: review.publishTime || null,
    locationName,
    googleMapsUri,
  };
}

async function fetchPlaceDetails(placeId: string, location: (typeof locations)[number]) {
  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,reviews,attributions",
    },
    next: {
      revalidate: GOOGLE_REVIEW_REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as GooglePlaceDetailsResponse | null;

  if (!payload || !payload.rating || !payload.userRatingCount) {
    return null;
  }

  const locationName = payload.displayName?.text || `${location.brand} ${location.name}`;
  const googleMapsUri = payload.googleMapsUri || null;
  const reviews = (payload.reviews ?? [])
    .map((review) => normalizeGooglePlaceReview(review, locationName, googleMapsUri))
    .filter((review): review is StoreReview => Boolean(review));

  return {
    summary: {
      slug: location.slug,
      name: locationName,
      address: payload.formattedAddress || location.address,
      ratingValue: payload.rating,
      reviewCount: payload.userRatingCount,
      googleMapsUri,
    },
    reviews,
  };
}

async function fetchGoogleStoreReviewSnapshot(): Promise<StoreReviewSnapshot> {
  if (!GOOGLE_PLACES_API_KEY) {
    return getFallbackReviewSnapshot();
  }

  const locationResults = await Promise.all(
    locations.map(async (location) => {
      const placeId = await resolvePlaceId(location);

      if (!placeId) {
        return null;
      }

      return fetchPlaceDetails(placeId, location);
    }),
  );

  const googleLocations = locationResults
    .filter((result): result is NonNullable<typeof result> => Boolean(result))
    .map((result) => result.summary);

  if (googleLocations.length === 0) {
    return getFallbackReviewSnapshot();
  }

  const reviewCount = googleLocations.reduce((total, location) => total + location.reviewCount, 0);
  const weightedRatingTotal = googleLocations.reduce(
    (total, location) => total + location.ratingValue * location.reviewCount,
    0,
  );
  const reviews = locationResults.flatMap((result) => result?.reviews ?? []);

  return {
    source: "google",
    ratingValue: Math.round((weightedRatingTotal / reviewCount) * 10) / 10,
    reviewCount,
    reviews,
    locations: googleLocations,
    attributionLabel: "Google reviews",
  };
}

export const getStoreReviewSnapshot = unstable_cache(
  fetchGoogleStoreReviewSnapshot,
  ["google-store-review-snapshot"],
  {
    revalidate: GOOGLE_REVIEW_REVALIDATE_SECONDS,
  },
);
