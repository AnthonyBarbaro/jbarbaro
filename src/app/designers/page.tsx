import Image from "next/image";
import Link from "next/link";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { featuredBrands } from "@/data/brands";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { getShopBrands, type ShopBrand } from "@/lib/shopify/brands";
import { pageContent } from "@/lib/site-content";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const { designersPage } = pageContent;

export const metadata = buildMetadata({
  title: designersPage.metaTitle,
  description: designersPage.metaDescription,
  path: "/designers",
});
export const revalidate = 300;

export default async function DesignersHubPage() {
  let shopBrands: ShopBrand[] = [];

  try {
    shopBrands = await getShopBrands();
  } catch (error) {
    console.error("Unable to load Shopify brands for /designers.", error);
  }

  const shoppableEditorialSlugs = new Set(
    shopBrands
      .map((brand) => brand.presentation?.slug)
      .filter((slug): slug is string => Boolean(slug)),
  );
  const spotlightShopBrands = shopBrands.slice(0, 8);
  const brandListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Designer brands at J. Barbaro Clothiers",
    itemListElement: [
      ...shopBrands.map((brand) => ({
        name: brand.name,
        url: absoluteUrl(`/shop/brands/${brand.slug}`),
      })),
      ...featuredBrands
        .filter((brand) => !shoppableEditorialSlugs.has(brand.slug))
        .map((brand) => ({
          name: brand.name,
          url: absoluteUrl(`/collection-brand/${brand.slug}`),
        })),
    ].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };

  return (
    <>
      <SeoJsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Designers", path: "/designers" },
          ]),
          brandListJsonLd,
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Designers", href: "/designers" },
        ]}
      />

      <PageHero
        title={designersPage.hero.title}
        description={designersPage.hero.description}
        ctaHref="/shop/brands"
        ctaLabel="Shop Brands Online"
        secondaryHref={designersPage.hero.ctaPrimary.href}
        secondaryLabel={designersPage.hero.ctaPrimary.label}
      />

      {spotlightShopBrands.length > 0 ? (
        <WaveSection topWave="A" background="ivory">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="teal">Available Online</Badge>
                <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">Shop designer brands online.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                  These labels are in stock and ready to ship from the online shop right now.
                </p>
              </div>
              <ButtonLink href="/shop/brands" variant="secondary" className="w-full sm:w-auto">
                All Online Brands
              </ButtonLink>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:gap-4">
              {spotlightShopBrands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/shop/brands/${brand.slug}`}
                  className="group overflow-hidden rounded-lg border border-ink/10 bg-white transition-colors duration-200 hover:border-gold/50"
                >
                  <div className="relative aspect-[4/3] border-b border-ink/8 bg-white">
                    {brand.presentation?.logo ? (
                      <Image
                        src={brand.presentation.logo}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : brand.image ? (
                      <Image
                        src={brand.image.url}
                        alt={`${brand.name} product available online`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-heading text-3xl text-ink/35">
                        {brand.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-deep-teal sm:text-base">
                        {brand.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-smoke">
                        Shop {brand.productCount} item{brand.productCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-deep-teal/20 bg-deep-teal/8 px-2.5 py-1 text-xs font-semibold tracking-[0.1em] text-deep-teal uppercase">
                      Online
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </WaveSection>
      ) : null}

      <WaveSection topWave={spotlightShopBrands.length > 0 ? "C" : "A"} background="stone">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="gold">In-Store Collections</Badge>
              <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">{designersPage.popularHeading}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                Explore designer profiles carried across our Metro Detroit stores, then book a visit and we will
                prepare options in your size.
              </p>
            </div>
            <ButtonLink href="/designers/all-designer-brands" variant="secondary" className="w-full sm:w-auto">
              Browse All Designers
            </ButtonLink>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 xl:gap-4">
            {featuredBrands.slice(0, 8).map((brand) => (
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
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-md border border-white/45 bg-white/88 p-3 shadow-[0_18px_40px_-26px_rgba(14,23,38,0.55)] backdrop-blur-sm sm:p-4">
                    <div className="relative h-12 sm:h-16">
                      <Image src={brand.logo} alt={`${brand.name} logo`} fill sizes="180px" className="object-contain" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
                    <h3 className="text-xs font-semibold tracking-[0.12em] text-white uppercase">{brand.name}</h3>
                    {shoppableEditorialSlugs.has(brand.slug) ? (
                      <span className="rounded-full bg-white/92 px-2 py-0.5 text-xs font-semibold tracking-[0.1em] text-deep-teal uppercase">
                        Shop Online
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="ivory">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            {designersPage.cards.map((card, index) => {
              const isInkCard = index === designersPage.cards.length - 1;

              return (
                <Card key={card.title} tone={isInkCard ? "ink" : "ivory"}>
                  <CardContent>
                    {card.badge ? <Badge variant={index === 0 ? "teal" : "gold"}>{card.badge}</Badge> : null}
                    <h2 className={`mt-4 font-heading text-2xl sm:text-3xl ${isInkCard ? "text-ivory" : "text-ink"}`}>
                      {card.title}
                    </h2>
                    <p className={`mt-3 text-sm leading-7 ${isInkCard ? "text-ivory/82" : "text-smoke"}`}>
                      {card.description}
                    </p>
                    {card.buttonHref && card.buttonLabel ? (
                      <ButtonLink
                        href={card.buttonHref}
                        variant={isInkCard ? "teal" : "secondary"}
                        className="mt-5"
                      >
                        {card.buttonLabel}
                      </ButtonLink>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-10 rounded-lg border border-ink/10 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-2xl text-ink sm:text-3xl">Ready to shop the collection?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-smoke">
                  Browse every designer piece available online, or filter the shop by brand, size, and price.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/shop" className="w-full sm:w-auto">
                  Shop All Products
                </ButtonLink>
                <ButtonLink href="/shop/brands" variant="secondary" className="w-full sm:w-auto">
                  Shop by Brand
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
