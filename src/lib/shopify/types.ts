export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifyProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  selectedOptions: { name: string; value: string }[];
};

export type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  featuredImage: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  images: Array<{
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  }>;
  collections: ShopifyCollectionPreview[];
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  variants: ShopifyProductVariant[];
};

export type ShopifyProductSearchResult = Pick<
  ShopifyProduct,
  "id" | "handle" | "title" | "vendor" | "productType" | "featuredImage" | "priceRange"
>;

export type ShopifyProductPreview = Pick<ShopifyProduct, "id" | "handle" | "title">;

export type ShopifyCollectionPreview = {
  id: string;
  handle: string;
  title: string;
  image: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
};

export type ShopifyCollection = ShopifyCollectionPreview & {
  description: string;
  products: ShopifyProduct[];
};

export type ShopifyCartSnapshot = {
  totalQuantity: number;
  checkoutUrl: string;
  subtotal: ShopifyMoney;
  total: ShopifyMoney;
  tax: ShopifyMoney | null;
  lines: Array<{
    id: string;
    quantity: number;
    variantId: string | null;
    variantTitle: string | null;
    productTitle: string | null;
    productHandle: string | null;
    selectedOptions: { name: string; value: string }[];
    image: {
      url: string;
      altText: string | null;
      width: number | null;
      height: number | null;
    } | null;
    unitPrice: ShopifyMoney;
    totalPrice: ShopifyMoney;
  }>;
};
