import { menCategories } from "@/data/men-categories";

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

export const primaryNavigation: NavItem[] = [
  {
    label: "About",
    href: "/about",
    children: [
      { label: "Our History", href: "/about/our-history" },
      { label: "Services", href: "/services" },
      { label: "Reviews", href: "/reviews" },
    ],
  },
  {
    label: "For Men",
    children: menCategories.map((category) => ({
      label: category.name,
      href: `/for-men/${category.slug}`,
    })),
  },
  {
    label: "Designers",
    children: [
      { label: "Featured Designers", href: "/designers/featured-designers" },
      { label: "All Designer Brands", href: "/designers/all-designer-brands" },
    ],
  },
  { label: "Tailored", href: "/tailored-clothing" },
  {
    label: "Tuxedos",
    children: [
      { label: "Suit & Tuxedo Rentals", href: "/suit-tuxedo-rentals" },
      { label: "Register Your Wedding", href: "/register-your-wedding" },
    ],
  },
  { label: "Locations", href: "/locations" },
  { label: "Contact", href: "/contact-us" },
  {
    label: "What\'s New",
    children: [
      { label: "Blog", href: "/blog" },
      { label: "Style Guide", href: "/style-guide" },
    ],
  },
  { label: "Shop", href: "/shop-coming-soon" },
  { label: "Sale", href: "/sale-coming-soon" },
];
