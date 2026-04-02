import navigationJson from "@content/site/navigation.json";

import { getMenCategoryHref, menCategories } from "@/data/men-categories";

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

export const primaryNavigation: NavItem[] = navigation.primaryNavigation.map((item): NavItem => {
  if (item.label !== "For Men") {
    return item;
  }

  return {
    ...item,
    href: item.href || "/for-men",
    children: menCategories.map((category): NavChild => ({
      label: category.name,
      href: getMenCategoryHref(category),
    })),
  };
});
export const headerTopLinks = navigation.headerTopLinks;
export const headerCtas = navigation.headerCtas;
export const footerShoppingLinks = navigation.footerShoppingLinks;
export const footerUtilityLinks = navigation.footerUtilityLinks;
export const footerNewsletterTitle = navigation.footerNewsletterTitle;
export const footerNewsletterCopy = navigation.footerNewsletterCopy;
