import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, ShoppingBag } from "lucide-react";

import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { resolveMenCategories, resolveMenCategory } from "@/lib/shopify/men-categories";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const revalidate = 300;

const categoryRedirects: Record<string, string> = {
  all: "/shop",
  "casual-shirts": "/categories/shirts",
  "dress-pants": "/categories/pants",
  "dress-shirts": "/categories/shirts",
  footwear: "/categories/shoes",
  "sport-jacket": "/categories/sport-coats",
  "suits-sports-coats": "/categories/suits",
  trousers: "/categories/pants",
  tuxedo: "/categories/formalwear",
};

export async function generateStaticParams() {
  const categories = await resolveMenCategories(40, 1);
  return categories.map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const redirectPath = categoryRedirects[categorySlug];
  const canonicalSlug = redirectPath?.startsWith("/categories/")
    ? redirectPath.replace("/categories/", "")
    : categorySlug;
  const category = await resolveMenCategory(canonicalSlug, 1);

  if (!category) {
    return {};
  }

  return buildMetadata({
    title: `Shop ${category.name}`,
    description: category.longDescription,
    path: category.href,
  });
}

export default async function MenCategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const redirectPath = categoryRedirects[categorySlug];

  if (redirectPath) {
    redirect(redirectPath);
  }

  const category = await resolveMenCategory(categorySlug, 250);

  if (!category) {
    notFound();
  }

  const products = category.shopifyCollection?.products ?? [];
  const relatedCategories = (await resolveMenCategories(24, 1)).filter((item) => item.href !== category.href).slice(0, 8);
  const heroDescription = category.shopifyCollection?.description.trim() || category.longDescription;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Categories", href: "/categories" },
    { name: category.name, href: category.href },
  ];
  const productItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} products`,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: absoluteUrl(`/shop/${product.handle}`),
    })),
  };

  return (
    <>
      <SeoJsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Categories", path: "/categories" },
            { name: category.name, path: category.href },
          ]),
          productItemListJsonLd,
        ]}
      />
      <Breadcrumbs items={crumbs} />

      <section className="border-b border-ink/10 bg-ivory">
        <Container className="py-8 sm:py-10 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Category</p>
              <h1 className="mt-3 font-heading text-4xl text-ink sm:text-5xl">Shop {category.name}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-smoke">{heroDescription}</p>
              <p className="mt-3 text-sm text-smoke">
                {products.length} {products.length === 1 ? "item" : "items"} loaded from this category.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/shop" variant="secondary" className="w-full sm:w-auto">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Shop All
              </ButtonLink>
              <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
                <CalendarDays className="mr-2 h-4 w-4" />
                Book Appointment
              </ButtonLink>
            </div>
          </div>

          {relatedCategories.length > 0 ? (
            <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {relatedCategories.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-10 shrink-0 items-center rounded-md border border-ink/10 bg-white px-4 text-xs font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-gold hover:text-gold"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          ) : null}
        </Container>
      </section>

      <section className="bg-stone/45 py-8 sm:py-10 lg:py-12">
        {products.length > 0 ? (
          <Suspense fallback={null}>
            <ShopCatalogClient products={products} />
          </Suspense>
        ) : (
          <Container>
            <Card>
              <CardContent>
                <h2 className="font-heading text-3xl text-ink">More pieces are arriving soon.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke">
                  This category is still being connected to live products. Browse all products or book an appointment for a prepared pull list.
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
          </Container>
        )}
      </section>
    </>
  );
}
