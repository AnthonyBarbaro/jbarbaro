import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Ruler, ShieldCheck, Store, Tags } from "lucide-react";

import { CollectionRail } from "@/components/home/CollectionRail";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { LocationOpenBadge } from "@/components/locations/LocationOpenBadge";
import { ShowroomGallery } from "@/components/locations/ShowroomGallery";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { brands } from "@/data/brands";
import { locations } from "@/data/locations";
import { partridgeCreekShowroomPhotos } from "@/data/showroom-gallery";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";
import { resolveMenCategories } from "@/lib/shopify/men-categories";
import { getBestSellingProducts, getShopProducts } from "@/lib/shopify/products";
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
const inStoreBrandSlugs = [
  "7-downie-st",
  "7-for-all-mankind",
  "ag-jeans",
  "alberto",
  "brax",
  "canali",
  "ermenegildo-zegna",
  "eton",
];
const inStoreBrands = inStoreBrandSlugs
  .map((slug) => brands.find((brand) => brand.slug === slug))
  .filter((brand): brand is (typeof brands)[number] => Boolean(brand));

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

function availableProducts(products: ShopifyProduct[]) {
  return products.filter((product) => product.variants.some((variant) => variant.availableForSale));
}

function uniqueProducts(products: ShopifyProduct[]) {
  return Array.from(new Map(products.map((product) => [product.id, product])).values());
}

export default async function HomePage() {
  const resolvedCategories = await resolveMenCategories(50, 1);
  const categories = getStorefrontCategories(resolvedCategories);
  let bestSellers: ShopifyProduct[] = [];
  let newArrivals: ShopifyProduct[] = [];

  try {
    bestSellers = uniqueProducts(availableProducts(await getBestSellingProducts(24))).slice(0, 8);
  } catch (error) {
    console.error("Unable to load homepage best sellers.", error);
  }

  try {
    newArrivals = availableProducts(await getShopProducts(24));
  } catch (error) {
    console.error("Unable to load homepage new arrivals.", error);
  }

  newArrivals = uniqueProducts(
    newArrivals.filter((product) => !bestSellers.some((item) => item.id === product.id)),
  ).slice(0, 4);

  return (
    <>
      <HeroCarousel
        slides={homePage.heroSlides}
        badges={homePage.heroBadges}
        secondaryCta={
          homePage.heroCtas[1] ?? { label: "Book Appointment", href: "/schedule-appointment" }
        }
      />

      <WaveSection topWave="A" background="ivory">
        <Container>
          <div>
            <div>
              <Badge variant="teal">Shop by Category</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">
                Start with what you need.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                Browse the online floor by wardrobe need, then narrow by brand, size, color, and
                availability.
              </p>
            </div>
          </div>

          <CollectionRail collections={categories} />
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="gold">Featured Products</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">Best Sellers</h2>
            </div>
            <ButtonLink
              href="/shop?top=best#top-picks"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Shop Best Sellers
            </ButtonLink>
          </div>

          {bestSellers.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {bestSellers.map((product) => (
                <ShopProductCard
                  key={product.id}
                  product={product}
                  imageSizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
            <>
              <div className="mt-12 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">
                    New Arrivals
                  </p>
                  <h2 className="mt-2 font-heading text-3xl text-ink sm:text-4xl">
                    Fresh on the Floor
                  </h2>
                </div>
                <Link
                  href="/shop?top=new#top-picks"
                  className="text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-ink"
                >
                  Shop New Arrivals
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {newArrivals.map((product) => (
                  <ShopProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : null}
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="ivory">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
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
                    className="rounded-full border border-deep-teal/15 bg-deep-teal/7 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-deep-teal uppercase"
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
        <Container>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <Badge variant="teal">Visit J. Barbaro</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">
                Two stores. Personal service at both.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                Stop in to browse, get fitted, or book ahead and our team will prepare options for
                your size, style, and occasion.
              </p>
            </div>
            <ButtonLink href="/locations" variant="secondary" className="w-full sm:w-auto">
              Compare Locations
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {locations.map((location) => (
              <Card
                key={location.slug}
                className="group flex h-full flex-col overflow-hidden bg-white transition-colors hover:border-ink/20"
              >
                <Link
                  href={`/location/${location.slug}`}
                  className="relative block aspect-[16/8] overflow-hidden bg-stone"
                >
                  <Image
                    src={location.photo}
                    alt={location.photoAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/78 via-ink/12 to-transparent" />
                  <span className="absolute top-4 left-4 rounded-full border border-white/25 bg-ink/45 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-white uppercase backdrop-blur">
                    {location.photoLabel}
                  </span>
                  <h3 className="absolute inset-x-0 bottom-0 p-5 font-heading text-3xl text-white sm:text-4xl">
                    {location.name}
                  </h3>
                </Link>

                <CardContent className="flex flex-1 flex-col p-5 sm:p-6">
                  <div>
                    <LocationOpenBadge location={location} />

                    <p className="mt-4 flex max-w-lg gap-2 text-sm leading-7 text-smoke">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-deep-teal" />
                      {location.address}
                    </p>
                    <a
                      href={formatPhone(location.phone)}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-deep-teal hover:text-ink"
                    >
                      <Phone className="h-4 w-4" />
                      {location.phone}
                    </a>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <ButtonLink
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="teal"
                      size="sm"
                      className="w-full"
                    >
                      Directions
                    </ButtonLink>
                    <ButtonLink
                      href={`/location/${location.slug}`}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      Store Details
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 border-t border-ink/10 pt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="gold">In-Store Designers</Badge>
                <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">
                  Brands carried in store.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                  Visit J. Barbaro for premium menswear labels selected for fit, fabric, and
                  wardrobe longevity.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  href="/designers/all-designer-brands"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Browse Designers
                </ButtonLink>
                <ButtonLink
                  href="/schedule-appointment"
                  variant="teal"
                  className="w-full sm:w-auto"
                >
                  Book Visit
                </ButtonLink>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {inStoreBrands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/collection-brand/${brand.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-ink/10 bg-stone shadow-sm shadow-ink/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-gold/50">
                    <Image
                      src={brand.image}
                      alt={`${brand.name} designer collection`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/82 via-ink/20 to-transparent" />
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-md border border-white/45 bg-white/86 p-4 shadow-[0_18px_40px_-26px_rgba(14,23,38,0.55)] backdrop-blur-sm">
                      <div className="relative h-16 sm:h-20">
                        <Image
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          fill
                          sizes="180px"
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="text-center text-xs font-semibold tracking-[0.12em] text-white uppercase">
                        {brand.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-smoke">
              Brand selection and inventory vary by location. Book ahead and our team can prepare
              options around your size and occasion.
            </p>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="A" background="ivory">
        <Container>
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

            <div className="grid gap-3 sm:grid-cols-2">
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
                    className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm shadow-ink/[0.03]"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-deep-teal/10 text-deep-teal">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-smoke">{item.copy}</p>
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
