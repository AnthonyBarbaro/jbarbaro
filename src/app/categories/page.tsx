import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ShoppingBag } from "lucide-react";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { resolveMenCategories } from "@/lib/shopify/men-categories";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const revalidate = 300;

type CollectionCategory = Awaited<ReturnType<typeof resolveMenCategories>>[number];

const categoryPriority = [
  "suits",
  "sport coats",
  "shirts",
  "pants",
  "shoes",
  "denim",
  "outerwear",
  "formalwear",
  "accessories",
] as const;

export const metadata = buildMetadata({
  title: "Categories",
  description: "Shop J. Barbaro Clothiers by category, including suits, formalwear, shirts, footwear, trousers, denim, and accessories.",
  path: "/categories",
});

function normalizeCategoryName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function orderCategories(categories: CollectionCategory[]) {
  return [...categories].sort((left, right) => {
    const leftName = normalizeCategoryName(left.name);
    const leftSlug = normalizeCategoryName(left.slug);
    const rightName = normalizeCategoryName(right.name);
    const rightSlug = normalizeCategoryName(right.slug);
    const leftIndex = categoryPriority.findIndex((item) => leftName === item || leftSlug === item);
    const rightIndex = categoryPriority.findIndex((item) => rightName === item || rightSlug === item);

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

function getCategoryImage(category: CollectionCategory) {
  return category.shopifyCollection?.image ?? category.shopifyCollection?.products[0]?.featuredImage ?? null;
}

export default async function CategoriesHubPage() {
  const categories = orderCategories(
    (await resolveMenCategories(32, 1)).filter((category) => {
      const name = normalizeCategoryName(category.name);
      const slug = normalizeCategoryName(category.slug);

      return name !== "shop all" && slug !== "all";
    }),
  );
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Categories", href: "/categories" },
  ];

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
        ])}
      />
      <Breadcrumbs items={crumbs} />

      <section className="border-b border-ink/10 bg-ivory">
        <Container className="py-8 sm:py-10 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Categories</p>
              <h1 className="mt-3 font-heading text-4xl text-ink sm:text-5xl">Shop by Category</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-smoke">
                Browse the store by the way men actually shop: tailoring, shirts, footwear, denim, layers, and finishing pieces.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/shop" className="w-full sm:w-auto">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Shop All
              </ButtonLink>
              <ButtonLink href="/schedule-appointment" variant="secondary" className="w-full sm:w-auto">
                <CalendarDays className="mr-2 h-4 w-4" />
                Book Appointment
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-stone/45 py-8 sm:py-10 lg:py-12">
        <Container>
          {categories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((category) => {
                const categoryImage = getCategoryImage(category);

                return (
                  <Link key={category.slug} href={category.href} className="group block h-full">
                    <Card className="h-full overflow-hidden bg-white transition-colors hover:border-ink/20">
                      <div className="relative aspect-[4/3] overflow-hidden border-b border-ink/10 bg-stone">
                        {categoryImage ? (
                          <Image
                            src={categoryImage.url}
                            alt={categoryImage.altText || `${category.name} category`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-smoke">Category image coming soon</div>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-deep-teal uppercase">Category</p>
                            <h2 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-ink">{category.name}</h2>
                          </div>
                          <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ink/10 text-ink transition-colors group-hover:border-gold group-hover:text-gold">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-smoke">{category.shortDescription}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent>
                <h2 className="font-heading text-3xl text-ink">Categories are being updated.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke">
                  Browse all products while the category list refreshes, or book an appointment for a prepared selection.
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
      </section>

      <section className="border-t border-ink/10 bg-white py-8 sm:py-10">
        <Container>
          <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-ivory p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Fit Help</p>
              <h2 className="mt-2 font-heading text-3xl text-ink">Need the right category for an event?</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-smoke">
                Book a store appointment and the team can prepare sizes, shoes, shirts, and finishing pieces before you arrive.
              </p>
            </div>
            <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
              Book Appointment
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
