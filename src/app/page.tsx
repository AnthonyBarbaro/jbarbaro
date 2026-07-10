import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Phone } from "lucide-react";

import { HeroCarousel } from "@/components/home/HeroCarousel";
import { LocationOpenBadge } from "@/components/locations/LocationOpenBadge";
import { NewsletterSignup } from "@/components/marketing/NewsletterSignup";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { brands } from "@/data/brands";
import { locations } from "@/data/locations";
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

const storefrontCategories = [
  {
    label: "Suits",
    href: "/categories/suits-sports-coats",
    matches: ["suits", "suits sports coats", "suits-sports-coats"],
    image: "/images/remote/www.jasonbarbaro.com/assets/media/2020/05/t002.jpg",
    description: "Shop tailored suits, sport coats, and polished separates.",
  },
  {
    label: "Shirts",
    href: "/categories/dress-shirts",
    matches: ["shirts", "dress shirts", "casual shirts", "dress-shirts"],
    image: "/images/remote/www.jasonbarbaro.com/assets/media/2020/02/eton-012220-114-500x500.jpg",
    description: "Find dress shirts, sport shirts, and refined everyday layers.",
  },
  {
    label: "Shoes",
    href: "/categories/footwear",
    matches: ["shoes", "footwear"],
    image: "/images/remote/www.jasonbarbaro.com/assets/media/2022/01/swims-131051-024-500x500.jpg",
    description: "Finish the look with premium shoes and casual footwear.",
  },
  {
    label: "Accessories",
    href: "/categories/accessories",
    matches: ["accessories", "neckwear"],
    image: "/images/remote/www.jasonbarbaro.com/assets/media/2020/02/tateossian-111716-278-500x500.jpg",
    description: "Shop ties, pocket squares, belts, socks, and finishing details.",
  },
  {
    label: "Formalwear",
    href: "/categories/formalwear",
    matches: ["formalwear", "tuxedo", "tuxedos"],
    image: "/images/campaign/formalwear-nav-v2.webp",
    description: "Explore tuxedos, event dressing, and formal accessories.",
  },
] as const;
const inStoreBrandSlugs = ["7-downie-st", "7-for-all-mankind", "ag-jeans", "alberto", "brax", "canali", "ermenegildo-zegna", "eton"];
const inStoreBrands = inStoreBrandSlugs
  .map((slug) => brands.find((brand) => brand.slug === slug))
  .filter((brand): brand is (typeof brands)[number] => Boolean(brand));

function normalizeCategory(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getCategoryImage(category: ResolvedCategory | null, fallbackImage: string) {
  return category?.shopifyCollection?.image?.url ?? category?.shopifyCollection?.products[0]?.featuredImage?.url ?? fallbackImage;
}

function getStorefrontCategories(categories: ResolvedCategory[]) {
  return storefrontCategories.map((target) => {
    const matchedCategory =
      categories.find((category) => {
        const normalizedName = normalizeCategory(category.name);
        const normalizedSlug = normalizeCategory(category.slug);

        return target.matches.some((match) => {
          const normalizedMatch = normalizeCategory(match);
          return normalizedName === normalizedMatch || normalizedSlug === normalizedMatch;
        });
      }) ?? null;

    return {
      ...target,
      href: matchedCategory?.href || target.href,
      name: target.label,
      image: getCategoryImage(matchedCategory, target.image),
      description: target.description,
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
  const resolvedCategories = await resolveMenCategories(24, 2);
  const categories = getStorefrontCategories(resolvedCategories);
  let bestSellers: ShopifyProduct[] = [];
  let newArrivals: ShopifyProduct[] = [];

  try {
    bestSellers = availableProducts(await getBestSellingProducts(4)).slice(0, 4);
  } catch (error) {
    console.error("Unable to load homepage best sellers.", error);
  }

  try {
    newArrivals = availableProducts(await getShopProducts(8)).slice(0, 4);
  } catch (error) {
    console.error("Unable to load homepage new arrivals.", error);
  }

  if (bestSellers.length === 0 && newArrivals.length > 0) {
    bestSellers = newArrivals.slice(0, 4);
  }

  newArrivals = uniqueProducts(newArrivals.filter((product) => !bestSellers.some((item) => item.id === product.id))).slice(0, 4);

  return (
    <>
      <HeroCarousel
        slides={homePage.heroSlides}
        badges={homePage.heroBadges}
        secondaryCta={homePage.heroCtas[1] ?? { label: "Book Appointment", href: "/schedule-appointment" }}
      />

      <WaveSection topWave="A" background="ivory">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="teal">Shop by Category</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">Start with what you need.</h2>
            </div>
            <ButtonLink href="/shop" variant="secondary" className="w-full sm:w-auto">
              Shop All
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <Link key={category.label} href={category.href} className="group block h-full">
                <Card className="h-full overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:border-gold/40">
                  <div className="relative aspect-[4/5] bg-stone">
                    <Image
                      src={category.image}
                      alt={`${category.name} category`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/18 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="font-heading text-3xl text-white">{category.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/78">{category.description}</p>
                    </div>
                    <span className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/30 bg-white/12 text-white backdrop-blur transition-transform group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="gold">Featured Products</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">Best Sellers</h2>
            </div>
            <ButtonLink href="/shop" variant="secondary" className="w-full sm:w-auto">
              View Shop
            </ButtonLink>
          </div>

          {bestSellers.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {bestSellers.map((product) => (
                <ShopProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="mt-8 bg-white">
              <CardContent>
                <h3 className="font-heading text-3xl text-ink">Products are refreshing.</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke">
                  Browse categories or book an appointment and we will prepare options for your size, occasion, and fit goals.
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
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">New Arrivals</p>
                  <h2 className="mt-2 font-heading text-3xl text-ink sm:text-4xl">Fresh on the Floor</h2>
                </div>
                <Link href="/shop" className="text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold">
                  Shop All
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

      <WaveSection topWave="A" background="ink">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge variant="gold">Fit Help</Badge>
              <h2 className="mt-4 font-heading text-4xl text-white sm:text-5xl">Need help finding the right fit?</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 sm:text-base sm:leading-8">
                Book a store appointment for suits, formalwear, tailoring, and product recommendations prepared around your size and occasion.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <ButtonLink href="/schedule-appointment" size="lg" className="w-full sm:w-auto">
                Book Appointment
              </ButtonLink>
              <ButtonLink
                href="/tailored-clothing"
                variant="secondary"
                size="lg"
                className="w-full border-white/70 bg-transparent text-white hover:border-gold hover:bg-transparent hover:text-gold sm:w-auto"
              >
                Tailoring
              </ButtonLink>
            </div>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="ivory">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="teal">Visit a Store</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">Shop in person today.</h2>
            </div>
            <ButtonLink href="/locations" variant="secondary" className="w-full sm:w-auto">
              All Locations
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {locations.map((location) => (
              <Card key={location.slug} className="h-full bg-white">
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-heading text-3xl text-ink">{location.name}</h3>
                      <p className="mt-2 flex max-w-md gap-2 text-sm leading-7 text-smoke">
                        <MapPin className="mt-1 h-4 w-4 shrink-0 text-deep-teal" />
                        {location.address}
                      </p>
                      <a href={formatPhone(location.phone)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-deep-teal hover:text-gold">
                        <Phone className="h-4 w-4" />
                        {location.phone}
                      </a>
                      <div className="mt-4">
                        <LocationOpenBadge location={location} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <ButtonLink href={`/location/${location.slug}`} variant="secondary" size="sm" className="w-full sm:w-auto">
                        Details
                      </ButtonLink>
                      <ButtonLink
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="teal"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        Directions
                      </ButtonLink>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 border-t border-ink/10 pt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="gold">In-Store Designers</Badge>
                <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">Brands carried in store.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                  Visit J. Barbaro for premium menswear labels selected for fit, fabric, and wardrobe longevity.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/designers/all-designer-brands" variant="secondary" className="w-full sm:w-auto">
                  Browse Designers
                </ButtonLink>
                <ButtonLink href="/schedule-appointment" variant="teal" className="w-full sm:w-auto">
                  Book Visit
                </ButtonLink>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {inStoreBrands.map((brand) => (
                <Link key={brand.slug} href={`/collection-brand/${brand.slug}`} className="group block">
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
                        <Image src={brand.logo} alt={`${brand.name} logo`} fill sizes="180px" className="object-contain" />
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="text-center text-xs font-semibold tracking-[0.12em] text-white uppercase">{brand.name}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-smoke">
              Brand selection and inventory vary by location. Book ahead and our team can prepare options around your size and occasion.
            </p>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="A" background="stone">
        <Container>
          <Card className="bg-white">
            <CardContent className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <Badge variant="gold">New Arrivals</Badge>
                <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">Get new arrivals and private event updates.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke">
                  One email field. No popups. Just product drops, private events, and appointment reminders when they matter.
                </p>
              </div>
              <NewsletterSignup source="homepage" />
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
