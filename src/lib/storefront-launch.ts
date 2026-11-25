export const STOREFRONT_LAUNCH_AT = "2026-11-27T09:00:00-05:00";
export const STOREFRONT_LAUNCH_TIMESTAMP = Date.parse(STOREFRONT_LAUNCH_AT);
export const STOREFRONT_LAUNCH_DATE = "Friday, November 27 at 9:00 a.m. EST";
export const CHECKOUT_LAUNCH_MESSAGE = `Checkout opens ${STOREFRONT_LAUNCH_DATE}.`;

export function isStorefrontCheckoutOpen(now = Date.now()): boolean {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_LOCAL_CHECKOUT === "true"
  ) {
    return true;
  }

  return now >= STOREFRONT_LAUNCH_TIMESTAMP;
}

export function getStorefrontLaunchSeconds(now = Date.now()): number {
  return isStorefrontCheckoutOpen(now) ? 0 : Math.ceil((STOREFRONT_LAUNCH_TIMESTAMP - now) / 1000);
}
