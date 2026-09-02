export const SITE_NAME = "J. Barbaro Clothiers";
export const SITE_OWNER = "Jason Barbaro";
export const LEGAL_OWNER = "Barbaro Group Inc.";
export const SITE_DESCRIPTION =
  "Luxury menswear, designer brands, and tailored clothing in Metro Detroit.";
export const DEFAULT_OG_IMAGE = "/images/og-marketing.png";

function normalizeSiteUrl(value: string | undefined) {
  const url = new URL(value || "http://localhost:3000");

  if (
    process.env.NODE_ENV === "production" &&
    url.protocol === "http:" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1"
  ) {
    url.protocol = "https:";
  }

  return url.toString().replace(/\/$/, "");
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
