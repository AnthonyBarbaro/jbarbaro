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
      description: `${product.vendor || "Shop"} ${product.productType || "product"} available in the J. Barbaro headless storefront.`,
      path: `/shop/${product.handle}`,
      image: product.featuredImage?.url,
    }),
    openGraph: {
      title: product.title,
      description: `${product.vendor || "Shop"} ${product.productType || "product"} available in the J. Barbaro headless storefront.`,
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
      description: `${product.vendor || "Shop"} ${product.productType || "product"} available in the J. Barbaro headless storefront.`,
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

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <WaveSection topWave="A" background="ivory">
        <Container>
          <ProductDetailClient key={product.id} product={product} />
        </Container>
      </WaveSection>

      {relatedProducts.length > 0 ? (
        <WaveSection topWave="C" background="stone">
          <Container>
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Recommended</p>
              <h2 className="font-heading text-4xl text-ink">Complete the Shop Floor</h2>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ShopProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </Container>
        </WaveSection>
      ) : null}
    </>
  );
}
