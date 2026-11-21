export const TEXT_SIGNUP_PATH = "/text-signup";
export const TEXT_SIGNUP_OPEN_EVENT = "jbarbaro:open-text-signup";
export const KLAVIYO_ONSITE_SCRIPT_ID = "klaviyo-onsite";
export const KLAVIYO_TEXT_SIGNUP_FORM_ID = "UWckUG";

export function getKlaviyoSiteId(): string | null {
  const siteId = process.env.NEXT_PUBLIC_KLAVIYO_SITE_ID?.trim();
  return siteId && /^[a-zA-Z0-9]{6}$/.test(siteId) ? siteId : null;
}
