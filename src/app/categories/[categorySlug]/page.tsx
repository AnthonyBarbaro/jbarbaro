import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";

import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { menCategoryMap } from "@/data/men-categories";
import { absoluteUrl, buildMetadata, defaultKeywords } from "@/lib/seo";
import { resolveMenCategories, resolveMenCategory } from "@/lib/shopify/men-categories";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

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

function getCategoryDisplayName(slug: string, fallbackName: string) {
  return menCategoryMap[slug]?.name ?? fallbackName;
}

function getCategoryKeywords(slug: string, fallbackName: string) {
  const name = getCategoryDisplayName(slug, fallbackName);
  const normalizedName = name.toLocaleLowerCase();

  return Array.from(
    new Set([
      `men's ${normalizedName}`,
      `shop ${normalizedName} online`,
      `${normalizedName} Metro Detroit`,
      `${name} at J. Barbaro Clothiers`,
      ...defaultKeywords,
    ]),
  );
}

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

  const categoryName = getCategoryDisplayName(category.slug, category.name);
  const categoryImage =
    category.shopifyCollection?.image?.url ??
    category.shopifyCollection?.products[0]?.featuredImage?.url;

  return buildMetadata({
    title: `Shop Men's ${categoryName} Online`,
    description: category.longDescription,
    path: category.href,
    image: categoryImage,
    keywords: getCategoryKeywords(category.slug, category.name),
  });
}

export default async function MenCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const redirectPath = categoryRedirects[categorySlug];

  if (redirectPath) {
    permanentRedirect(redirectPath);
  }

  const category = await resolveMenCategory(categorySlug, 250, true);

  if (!category) {
    notFound();
  }

  const products = category.shopifyCollection?.products ?? [];
  const categoryName = getCategoryDisplayName(category.slug, category.name);
  const heroDescription =
    category.shopifyCollection?.description.trim() || category.longDescription;
  const productListId = absoluteUrl(`${category.href}#products`);
  const breadcrumbId = absoluteUrl(`${category.href}#breadcrumb`);
  const categoryBreadcrumbJsonLd = {
    ...breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Categories", path: "/categories" },
      { name: categoryName, path: category.href },
    ]),
    "@id": breadcrumbId,
  };
  const productItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": productListId,
    name: `${categoryName} products`,
    numberOfItems: products.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: products.slice(0, 36).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@id": absoluteUrl(`/shop/${product.handle}#product`),
        name: product.title,
        url: absoluteUrl(`/shop/${product.handle}`),
      },
    })),
  };
  const categoryPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": absoluteUrl(`${category.href}#collection`),
    url: absoluteUrl(category.href),
    name: `Shop Men's ${categoryName} Online`,
    description: heroDescription,
    inLanguage: "en-US",
    isPartOf: {
      "@id": absoluteUrl("/#website"),
    },
    publisher: {
      "@id": absoluteUrl("/#organization"),
    },
    breadcrumb: {
      "@id": breadcrumbId,
    },
    mainEntity: {
      "@id": productListId,
    },
  };

  return (
    <>
      <SeoJsonLd data={[categoryBreadcrumbJsonLd, categoryPageJsonLd, productItemListJsonLd]} />
      <section className="border-b border-ink/10 bg-ivory">
        <Container className="py-6 sm:py-8">
          <h1 className="font-heading text-4xl text-ink sm:text-5xl">{categoryName}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-smoke">{heroDescription}</p>
          <p className="mt-2 text-sm text-smoke">
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
        </Container>
      </section>

      <section
        className="bg-stone/45 py-6 sm:py-8 lg:py-10"
        aria-labelledby="category-products-heading"
      >
        <h2 id="category-products-heading" className="sr-only">
          Shop {categoryName} products
        </h2>
        {products.length > 0 ? (
          <Suspense fallback={null}>
            <ShopCatalogClient products={products} productHeadingLevel="h3" />
          </Suspense>
        ) : (
          <Container>
            <Card>
              <CardContent>
                <h2 className="font-heading text-3xl text-ink">More pieces are arriving soon.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke">
                  This category is still being connected to live products. Browse all products or
                  book an appointment for a prepared pull list.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/shop" className="w-full sm:w-auto">
                    Browse Shop
                  </ButtonLink>
                  <ButtonLink
                    href="/schedule-appointment"
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
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
