export const STOREFRONT_LAUNCH_AT = "2026-11-27T09:00:00-05:00";
export const STOREFRONT_LAUNCH_TIMESTAMP = Date.parse(STOREFRONT_LAUNCH_AT);
export const STOREFRONT_LAUNCH_DATE = "Friday, November 27 at 9:00 a.m. EST";
export const CHECKOUT_LAUNCH_MESSAGE = `Checkout opens ${STOREFRONT_LAUNCH_DATE}.`;

export function isStorefrontCheckoutOpen(now = Date.now()): boolean {
  return now >= STOREFRONT_LAUNCH_TIMESTAMP;
}

export function getStorefrontLaunchSeconds(now = Date.now()): number {
  return Math.max(0, Math.ceil((STOREFRONT_LAUNCH_TIMESTAMP - now) / 1000));
}
