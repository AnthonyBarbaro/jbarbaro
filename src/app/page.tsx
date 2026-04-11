import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ruler, Scissors, ShieldCheck, Star } from "lucide-react";

import { PostCard } from "@/components/content/PostCard";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { LocationOpenBadge } from "@/components/locations/LocationOpenBadge";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WaveSection } from "@/components/ui/WaveSection";
import { featuredBrands } from "@/data/brands";
import { locations } from "@/data/locations";
import { siteSettings } from "@/data/site-settings";
import { aggregateRating, testimonials } from "@/data/testimonials";
import { getFeaturedPosts } from "@/lib/content";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";
import { resolveMenCategories } from "@/lib/shopify/men-categories";
import { getBestSellingProducts, getShopProducts } from "@/lib/shopify/products";
import type { ShopifyProduct } from "@/lib/shopify/types";

const { homePage } = pageContent;

export const metadata = buildMetadata({
  title: homePage.metaTitle,
  description: homePage.metaDescription,
  path: "/",
  image: homePage.heroImage,
});
export const revalidate = 300;

const tailorProcessIcons = [ShieldCheck, Ruler, Scissors] as const;
const homepageCategoryOrder = ["shop all", "suits", "tuxedo", "sports jacket", "sports coat", "shirts", "accessories"] as const;

function getCategoryImage(category: Awaited<ReturnType<typeof resolveMenCategories>>[number]) {
  return category.shopifyCollection?.image ?? category.shopifyCollection?.products[0]?.featuredImage ?? null;
}

function normalizeCategoryName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getHomepageCategories(categories: Awaited<ReturnType<typeof resolveMenCategories>>) {
  const matchedCategories = homepageCategoryOrder
    .map((target) =>
      categories.find((category) => {
        const normalizedName = normalizeCategoryName(category.name);
        const normalizedSlug = normalizeCategoryName(category.slug);

        if (target === "sports coat") {
          return normalizedName === "sports jacket" || normalizedName === "sports coat" || normalizedSlug === "sports jacket";
        }

        return normalizedName === target || normalizedSlug === target;
      }) ?? null,
    )
    .filter((category, index, array): category is NonNullable<(typeof array)[number]> => Boolean(category) && array.indexOf(category) === index);

  return matchedCategories.slice(0, 6);
}

export default async function HomePage() {
  const featuredPosts = getFeaturedPosts(3);
  const featuredCategories = getHomepageCategories(await resolveMenCategories(24, 1));
  const brandShowcase = featuredBrands.slice(0, 8);
  let bestSellingProducts: ShopifyProduct[] = [];

  try {
    bestSellingProducts = (await getBestSellingProducts(4)).filter((product) =>
      product.variants.some((variant) => variant.availableForSale),
    );

    if (bestSellingProducts.length < 4) {
      const fallbackProducts = (await getShopProducts(8)).filter((product) =>
        product.variants.some((variant) => variant.availableForSale),
      );

      bestSellingProducts = Array.from(new Map([...bestSellingProducts, ...fallbackProducts].map((product) => [product.id, product])).values()).slice(0, 4);
    }
  } catch (error) {
    console.error("Unable to load homepage best sellers.", error);

    try {
      bestSellingProducts = (await getShopProducts(4)).filter((product) =>
        product.variants.some((variant) => variant.availableForSale),
      );
    } catch (fallbackError) {
      console.error("Unable to load homepage product fallback.", fallbackError);
    }
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteSettings.siteName,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  };

  return (
    <>
      <SeoJsonLd data={websiteJsonLd} />

      <HeroCarousel
        slides={homePage.heroSlides}
        badges={homePage.heroBadges}
        secondaryCta={homePage.heroCtas[1]}
      />

      {bestSellingProducts.length > 0 ? (
        <section className="border-y border-ink/8 bg-[linear-gradient(180deg,#fffdf8_0%,#f7f0e4_100%)]">
          <Container className="py-10 sm:py-12 lg:py-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Badge variant="gold" className="px-3.5 py-1.5">
                  Best Sellers
                </Badge>
                <h2 className="mt-4 font-heading text-4xl text-ink uppercase sm:text-5xl">Customer Favorites</h2>
              </div>
              <Link
                href="/shop"
                className="rounded-full border border-ink/12 bg-white/80 px-5 py-3 text-[11px] font-semibold tracking-[0.16em] text-deep-teal uppercase transition-colors hover:border-gold/35 hover:text-gold"
              >
                Show All
              </Link>
            </div>

            <div className="-mx-4 mt-6 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-4 lg:min-w-0">
                {bestSellingProducts.map((product) => (
                  <div key={product.id} className="w-[17rem] shrink-0 sm:w-[18rem] lg:min-w-0 lg:flex-1">
                    <ShopProductCard product={product} columns={2} />
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      {featuredCategories.length > 0 ? (
        <section className="border-b border-ink/8 bg-[linear-gradient(180deg,#fbfaf6_0%,#eef3ef_100%)]">
          <Container className="py-10 sm:py-12 lg:py-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Badge variant="teal" className="px-3.5 py-1.5">
                  Shop by Category
                </Badge>
                <h2 className="mt-4 font-heading text-4xl text-ink uppercase sm:text-5xl">Pick Your Style</h2>
              </div>
              <Link
                href="/for-men"
                className="rounded-full border border-ink/12 bg-white/80 px-5 py-3 text-[11px] font-semibold tracking-[0.16em] text-deep-teal uppercase transition-colors hover:border-gold/35 hover:text-gold"
              >
                Show All
              </Link>
            </div>

            <div className="-mx-4 mt-6 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-4 lg:min-w-0 lg:grid lg:grid-cols-3 lg:gap-5">
                {featuredCategories.map((category) => {
                  const categoryImage = getCategoryImage(category);

                  return (
                    <Link key={category.href} href={category.href} className="group block h-full w-[17rem] shrink-0 sm:w-[18rem] lg:w-auto lg:min-w-0">
                      <Card className="h-full border-ink/8 bg-white/92 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_28px_50px_-36px_rgba(14,23,38,0.28)]">
                        <div className="relative aspect-[16/11] overflow-hidden border-b border-ink/8 bg-stone sm:aspect-[16/10] lg:aspect-[4/3]">
                          {categoryImage ? (
                            <>
                              <Image
                                src={categoryImage.url}
                                alt={categoryImage.altText || `${category.name} collection`}
                                fill
                                sizes="(max-width: 768px) 80vw, (max-width: 1024px) 18rem, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-ink/48 via-ink/12 to-transparent" />
                            </>
                          ) : (
                            <div className="flex h-full items-center justify-center bg-stone text-sm text-smoke">Collection image coming soon</div>
                          )}

                          <div className="absolute inset-x-0 top-0 flex justify-end p-4 text-[11px] font-semibold tracking-[0.16em] text-ivory uppercase">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/10 backdrop-blur">
                              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </div>

                        <CardContent className="p-5 sm:p-6">
                          <h2 className="truncate font-heading text-[2rem] leading-none text-ink sm:text-[2.15rem] lg:overflow-visible lg:text-[1.9rem] lg:whitespace-nowrap xl:text-[2.1rem]">
                            {category.name}
                          </h2>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      <WaveSection topWave="C" bottomWave="A" background="stone">
        <Container className="grid gap-8 xl:grid-cols-[1.14fr_0.86fr]">
          <div>
            <SectionHeading
              eyebrow={homePage.brandsSection.eyebrow}
              title={homePage.brandsSection.title}
              description={homePage.brandsSection.description}
              className="max-w-3xl"
            />

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {brandShowcase.map((brand) => (
                <Link
                  href={`/collection-brand/${brand.slug}`}
                  key={brand.slug}
                  className="group overflow-hidden rounded-[1.5rem] border border-ink/10 bg-ivory transition-all duration-300 hover:-translate-y-1 hover:border-gold"
                >
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={brand.image}
                      alt={`${brand.name} designer collection`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/74 via-ink/30 to-ink/8" />
                    <div className="absolute inset-0 p-5">
                      <div className="relative h-full w-full">
                        <Image
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-contain opacity-80 drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
                        />
                      </div>
                    </div>
                    <div className="absolute right-3 bottom-3 left-3">
                      <p className="text-center text-[0.66rem] font-semibold tracking-[0.12em] text-ivory uppercase">{brand.name}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {homePage.brandsSection.buttons.map((button, index) => (
                <ButtonLink key={button.href} href={button.href} variant={index === 0 ? "teal" : "secondary"}>
                  {button.label}
                </ButtonLink>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="bg-ink text-ivory">
              <CardContent>
                <Badge
                  variant="gold"
                  className="border-gold/95 bg-gold px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[0.12em] text-ink shadow-[0_8px_22px_-12px_rgba(0,0,0,0.9)] sm:text-xs"
                >
                  {homePage.appointmentPriority.badge}
                </Badge>
                <h2 className="mt-4 font-heading text-3xl sm:text-4xl">{homePage.appointmentPriority.title}</h2>
                <p className="mt-4 text-sm leading-7 text-ivory/82 sm:text-base sm:leading-8">{homePage.appointmentPriority.description}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href={homePage.appointmentPriority.buttonHref}>{homePage.appointmentPriority.buttonLabel}</ButtonLink>
                  <ButtonLink
                    href="/contact-us"
                    variant="secondary"
                    className="border-ivory/60 text-ivory hover:border-gold hover:bg-transparent hover:text-gold"
                  >
                    Contact Team
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>

            <Card tone="stone">
              <CardContent>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">{homePage.appointmentPriority.testimonialHeading}</p>
                <div className="mt-3 flex items-center gap-1 text-gold">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-smoke">
                  “{testimonials[0]?.quote || "Excellent service and fit guidance."}”
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.12em] text-smoke uppercase">
                    {testimonials[0]?.name || "Verified Client"}
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    {aggregateRating.ratingValue} / 5
                  </p>
                </div>
                <Link
                  href="/reviews"
                  className="mt-5 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold"
                >
                  Read More Reviews <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>

      <WaveSection background="ivory">
        <Container className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
          <div>
            <SectionHeading
              eyebrow={homePage.tailorProcess.eyebrow}
              title={homePage.tailorProcess.title}
              description={homePage.tailorProcess.description}
              className="max-w-3xl"
            />

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {homePage.tailorProcess.items.map((item, index) => {
                const Icon = tailorProcessIcons[index] ?? ShieldCheck;

                return (
                  <Card key={item.title} tone="stone" className="h-full min-w-0">
                    <CardContent className="px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
                      <Icon className="h-6 w-6 text-deep-teal" />
                      <h2 className="mt-4 font-heading text-[1.65rem] leading-[1.05] tracking-[-0.01em] text-ink sm:text-[1.85rem]">
                        {item.title}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-smoke">{item.copy}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow={homePage.locationsSection.eyebrow}
              title={homePage.locationsSection.title}
              description={homePage.locationsSection.description}
              className="max-w-2xl"
            />

            <div className="mt-8 space-y-4">
              {locations.map((location) => (
                <Card key={location.slug} className="bg-white/92">
                  <CardContent>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-heading text-2xl text-ink sm:text-3xl">{location.name}</h2>
                        <p className="mt-2 text-sm leading-7 text-smoke">{location.address}</p>
                        <LocationOpenBadge location={location} />
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <ButtonLink href={`/location/${location.slug}`} variant="secondary" size="sm">
                          Location Details
                        </ButtonLink>
                        <ButtonLink href="/schedule-appointment" size="sm">
                          Book This Store
                        </ButtonLink>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow={homePage.journalSection.eyebrow}
              title={homePage.journalSection.title}
              description={homePage.journalSection.description}
              className="max-w-3xl"
            />
            <ButtonLink href="/blog" variant="secondary" className="w-full sm:w-auto">
              Read the Journal
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featuredPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
