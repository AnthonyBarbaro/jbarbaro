import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailClient } from "@/components/shop/ProductDetailClient";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import {
  getRecommendedProducts,
  getShopProduct,
  getShopProductPreviews,
  getShopProducts,
} from "@/lib/shopify/products";
import type { ShopifyProduct } from "@/lib/shopify/types";

type ShopProductPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export const revalidate = 300;

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
            <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">
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

  let relatedProducts: ShopifyProduct[] = [];

  try {
    relatedProducts = await getRecommendedProducts(product.id, product.handle, 4);

    if (relatedProducts.length === 0) {
      relatedProducts = (await getShopProducts(8))
        .filter((item) => item.handle !== product.handle)
        .slice(0, 4);
    }
  } catch (error) {
    console.error(`Unable to load related Shopify products for "${product.handle}".`, error);
  }

  relatedProducts = relatedProducts
    .filter((item) => item.variants.some((variant) => variant.availableForSale))
    .slice(0, 4);

  const minPrice = product.priceRange.minVariantPrice;
  const maxPrice = product.priceRange.maxVariantPrice;
  const hasPriceRange = minPrice.amount !== maxPrice.amount;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
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

      {relatedProducts.length > 0 ? (
        <WaveSection topWave="C" background="stone" className="overflow-x-clip">
          <Container className="overflow-x-clip">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">
                  More to Explore
                </p>
                <h2 className="mt-3 font-heading text-[2rem] text-ink sm:text-4xl">
                  Complete the Look
                </h2>
                <p className="mt-3 text-sm leading-7 text-smoke">
                  Curated companion pieces selected to keep the outfit polished, refined, and easy
                  to finish.
                </p>
              </div>
              <ButtonLink href="/shop" variant="secondary" size="sm" className="w-fit">
                Shop All
              </ButtonLink>
            </div>
            <div className="mt-8 md:hidden">
              <div className="overflow-x-hidden">
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {relatedProducts.map((relatedProduct) => (
                    <div
                      key={relatedProduct.id}
                      className="min-w-[74vw] max-w-[74vw] snap-start sm:min-w-[19rem] sm:max-w-[19rem]"
                    >
                      <ShopProductCard
                        product={relatedProduct}
                        imageSizes="(max-width: 768px) 74vw, 19rem"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ShopProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </Container>
        </WaveSection>
      ) : null}
    </div>
  );
}
