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

const defaultForMenChildren = menCategories.map((category): NavChild => ({
  label: category.name,
  href: getMenCategoryHref(category),
}));

export function buildPrimaryNavigation(forMenChildren: NavChild[] = defaultForMenChildren): NavItem[] {
  return navigation.primaryNavigation.map((item): NavItem => {
    if (item.label !== "Collections") {
      return item;
    }

    const liveChildren = forMenChildren.filter((child) => child.href && child.label);

    return {
      ...item,
      href: item.href || "/for-men",
      ...(liveChildren.length > 0 ? { children: liveChildren } : {}),
    };
  });
}

export const primaryNavigation: NavItem[] = buildPrimaryNavigation();
export const headerTopLinks = navigation.headerTopLinks;
export const headerCtas = navigation.headerCtas;
export const footerShoppingLinks = navigation.footerShoppingLinks;
export const footerUtilityLinks = navigation.footerUtilityLinks;
export const footerNewsletterTitle = navigation.footerNewsletterTitle;
export const footerNewsletterCopy = navigation.footerNewsletterCopy;
