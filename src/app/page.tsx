import { MapPin, Phone, Ruler, ShieldCheck, Store, Tags } from "lucide-react";

import { BrandProductRail } from "@/components/home/BrandProductRail";
import { CollectionRail } from "@/components/home/CollectionRail";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { NewArrivalsCarousel } from "@/components/home/NewArrivalsCarousel";
import { LocationOpenBadge } from "@/components/locations/LocationOpenBadge";
import { ShowroomGallery } from "@/components/locations/ShowroomGallery";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { locations } from "@/data/locations";
import { partridgeCreekShowroomPhotos } from "@/data/showroom-gallery";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";
import { getShopBrands } from "@/lib/shopify/brands";
import { resolveMenCategories } from "@/lib/shopify/men-categories";
import {
  getBestSellingProducts,
  getBestSellingProductsByVendor,
  getNewArrivalProducts,
} from "@/lib/shopify/products";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { formatPhone } from "@/lib/utils";

const { homePage } = pageContent;

export const metadata = buildMetadata({
  title: homePage.metaTitle,
  description: homePage.metaDescription,
  path: "/",
});
export const revalidate = 300;

type ResolvedCategory = Awaited<ReturnType<typeof resolveMenCategories>>[number];

const categoryPriority = [
  ["suits"],
  ["shop all", "all"],
  ["sport coats", "sports jacket", "sport jacket"],
  ["shirts", "dress shirts", "casual shirts"],
  ["pants", "dress pants", "trousers"],
  ["shoes", "footwear"],
  ["denim"],
  ["accessories"],
  ["outerwear"],
  ["tuxedo", "formalwear"],
] as const;
const categoryFallbackImages: Record<string, string> = {
  accessories:
    "/images/remote/www.jasonbarbaro.com/assets/media/2020/02/tateossian-111716-278-500x500.jpg",
  "casual-shirts":
    "/images/remote/www.jasonbarbaro.com/assets/media/2020/02/eton-012220-114-500x500.jpg",
  denim: "/images/locations/partridge-creek/showroom-06.jpg",
  "dress-shirts":
    "/images/remote/www.jasonbarbaro.com/assets/media/2020/02/eton-012220-114-500x500.jpg",
  formalwear: "/images/campaign/formalwear-nav-v2.webp",
  footwear: "/images/remote/www.jasonbarbaro.com/assets/media/2022/01/swims-131051-024-500x500.jpg",
  pants: "/images/locations/partridge-creek/showroom-06.jpg",
  neckwear:
    "/images/remote/www.jasonbarbaro.com/assets/media/2020/02/tateossian-111716-278-500x500.jpg",
  outerwear: "/images/locations/partridge-creek/showroom-05.jpg",
  shirts: "/images/remote/www.jasonbarbaro.com/assets/media/2020/02/eton-012220-114-500x500.jpg",
  shoes: "/images/remote/www.jasonbarbaro.com/assets/media/2022/01/swims-131051-024-500x500.jpg",
  "sport-coats": "/images/hero-suits-299.jpg",
  suits: "/images/hero-suits-299.jpg",
  "suits-sports-coats": "/images/hero-suits-299.jpg",
  sweaters: "/images/locations/partridge-creek/showroom-05.jpg",
  trousers: "/images/locations/partridge-creek/showroom-06.jpg",
};
const categoryPresentation: Record<string, { href: string; name: string }> = {
  all: { href: "/shop", name: "Shop All" },
  accessories: { href: "/categories/accessories", name: "Accessories" },
  denim: { href: "/categories/denim", name: "Denim" },
  formalwear: { href: "/categories/formalwear", name: "Formalwear" },
  outerwear: { href: "/categories/outerwear", name: "Outerwear" },
  pants: { href: "/categories/pants", name: "Pants" },
  shirts: { href: "/categories/shirts", name: "Shirts" },
  shoes: { href: "/categories/shoes", name: "Shoes" },
  "sport-coats": { href: "/categories/sport-coats", name: "Sport Coats" },
  suits: { href: "/categories/suits", name: "Suits" },
};
const DEFAULT_CATEGORY_IMAGE = "/images/locations/partridge-creek/showroom-02.jpg";
const promotedBrandVendors = ["Alberto", "Canali", "Eton", "Corneliani", "Magnanni"] as const;

type PromotedBrandRow = {
  vendor: string;
  name: string;
  slug: string;
  products: ShopifyProduct[];
};

function normalizeCategory(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCategoryImage(category: ResolvedCategory) {
  return (
    category?.shopifyCollection?.image?.url ??
    category?.shopifyCollection?.products[0]?.featuredImage?.url ??
    categoryFallbackImages[category.slug] ??
    DEFAULT_CATEGORY_IMAGE
  );
}

function getStorefrontCategories(categories: ResolvedCategory[]) {
  return [...categories]
    .sort((left, right) => {
      const leftName = normalizeCategory(left.name);
      const leftSlug = normalizeCategory(left.slug);
      const rightName = normalizeCategory(right.name);
      const rightSlug = normalizeCategory(right.slug);
      const leftIndex = categoryPriority.findIndex((aliases) =>
        aliases.some((alias) => leftName === alias || leftSlug === alias),
      );
      const rightIndex = categoryPriority.findIndex((aliases) =>
        aliases.some((alias) => rightName === alias || rightSlug === alias),
      );

      if (leftIndex === -1 && rightIndex === -1) {
        return left.name.localeCompare(right.name);
      }

      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;

      return leftIndex - rightIndex;
    })
    .map((category) => {
      const presentation = categoryPresentation[category.slug];

      return {
        href: presentation?.href ?? category.href,
        name: presentation?.name ?? category.name,
        image: getCategoryImage(category),
        slug: category.slug,
      };
    });
}

function uniqueProducts(products: ShopifyProduct[]) {
  return Array.from(new Map(products.map((product) => [product.id, product])).values());
}

export default async function HomePage() {
  const resolvedCategories = await resolveMenCategories(50, 1);
  const categories = getStorefrontCategories(resolvedCategories);
  let bestSellers: ShopifyProduct[] = [];
  let newArrivals: ShopifyProduct[] = [];
  let promotedBrandRows: PromotedBrandRow[] = [];

  try {
    bestSellers = uniqueProducts(await getBestSellingProducts(24)).slice(0, 24);
  } catch (error) {
    console.error("Unable to load homepage best sellers.", error);
  }

  try {
    newArrivals = uniqueProducts(await getNewArrivalProducts(20)).slice(0, 20);
  } catch (error) {
    console.error("Unable to load homepage new arrivals.", error);
  }

  try {
    const shopBrands = await getShopBrands();
    const brandsByVendor = new Map(
      shopBrands.map((brand) => [brand.vendor.trim().toLocaleLowerCase(), brand]),
    );

    promotedBrandRows = (
      await Promise.all(
        promotedBrandVendors.map(async (vendor) => {
          const brand = brandsByVendor.get(vendor.toLocaleLowerCase());

          if (!brand) {
            return null;
          }

          try {
            const products = uniqueProducts(await getBestSellingProductsByVendor(brand.vendor, 8));

            return products.length > 0
              ? {
                  vendor: brand.vendor,
                  name: brand.name,
                  slug: brand.slug,
                  products,
                }
              : null;
          } catch (error) {
            console.error(`Unable to load homepage products for ${brand.name}.`, error);
            return null;
          }
        }),
      )
    ).filter((row): row is PromotedBrandRow => row !== null);
  } catch (error) {
    console.error("Unable to load promoted homepage brands.", error);
  }

  return (
    <>
      <HeroCarousel
        slides={homePage.heroSlides}
        badges={homePage.heroBadges}
        secondaryCta={
          homePage.heroCtas[1] ?? { label: "Book Appointment", href: "/schedule-appointment" }
        }
      />

      <WaveSection topWave="A" background="ivory" padded={false} className="border-b border-ink/15">
        <CollectionRail collections={categories} />
      </WaveSection>

      {promotedBrandRows.length > 0 ? (
        <WaveSection
          background="ivory"
          contentClassName="py-10 sm:py-12 lg:py-14"
          className="border-b border-ink/15"
        >
          <Container className="max-w-none px-0">
            <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
              <div>
                <Badge variant="gold">Designer Brands</Badge>
                <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">Shop by brand.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                  Browse designer labels represented in our online catalog and go straight to their
                  products.
                </p>
              </div>
              <ButtonLink href="/shop/brands" className="w-full rounded-none sm:w-auto">
                Shop All Brands
              </ButtonLink>
            </div>

            <div className="mt-8">
              {promotedBrandRows.map((brand) => (
                <BrandProductRail key={brand.vendor} brandName={brand.name} brandSlug={brand.slug}>
                  {brand.products.map((product) => (
                    <li
                      key={product.id}
                      className="w-[76vw] shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-[23vw] xl:w-[19vw] 2xl:w-[16.666vw] min-[100rem]:w-[14.285vw]"
                    >
                      <ShopProductCard
                        product={product}
                        headingLevel="h4"
                        imagePresentation="filled"
                        imageSizes="(max-width: 639px) 76vw, (max-width: 767px) 42vw, (max-width: 1023px) 30vw, (max-width: 1279px) 23vw, (max-width: 1535px) 19vw, 15vw"
                      />
                    </li>
                  ))}
                </BrandProductRail>
              ))}
            </div>
          </Container>
        </WaveSection>
      ) : null}

      <WaveSection
        topWave="C"
        background="stone"
        contentClassName="py-8 sm:py-10 lg:py-12"
        className="border-b border-ink/15 bg-[#f1eee7]"
      >
        <Container className="max-w-none min-w-0 overflow-hidden px-0">
          <div
            id="best-sellers"
            className="flex scroll-mt-28 flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8 xl:px-10 2xl:px-12"
          >
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-ink/60 uppercase">
                The J. Barbaro Edit
              </p>
              <h2 className="mt-2 font-heading text-4xl text-ink sm:text-5xl">Best Sellers</h2>
            </div>
            <ButtonLink
              href="/shop?top=best#top-picks"
              variant="secondary"
              className="w-full rounded-none border-ink/25 bg-transparent hover:bg-ivory sm:w-auto"
            >
              Shop Best Sellers
            </ButtonLink>
          </div>

          {bestSellers.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-px border-y border-ink/10 bg-ink/10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 min-[100rem]:grid-cols-8">
              {bestSellers.map((product) => (
                <ShopProductCard
                  key={product.id}
                  product={product}
                  headingLevel="h3"
                  imagePresentation="filled"
                  imageSizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, (max-width: 1599px) 16.67vw, 12.5vw"
                />
              ))}
            </div>
          ) : (
            <Card className="mt-8 bg-white">
              <CardContent>
                <h3 className="font-heading text-3xl text-ink">Products are refreshing.</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke">
                  Browse categories or book an appointment and we will prepare options for your
                  size, occasion, and fit goals.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ButtonLink href="/categories">Browse Categories</ButtonLink>
                  <ButtonLink href="/schedule-appointment" variant="secondary">
                    Book Appointment
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          )}

          {newArrivals.length > 0 ? (
            <NewArrivalsCarousel itemCount={newArrivals.length}>
              {newArrivals.map((product) => (
                <li
                  key={product.id}
                  className="w-[76vw] shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-[23vw] xl:w-[19vw] 2xl:w-[16.666vw] min-[100rem]:w-[14.285vw]"
                >
                  <ShopProductCard
                    product={product}
                    headingLevel="h3"
                    imagePresentation="filled"
                    imageSizes="(max-width: 639px) 76vw, (max-width: 767px) 42vw, (max-width: 1023px) 30vw, (max-width: 1279px) 23vw, (max-width: 1535px) 19vw, 15vw"
                  />
                </li>
              ))}
            </NewArrivalsCarousel>
          ) : null}
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="ivory">
        <Container className="max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div
            id="showroom"
            className="grid scroll-mt-28 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
          >
            <div className="max-w-3xl">
              <Badge variant="teal">Partridge Creek</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">
                Step inside our showroom.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                Come in and browse anytime, or book a one-on-one appointment for expert fit help,
                tailoring, formalwear, and recommendations prepared around your size and occasion.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Walk-ins welcome", "Personal fittings", "Tailoring available"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-deep-teal/15 bg-deep-teal/7 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-deep-teal uppercase"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <ButtonLink href="/schedule-appointment" size="lg" className="w-full sm:w-auto">
                Book Appointment
              </ButtonLink>
              <ButtonLink
                href="/location/partridge-creek"
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Store Details &amp; Directions
              </ButtonLink>
            </div>
          </div>

          <ShowroomGallery
            photos={partridgeCreekShowroomPhotos}
            visibleCount={3}
            className="mt-8"
          />
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container className="max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div
            id="locations"
            className="grid scroll-mt-28 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
          >
            <div className="max-w-3xl">
              <Badge variant="teal">Visit J. Barbaro</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">
                Plan your visit to Partridge Creek.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                Stop in to browse, get fitted, or book ahead and our team will prepare options for
                your size, style, and occasion. Our Great Lakes Crossing location is also available
                when it is more convenient.
              </p>
            </div>
            <ButtonLink
              href="/location/partridge-creek"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Partridge Creek Details
            </ButtonLink>
          </div>

          <div className="mt-8 overflow-hidden border-y border-ink/15 bg-white">
            {locations.map((location) => {
              const isPartridgeCreek = location.slug === "partridge-creek";

              return (
                <article
                  key={location.slug}
                  className={`grid gap-6 border-b border-ink/15 px-5 last:border-b-0 sm:px-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center ${
                    isPartridgeCreek ? "py-8 sm:py-10" : "bg-stone/45 py-6 sm:py-7"
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-semibold tracking-[0.16em] text-deep-teal uppercase">
                        {isPartridgeCreek ? "Partridge Creek showroom" : "Additional location"}
                      </p>
                      <LocationOpenBadge location={location} />
                    </div>

                    <h3
                      className={`mt-3 font-heading text-ink ${
                        isPartridgeCreek ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
                      }`}
                    >
                      {location.name}
                    </h3>

                    <div className="mt-4 flex flex-col gap-3 text-sm text-smoke sm:flex-row sm:flex-wrap sm:gap-x-7">
                      <p className="flex max-w-xl gap-2 leading-6">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" />
                        {location.address}
                      </p>
                      <a
                        href={formatPhone(location.phone)}
                        className="inline-flex items-center gap-2 font-semibold text-deep-teal transition-colors hover:text-ink"
                      >
                        <Phone className="h-4 w-4" />
                        {location.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                    <ButtonLink
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant={isPartridgeCreek ? "teal" : "secondary"}
                      size="sm"
                      className="w-full rounded-none sm:w-auto"
                    >
                      Directions
                    </ButtonLink>
                    <ButtonLink
                      href={`/location/${location.slug}`}
                      variant="secondary"
                      size="sm"
                      className="w-full rounded-none sm:w-auto"
                    >
                      Store Details
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="A" background="ivory">
        <Container className="max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <Badge variant="gold">Why J. Barbaro</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">
                Menswear, made personal.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-smoke sm:text-base">
                Shop premium menswear online with fit guidance when you need it, backed by two Metro
                Detroit stores and a team that knows the product.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/shop" className="w-full sm:w-auto">
                  Shop Menswear
                </ButtonLink>
                <ButtonLink href="/services" variant="secondary" className="w-full sm:w-auto">
                  Explore Services
                </ButtonLink>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  title: "Expert fit guidance",
                  copy: "Use Smart Fit online or work one-on-one with our in-store team.",
                  icon: Ruler,
                },
                {
                  title: "Curated designer brands",
                  copy: "Premium labels selected for fit, fabric, versatility, and lasting wear.",
                  icon: Tags,
                },
                {
                  title: "Two local showrooms",
                  copy: "Visit Partridge Creek or Great Lakes Crossing for personal service.",
                  icon: Store,
                },
                {
                  title: "Secure online checkout",
                  copy: "Shop confidently with encrypted, Shopify-powered payment processing.",
                  icon: ShieldCheck,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm shadow-ink/[0.03] sm:p-5"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-deep-teal/10 text-deep-teal sm:h-10 sm:w-10">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="mt-3 text-sm leading-5 font-semibold text-ink sm:mt-4 sm:text-base sm:leading-6">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-5 text-smoke sm:mt-2 sm:leading-6">
                      {item.copy}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
