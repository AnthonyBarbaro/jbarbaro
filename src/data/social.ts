import siteSettingsJson from "@content/site/site-settings.json";

import type { SocialLink } from "@/types/site";

type SiteSettingsData = {
  socialLinks: SocialLink[];
};

const siteSettings = siteSettingsJson as SiteSettingsData;

export const socialLinks = siteSettings.socialLinks;
