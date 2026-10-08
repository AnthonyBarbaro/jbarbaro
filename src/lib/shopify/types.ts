export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifyProductReviewSummary = {
  ratingValue: number;
  reviewCount: number;
};

export type ShopifyProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: { name: string; value: string }[];
};

export type ShopifyGiftWrapOffer = {
  merchandiseId: string;
  title: string;
  price: ShopifyMoney;
  availableForSale: boolean;
};

export type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  createdAt: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  reviewSummary: ShopifyProductReviewSummary | null;
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
> & {
  availableForSale: boolean;
  availableSizes: string[];
};

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
    productType: string | null;
    attributes?: { key: string; value: string }[];
    parentLineId?: string | null;
    instructions?: { canRemove: boolean; canUpdateQuantity: boolean };
    selectedOptions: { name: string; value: string }[];
    image: {
      url: string;
      altText: string | null;
      width: number | null;
      height: number | null;
    } | null;
    unitPrice: ShopifyMoney;
    totalPrice: ShopifyMoney;
    variants: ShopifyProductVariant[];
  }>;
};

export type ShopifyCartLine = ShopifyCartSnapshot["lines"][number];

export type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
  attributes?: { key: string; value: string }[];
  parent?: { lineId: string; merchandiseId?: never } | { merchandiseId: string; lineId?: never };
};

export type ShopifyCartLineUpdate = {
  id: string;
  quantity?: number;
  merchandiseId?: string;
  attributes?: { key: string; value: string }[];
};

export type ShopifyCartWarning = {
  code: string;
  message: string;
  target: string | null;
};

export type ShopifyCartUserError = {
  code: string | null;
  field: string[] | null;
  message: string;
};

export type ShopifyCartMutationResult = {
  cart: ShopifyCartSnapshot | null;
  warnings: ShopifyCartWarning[];
  userErrors: ShopifyCartUserError[];
};

export type ShopifyCartResponse = {
  configured: boolean;
  cart?: ShopifyCartSnapshot | null;
  warnings: ShopifyCartWarning[];
  userErrors: ShopifyCartUserError[];
  confirmed?: boolean;
  giftWrapOffer?: ShopifyGiftWrapOffer | null;
  giftWrapGroupId?: string;
  giftWrapIncomplete?: boolean;
  message?: string;
};
