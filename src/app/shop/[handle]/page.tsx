import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailClient } from "@/components/shop/ProductDetailClient";
import { ProductRecommendationsClient } from "@/components/shop/ProductRecommendationsClient";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { getProductSizeKind, type ProductSizeKind } from "@/lib/fit-profile";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import {
  getBestSellingProducts,
  getProductsByVendor,
  getRecommendedProducts,
  getShopProduct,
  getShopProductPreviews,
} from "@/lib/shopify/products";
import type { ShopifyProduct } from "@/lib/shopify/types";

type ShopProductPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export const revalidate = 300;

function isAvailableProduct(product: ShopifyProduct) {
  return product.variants.some((variant) => variant.availableForSale);
}

function getUniqueProducts(
  products: ShopifyProduct[],
  excludedProduct: ShopifyProduct,
  excludedIds = new Set<string>(),
  excludedHandles = new Set<string>(),
) {
  const seenIds = new Set(excludedIds);
  const seenHandles = new Set([excludedProduct.handle, ...excludedHandles]);

  return products.filter((product) => {
    if (
      product.id === excludedProduct.id ||
      seenIds.has(product.id) ||
      seenHandles.has(product.handle) ||
      !isAvailableProduct(product)
    ) {
      return false;
    }

    seenIds.add(product.id);
    seenHandles.add(product.handle);
    return true;
  });
}

const complementarySizeKinds: Record<ProductSizeKind, ProductSizeKind[]> = {
  suit: ["shirt", "shoe", "waist", "top"],
  shirt: ["suit", "waist", "shoe", "top"],
  waist: ["shirt", "suit", "shoe", "top"],
  shoe: ["waist", "suit", "shirt", "top"],
  top: ["waist", "suit", "shoe", "shirt"],
};

function rankOutfitFallbacks(product: ShopifyProduct, candidates: ShopifyProduct[]) {
  const preferredKinds = complementarySizeKinds[getProductSizeKind(product)];
  const rankedCandidates = candidates
    .map((candidate, originalIndex) => ({
      candidate,
      originalIndex,
      kind: getProductSizeKind(candidate),
      kindPriority: preferredKinds.indexOf(getProductSizeKind(candidate)),
    }))
    .filter(({ kindPriority }) => kindPriority >= 0)
    .sort(
      (left, right) =>
        left.kindPriority - right.kindPriority || left.originalIndex - right.originalIndex,
    );
  const diverseFirstChoices = preferredKinds.flatMap((kind) => {
    const match = rankedCandidates.find((entry) => entry.kind === kind);

    return match ? [match] : [];
  });
  const firstChoiceIds = new Set(diverseFirstChoices.map(({ candidate }) => candidate.id));

  return [
    ...diverseFirstChoices,
    ...rankedCandidates.filter(({ candidate }) => !firstChoiceIds.has(candidate.id)),
  ].map(({ candidate }) => candidate);
}

async function loadShopProduct(handle: string) {
  try {
    return {
      product: await getShopProduct(handle),
      unavailable: false,
    };
  } catch (error) {
    console.error(`Unable to load Shopify product "${handle}".`, error);
    return {
      product: null,
      unavailable: true,
    };
  }
}

export async function generateStaticParams() {
  try {
    const products = await getShopProductPreviews(250);
    return products.map((product) => ({ handle: product.handle }));
  } catch (error) {
    console.error("Unable to build static params for Shopify product pages.", error);
    return [];
  }
}

export async function generateMetadata({ params }: ShopProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const { product } = await loadShopProduct(handle);

  if (!product) {
    return buildMetadata({
      title: "Shop Product",
      description: "Product detail from the J. Barbaro online shop.",
      path: `/shop/${handle}`,
    });
  }

  return {
    ...buildMetadata({
      title: product.title,
      description: `${product.vendor || "Shop"} ${product.productType || "product"} available in the J. Barbaro online shop.`,
      path: `/shop/${product.handle}`,
      image: product.featuredImage?.url,
    }),
    openGraph: {
      title: product.title,
      description: `${product.vendor || "Shop"} ${product.productType || "product"} available in the J. Barbaro online shop.`,
      url: absoluteUrl(`/shop/${product.handle}`),
      siteName: "J. Barbaro Clothiers",
      type: "website",
      images: product.featuredImage
        ? [
            {
              url: product.featuredImage.url,
              width: product.featuredImage.width || 1200,
              height: product.featuredImage.height || 1500,
              alt: product.featuredImage.altText || product.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: `${product.vendor || "Shop"} ${product.productType || "product"} available in the J. Barbaro online shop.`,
      images: product.featuredImage ? [product.featuredImage.url] : undefined,
    },
  };
}

export default async function ShopProductPage({ params }: ShopProductPageProps) {
  const { handle } = await params;
  const { product, unavailable } = await loadShopProduct(handle);

  if (unavailable) {
    return (
      <WaveSection topWave="A" background="ivory" contentClassName="py-8 sm:py-12 lg:py-16">
        <Container>
          <div className="rounded-[2rem] border border-ink/10 bg-white/88 p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-deep-teal uppercase">
              Product temporarily unavailable
            </p>
            <h1 className="mt-3 font-heading text-3xl text-ink sm:text-4xl">
              This product page is temporarily unavailable.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-smoke sm:text-base sm:leading-8">
              Please check back shortly, or continue shopping and book an appointment if you&apos;d
              like us to prepare options for you in person.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/shop">Back to Shop</ButtonLink>
              <ButtonLink href="/schedule-appointment" variant="secondary">
                Book Appointment
              </ButtonLink>
            </div>
          </div>
        </Container>
      </WaveSection>
    );
  }

  if (!product) {
    notFound();
  }

  const [sameBrandResult, outfitMatchResult, fallbackResult] = await Promise.allSettled([
    product.vendor.trim()
      ? getProductsByVendor(product.vendor.trim(), 24, true)
      : Promise.resolve<ShopifyProduct[]>([]),
    getRecommendedProducts(product.id, product.handle, 10, "COMPLEMENTARY"),
    getBestSellingProducts(48),
  ]);

  if (sameBrandResult.status === "rejected") {
    console.error(
      `Unable to load more products from "${product.vendor}" for "${product.handle}".`,
      sameBrandResult.reason,
    );
  }

  if (outfitMatchResult.status === "rejected") {
    console.error(
      `Unable to load complementary Shopify products for "${product.handle}".`,
      outfitMatchResult.reason,
    );
  }

  if (fallbackResult.status === "rejected") {
    console.error(
      `Unable to load outfit fallback products for "${product.handle}".`,
      fallbackResult.reason,
    );
  }

  const normalizedVendor = product.vendor.trim().toLocaleLowerCase();
  const sameBrandCandidates = getUniqueProducts(
    sameBrandResult.status === "fulfilled"
      ? sameBrandResult.value.filter(
          (item) => item.vendor.trim().toLocaleLowerCase() === normalizedVendor,
        )
      : [],
    product,
  );
  const merchantOutfitCandidates =
    outfitMatchResult.status === "fulfilled" ? outfitMatchResult.value : [];
  const fallbackOutfitCandidates =
    fallbackResult.status === "fulfilled" ? rankOutfitFallbacks(product, fallbackResult.value) : [];
  const outfitMatchCandidates = getUniqueProducts(
    [...merchantOutfitCandidates, ...fallbackOutfitCandidates],
    product,
  );
  const hasRecommendationCandidates =
    sameBrandCandidates.length > 0 || outfitMatchCandidates.length > 0;

  const minPrice = product.priceRange.minVariantPrice;
  const maxPrice = product.priceRange.maxVariantPrice;
  const hasPriceRange = minPrice.amount !== maxPrice.amount;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absoluteUrl(`/shop/${product.handle}#product`),
    url: absoluteUrl(`/shop/${product.handle}`),
    name: product.title,
    image: product.images.map((image) => image.url),
    description:
      product.description?.trim() ||
      `${product.vendor || "J. Barbaro Clothiers"} ${product.productType || "product"} available in the online shop.`,
    sku: product.handle,
    brand: product.vendor
      ? {
          "@type": "Brand",
          name: product.vendor,
        }
      : undefined,
    category: product.productType || undefined,
    aggregateRating: product.reviewSummary
      ? {
          "@type": "AggregateRating",
          ratingValue: product.reviewSummary.ratingValue,
          reviewCount: product.reviewSummary.reviewCount,
        }
      : undefined,
    offers: hasPriceRange
      ? {
          "@type": "AggregateOffer",
          priceCurrency: minPrice.currencyCode,
          lowPrice: minPrice.amount,
          highPrice: maxPrice.amount,
          offerCount: product.variants.length,
          availability: product.variants.some((variant) => variant.availableForSale)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: absoluteUrl(`/shop/${product.handle}`),
        }
      : {
          "@type": "Offer",
          priceCurrency: minPrice.currencyCode,
          price: minPrice.amount,
          availability: product.variants.some((variant) => variant.availableForSale)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: absoluteUrl(`/shop/${product.handle}`),
        },
  };

  return (
    <div className="overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
          { name: product.title, href: `/shop/${product.handle}` },
        ]}
      />
      <WaveSection
        topWave="A"
        background="ivory"
        className="overflow-x-clip"
        contentClassName="py-4 sm:py-7 lg:py-10"
      >
        <Container>
          <ProductDetailClient key={product.id} product={product} />
        </Container>
      </WaveSection>

      {hasRecommendationCandidates ? (
        <ProductRecommendationsClient
          key={product.id}
          product={product}
          sameBrandCandidates={sameBrandCandidates}
          outfitMatchCandidates={outfitMatchCandidates}
        />
      ) : null}
    </div>
  );
}
