import navigationJson from "@content/site/navigation.json";

export type NavChild = {
  label: string;
  href: string;
  external?: boolean;
};

export type NavItem = {
  label: string;
  href?: string;
  external?: boolean;
  children?: NavChild[];
};

type NavigationData = {
  primaryNavigation: NavItem[];
  headerTopLinks: NavChild[];
  headerCtas: NavChild[];
  footerShoppingLinks: NavChild[];
  footerUtilityLinks: NavChild[];
  footerNewsletterTitle: string;
  footerNewsletterCopy: string;
};

const navigation = navigationJson as NavigationData;

export function buildPrimaryNavigation(): NavItem[] {
  return navigation.primaryNavigation;
}

export const primaryNavigation: NavItem[] = buildPrimaryNavigation();
export const headerTopLinks = navigation.headerTopLinks;
export const headerCtas = navigation.headerCtas;
export const footerShoppingLinks = navigation.footerShoppingLinks;
export const footerUtilityLinks = navigation.footerUtilityLinks;
export const footerNewsletterTitle = navigation.footerNewsletterTitle;
export const footerNewsletterCopy = navigation.footerNewsletterCopy;
