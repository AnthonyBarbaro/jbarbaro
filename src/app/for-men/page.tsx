import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";
import { resolveMenCategories } from "@/lib/shopify/men-categories";

const { forMenPage } = pageContent;
export const revalidate = 300;

type CollectionCategory = Awaited<ReturnType<typeof resolveMenCategories>>[number];
const collectionPriority = ["shop all", "suits", "tuxedo", "sports jacket", "sports coat", "shirts", "accessories"] as const;

export const metadata = buildMetadata({
  title: forMenPage.metaTitle,
  description: forMenPage.metaDescription,
  path: "/for-men",
});

function normalizeCollectionName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function orderCollections(categories: CollectionCategory[]) {
  return [...categories].sort((left, right) => {
    const leftName = normalizeCollectionName(left.name);
    const leftSlug = normalizeCollectionName(left.slug);
    const rightName = normalizeCollectionName(right.name);
    const rightSlug = normalizeCollectionName(right.slug);

    const leftIndex = collectionPriority.findIndex((item) =>
      item === "sports coat"
        ? leftName === "sports jacket" || leftName === "sports coat" || leftSlug === "sports jacket"
        : leftName === item || leftSlug === item,
    );
    const rightIndex = collectionPriority.findIndex((item) =>
      item === "sports coat"
        ? rightName === "sports jacket" || rightName === "sports coat" || rightSlug === "sports jacket"
        : rightName === item || rightSlug === item,
    );

    if (leftIndex === -1 && rightIndex === -1) {
      return left.name.localeCompare(right.name);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

function getCollectionImage(category: CollectionCategory) {
  return category.shopifyCollection?.image ?? category.shopifyCollection?.products[0]?.featuredImage ?? null;
}

export default async function ForMenHubPage() {
  const categories = orderCollections(await resolveMenCategories(24, 3));
  const featuredCollections = categories.slice(0, 3);
  const leadCollection = featuredCollections[0] ?? null;
  const supportingCollections = featuredCollections.slice(1);

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink/8 bg-ink text-ivory">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(199,164,106,0.22),_transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_88%,_rgba(15,91,91,0.28),_transparent_42%)]" />
        <Container className="relative py-12 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
            <div>
              <Badge
                variant="gold"
                className="border-gold/95 bg-gold px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[0.13em] text-ink shadow-[0_10px_26px_-16px_rgba(0,0,0,0.9)] sm:text-xs"
              >
                Collections
              </Badge>
              <h1 className="mt-5 max-w-3xl font-heading text-4xl leading-[0.98] text-ivory sm:text-6xl lg:text-[4.4rem]">
                {forMenPage.hero.title}
              </h1>
              <p className="mt-5 max-w-2xl text-[1rem] leading-7 text-ivory/80 sm:text-lg sm:leading-8">
                {forMenPage.hero.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={forMenPage.hero.ctaPrimary.href} className="w-full sm:w-auto">
                  {forMenPage.hero.ctaPrimary.label}
                </ButtonLink>
                <ButtonLink
                  href="/schedule-appointment"
                  variant="secondary"
                  className="w-full border-ivory/70 text-ivory hover:border-gold hover:text-gold sm:w-auto"
                >
                  Book Styling Appointment
                </ButtonLink>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/12 bg-white/6 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Live Now</p>
                  <p className="mt-2 font-heading text-3xl">{categories.length}</p>
                  <p className="mt-1 text-sm text-ivory/72">Collection{categories.length === 1 ? "" : "s"} ready to browse.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/12 bg-white/6 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Top Entry</p>
                  <p className="mt-2 font-heading text-3xl">{leadCollection?.name || "Shop"}</p>
                  <p className="mt-1 text-sm text-ivory/72">Start with the strongest collection edit first.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/12 bg-white/6 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Best Next Step</p>
                  <p className="mt-2 font-heading text-3xl">1:1</p>
                  <p className="mt-1 text-sm text-ivory/72">Book a pull-list appointment when you want more direction.</p>
                </div>
              </div>
            </div>

            {featuredCollections.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {leadCollection ? (
                  <Link
                    href={leadCollection.href}
                    className="group relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/6 shadow-[0_32px_60px_-38px_rgba(0,0,0,0.65)] sm:col-span-2 lg:row-span-2"
                  >
                    <div className="relative aspect-[16/10] lg:aspect-[16/12]">
                      {getCollectionImage(leadCollection) ? (
                        <>
                          <Image
                            src={getCollectionImage(leadCollection)!.url}
                            alt={getCollectionImage(leadCollection)!.altText || `${leadCollection.name} collection`}
                            fill
                            sizes="(max-width: 1024px) 100vw, 52vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink/78 via-ink/26 to-transparent" />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center bg-white/10 text-sm text-ivory/70">Collection image coming soon</div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">Featured Collection</p>
                        <div className="mt-3 flex items-end justify-between gap-4">
                          <div>
                            <h2 className="font-heading text-3xl text-ivory sm:text-5xl">{leadCollection.name}</h2>
                            <p className="mt-2 max-w-xl text-sm leading-7 text-ivory/74 sm:text-base">{leadCollection.shortDescription}</p>
                          </div>
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur transition-transform duration-300 group-hover:translate-x-1">
                            <ArrowRight className="h-5 w-5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : null}

                {supportingCollections.map((collection) => (
                  <Link
                    key={collection.href}
                    href={collection.href}
                    className="group relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/6 shadow-[0_24px_44px_-34px_rgba(0,0,0,0.52)]"
                  >
                    <div className="relative aspect-[4/3]">
                      {getCollectionImage(collection) ? (
                        <>
                          <Image
                            src={getCollectionImage(collection)!.url}
                            alt={getCollectionImage(collection)!.altText || `${collection.name} collection`}
                            fill
                            sizes="(max-width: 1024px) 50vw, 26vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink/78 via-ink/20 to-transparent" />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center bg-white/10 text-sm text-ivory/70">Collection image coming soon</div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold tracking-[0.16em] text-gold uppercase">Available Now</p>
                            <h3 className="mt-2 font-heading text-2xl text-ivory">{collection.name}</h3>
                          </div>
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur transition-transform duration-300 group-hover:translate-x-1">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          {categories.length > 0 ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Badge variant="teal">Live Collections</Badge>
                  <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">Browse Every Collection</h2>
                </div>
                <ButtonLink href="/shop" variant="secondary" className="w-full sm:w-auto">
                  Browse All Products
                </ButtonLink>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => {
                  const categoryImage = getCollectionImage(category);
                  const previewCount = category.shopifyCollection?.products.length ?? 0;

                  return (
                    <Link key={category.slug} href={category.href} className="group block h-full">
                      <Card className="h-full overflow-hidden border-ink/8 bg-white/94 transition-all duration-300 hover:-translate-y-1 hover:border-gold/35 hover:shadow-[0_32px_58px_-40px_rgba(14,23,38,0.28)]">
                        <div className="relative aspect-[4/3] overflow-hidden border-b border-ink/8 bg-stone">
                          {categoryImage ? (
                            <>
                              <Image
                                src={categoryImage.url}
                                alt={categoryImage.altText || `${category.name} collection`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/18 to-transparent" />
                            </>
                          ) : (
                            <div className="flex h-full items-center justify-center bg-stone text-sm text-smoke">Collection image coming soon</div>
                          )}

                          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                            <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-ivory uppercase backdrop-blur">
                              Available Now
                            </span>
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-ivory backdrop-blur transition-transform duration-300 group-hover:translate-x-1">
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>

                          <div className="absolute inset-x-0 bottom-0 p-5">
                            <h3 className="font-heading text-3xl text-ivory sm:text-[2.2rem]">{category.name}</h3>
                          </div>
                        </div>

                        <CardContent className="p-5 sm:p-6">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-deep-teal uppercase">
                              {previewCount > 0 ? `${previewCount} product preview${previewCount === 1 ? "" : "s"}` : "Collection Edit"}
                            </p>
                            <span className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">Open</span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-smoke">{category.shortDescription}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <Card>
              <CardContent>
                <Badge variant="teal">Live Updates</Badge>
                <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">Fresh collections are being updated now.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-smoke">
                  Browse the main shop for the latest arrivals, or book an appointment and we&apos;ll prepare a focused selection for your visit.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/shop" className="w-full sm:w-auto">
                    Browse Shop
                  </ButtonLink>
                  <ButtonLink href="/schedule-appointment" variant="secondary" className="w-full sm:w-auto">
                    Book Appointment
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          )}
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="ivory">
        <Container>
          <Card className="overflow-hidden bg-ink text-ivory">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-[18rem]">
                {leadCollection && getCollectionImage(leadCollection) ? (
                  <>
                    <Image
                      src={getCollectionImage(leadCollection)!.url}
                      alt={getCollectionImage(leadCollection)!.altText || `${leadCollection.name} collection`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 46vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-ink/25 to-ink/82" />
                  </>
                ) : (
                  <div className="h-full bg-[radial-gradient(circle_at_top,_rgba(199,164,106,0.22),_transparent_44%),linear-gradient(180deg,#0f1723,#121b2a)]" />
                )}
              </div>
              <CardContent className="flex items-center p-6 sm:p-8 lg:p-10">
                <div>
                  <Badge variant="gold">Appointment Support</Badge>
                  <h2 className="mt-4 font-heading text-3xl sm:text-4xl">{forMenPage.closingCardTitle}</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-ivory/82 sm:text-base sm:leading-8">
                    {forMenPage.closingCardDescription}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <ButtonLink href={forMenPage.closingButtonHref} className="w-full sm:w-auto">
                      {forMenPage.closingButtonLabel}
                    </ButtonLink>
                    <ButtonLink
                      href="/shop"
                      variant="secondary"
                      className="w-full border-ivory/70 text-ivory hover:border-gold hover:text-gold sm:w-auto"
                    >
                      Shop All Products
                    </ButtonLink>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
