import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailClient } from "@/components/shop/ProductDetailClient";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { getRecommendedProducts, getShopProduct, getShopProducts } from "@/lib/shopify/products";

type ShopProductPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateMetadata({ params }: ShopProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getShopProduct(handle);

  if (!product) {
    return buildMetadata({
      title: "Product Not Found",
      description: "Requested shop product was not found.",
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
  const product = await getShopProduct(handle);

  if (!product) {
    notFound();
  }

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: product.title, href: `/shop/${product.handle}` },
  ];

  let relatedProducts = await getRecommendedProducts(product.id, product.handle, 4);

  if (relatedProducts.length === 0) {
    relatedProducts = (await getShopProducts(8)).filter((item) => item.handle !== product.handle).slice(0, 4);
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <Breadcrumbs items={breadcrumbs} />
      <WaveSection topWave="A" background="ivory" className="overflow-x-clip" contentClassName="py-6 sm:py-10 lg:py-16">
        <Container>
          <ProductDetailClient key={product.id} product={product} />
        </Container>
      </WaveSection>

      {relatedProducts.length > 0 ? (
        <WaveSection topWave="C" background="stone" className="overflow-x-clip">
          <Container className="overflow-x-clip">
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Recommended</p>
              <h2 className="font-heading text-[2rem] text-ink sm:text-4xl">You May Also Like</h2>
            </div>
            <div className="mt-8 md:hidden">
              <div className="overflow-x-hidden">
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {relatedProducts.map((relatedProduct) => (
                    <div key={relatedProduct.id} className="min-w-[74vw] max-w-[74vw] snap-start sm:min-w-[19rem] sm:max-w-[19rem]">
                      <ShopProductCard product={relatedProduct} columns={2} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ShopProductCard key={relatedProduct.id} product={relatedProduct} columns={2} />
              ))}
            </div>
          </Container>
        </WaveSection>
      ) : null}
    </div>
  );
}
