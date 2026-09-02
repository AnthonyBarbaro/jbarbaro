export const WISHLIST_STORAGE_KEY = "jbarbaro:wishlist";
export const WISHLIST_CHANGED_EVENT = "jbarbaro:wishlist-changed";
export const WISHLIST_OPEN_EVENT = "jbarbaro:wishlist-open";

const MAX_WISHLIST_ITEMS = 100;

export function openWishlistDrawer() {
  window.dispatchEvent(new Event(WISHLIST_OPEN_EVENT));
}

export type WishlistItem = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  priceLabel: string;
  image: {
    url: string;
    altText: string | null;
  } | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWishlistItem(value: unknown): value is WishlistItem {
  if (!isRecord(value)) {
    return false;
  }

  const image = value.image;
  const hasValidImage =
    image === null ||
    (isRecord(image) &&
      typeof image.url === "string" &&
      (typeof image.altText === "string" || image.altText === null));

  return (
    typeof value.id === "string" &&
    typeof value.handle === "string" &&
    typeof value.title === "string" &&
    typeof value.vendor === "string" &&
    typeof value.productType === "string" &&
    typeof value.priceLabel === "string" &&
    hasValidImage
  );
}

export function readWishlistItems(): WishlistItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(WISHLIST_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return Array.from(
      new Map(
        parsedValue
          .filter(isWishlistItem)
          .slice(0, MAX_WISHLIST_ITEMS)
          .map((item) => [item.id, item]),
      ).values(),
    );
  } catch {
    return [];
  }
}

function writeWishlistItems(items: WishlistItem[]) {
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function toggleWishlistItem(item: WishlistItem) {
  const currentItems = readWishlistItems();
  const wasSaved = currentItems.some((currentItem) => currentItem.id === item.id);
  const nextItems = wasSaved
    ? currentItems.filter((currentItem) => currentItem.id !== item.id)
    : [item, ...currentItems].slice(0, MAX_WISHLIST_ITEMS);

  return writeWishlistItems(nextItems) ? !wasSaved : wasSaved;
}

export function removeWishlistItem(productId: string) {
  const currentItems = readWishlistItems();
  const nextItems = currentItems.filter((item) => item.id !== productId);

  if (nextItems.length === currentItems.length) {
    return;
  }

  writeWishlistItems(nextItems);
}

export function clearWishlist() {
  writeWishlistItems([]);
}
