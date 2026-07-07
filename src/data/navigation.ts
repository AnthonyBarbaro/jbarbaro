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

const quickCategoryLinks: NavItem[] = [
  { label: "Suits", href: "/categories/suits-sports-coats" },
  { label: "Shirts", href: "/categories/dress-shirts" },
  { label: "Shoes", href: "/categories/footwear" },
  { label: "Accessories", href: "/categories/accessories" },
  { label: "Brands", href: "/shop/brands" },
];

export function buildPrimaryNavigation(forMenChildren: NavChild[] = defaultForMenChildren): NavItem[] {
  const items = navigation.primaryNavigation.map((item): NavItem => {
    const liveChildren = forMenChildren.filter((child) => child.href && child.label);

    if (item.label === "Shop") {
      return {
        ...item,
        href: item.href || "/shop",
        ...(liveChildren.length > 0 ? { children: item.children?.length ? item.children : liveChildren } : {}),
      };
    }

    if (item.label !== "Collections") {
      return item;
    }

    return {
      ...item,
      href: item.href || "/categories",
      ...(liveChildren.length > 0 ? { children: liveChildren } : {}),
    };
  });

  const shopIndex = items.findIndex((item) => item.label === "Shop");
  const newLinks = quickCategoryLinks.filter((link) => !items.some((item) => item.href === link.href));

  if (shopIndex !== -1) {
    items.splice(shopIndex + 1, 0, ...newLinks);
  }

  return items;
}

export const primaryNavigation: NavItem[] = buildPrimaryNavigation();
export const headerTopLinks = navigation.headerTopLinks;
export const headerCtas = navigation.headerCtas;
export const footerShoppingLinks = navigation.footerShoppingLinks;
export const footerUtilityLinks = navigation.footerUtilityLinks;
export const footerNewsletterTitle = navigation.footerNewsletterTitle;
export const footerNewsletterCopy = navigation.footerNewsletterCopy;
