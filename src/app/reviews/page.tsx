import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";

import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { getStoreReviewSnapshot, type StoreReview } from "@/lib/google-reviews";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

const { reviewsPage } = pageContent;
const GOOGLE_REVIEWS_LISTING_URL =
  "https://www.google.com/search?newwindow=1&rlz=1C1GCEA_enUS1194US1194&aep=1&cs=1&hl=en-US&sca_esv=74837c4673692df8&sxsrf=ANbL-n44M-dD9t6FegDpdDVpvNjMpv18DA:1777489885037&si=AL3DRZFIhG6pAqfNLal55wUTwygCG0fClF3UxiOmgw9Hq7nbWZoHLaT3ZeMHTlJkXy9S0AsXs_0V4HTWcDmA5rz7jcV7RlXdZ__dlgC4y3X3DGzQcCYfzaahvAcFyPhGQsKOXVF3oIFmAtZxqsxL2G4vCoK-6B6rQg%3D%3D&q=J.+Barbaro+Clothiers+Reviews&sa=X&ved=2ahUKEwiO5cHp4ZOUAxUhJEQIHY9CLVwQ0bkNegQIRRAH&biw=1920&bih=911&dpr=1";

export const metadata = buildMetadata({
  title: reviewsPage.metaTitle,
  description: reviewsPage.metaDescription,
  path: "/reviews",
});

function StarRating({ rating, className = "h-4 w-4" }: { rating: number; className?: string }) {
  const roundedRating = Math.round(rating);

  return (
    <div className="flex items-center gap-1 text-gold" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`${className} ${index < roundedRating ? "fill-current" : "fill-none opacity-45"}`}
        />
      ))}
    </div>
  );
}

function getReviewDateLabel(review: StoreReview) {
  if (review.relativeTime) {
    return review.relativeTime;
  }

  return review.publishTime ? formatDate(review.publishTime) : null;
}

export default async function ReviewsPage() {
  const storeReviewSnapshot = await getStoreReviewSnapshot();
  const primaryGoogleUri =
    storeReviewSnapshot.locations.find((location) => location.googleMapsUri)?.googleMapsUri ?? null;
  const googleReviewsUri = primaryGoogleUri ?? GOOGLE_REVIEWS_LISTING_URL;
  const isGoogleSource = storeReviewSnapshot.source === "google";

  return (
    <>
      <PageHero
        title={reviewsPage.hero.title}
        description={reviewsPage.hero.description}
        ctaHref={reviewsPage.hero.ctaPrimary.href}
        ctaLabel={reviewsPage.hero.ctaPrimary.label}
      />

      <WaveSection topWave="B" bottomWave="C" background="ivory">
        <Container>
          <Card tone="stone">
            <CardContent>
              <p className="text-sm font-semibold tracking-[0.14em] text-deep-teal uppercase">
                {isGoogleSource ? "Google Store Rating" : reviewsPage.aggregateLabel}
              </p>
              <h2 className="mt-3 font-heading text-5xl text-ink sm:text-6xl">
                {storeReviewSnapshot.ratingValue.toFixed(1)}{" "}
                <span className="text-xl text-smoke sm:text-2xl">/ 5.0</span>
              </h2>
              <p className="mt-2 text-sm text-smoke">
                Based on {new Intl.NumberFormat("en-US").format(storeReviewSnapshot.reviewCount)}{" "}
                {isGoogleSource ? "Google reviews across our store locations" : "customer reviews"}
              </p>
              <div className="mt-4">
                <StarRating rating={storeReviewSnapshot.ratingValue} className="h-5 w-5" />
              </div>

              {storeReviewSnapshot.locations.length > 0 ? (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {storeReviewSnapshot.locations.map((location) => (
                    <div
                      key={location.slug}
                      className="rounded-md border border-ink/10 bg-white p-4"
                    >
                      <p className="text-sm font-semibold text-ink">{location.name}</p>
                      <p className="mt-1 text-xs leading-5 text-smoke">{location.address}</p>
                      <p className="mt-3 text-sm font-semibold text-ink">
                        {location.ratingValue.toFixed(1)} / 5{" "}
                        <span className="font-normal text-smoke">
                          ({new Intl.NumberFormat("en-US").format(location.reviewCount)} reviews)
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
                  Schedule Your Visit
                </ButtonLink>
                <ButtonLink
                  href={googleReviewsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  View Google Reviews
                </ButtonLink>
              </div>
              <p className="mt-4 text-xs leading-5 text-smoke">
                {isGoogleSource
                  ? "Review highlights are sourced from Google and shown in Google's relevance order."
                  : "Live Google review data will appear here when Google Places API credentials are configured."}
              </p>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {storeReviewSnapshot.reviews.map((review) => {
              const dateLabel = getReviewDateLabel(review);

              return (
                <Card key={review.id} className="h-full">
                  <CardContent>
                    <StarRating rating={review.rating} />
                    <blockquote className="mt-4 font-heading text-2xl leading-tight text-ink sm:text-3xl">
                      &ldquo;{review.text}&rdquo;
                    </blockquote>
                    <div className="mt-5 space-y-1">
                      {review.authorUri ? (
                        <Link
                          href={review.authorUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-xs font-semibold tracking-[0.12em] text-smoke uppercase hover:text-deep-teal"
                        >
                          {review.authorName}
                        </Link>
                      ) : (
                        <p className="text-xs font-semibold tracking-[0.12em] text-smoke uppercase">
                          {review.authorName}
                        </p>
                      )}
                      <p className="text-xs leading-5 text-smoke">
                        {review.locationName}
                        {dateLabel ? ` / ${dateLabel}` : ""}
                      </p>
                    </div>
                    {review.googleMapsUri ? (
                      <Link
                        href={review.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold"
                      >
                        View on Google
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href="/schedule-appointment"
                        className="mt-4 inline-flex text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold"
                      >
                        Book a Similar Experience
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
