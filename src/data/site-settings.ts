import siteSettingsJson from "@content/site/site-settings.json";

type SiteSettingsData = {
  siteName: string;
  siteOwner: string;
  siteDescription: string;
  logoUrl: string;
  socialLinks: Array<{ label: string; href: string }>;
  ratingValue: number;
  reviewCount: number;
  facebookLikes: number;
};

export const siteSettings = siteSettingsJson as SiteSettingsData;
