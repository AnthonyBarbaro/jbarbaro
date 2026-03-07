export type AdminNavItemKind = "collection" | "global" | "system";

export type AdminNavItem = {
  href: string;
  icon: string;
  id: string;
  keywords?: string[];
  kind: AdminNavItemKind;
  label: string;
  slug?: string;
};

export type AdminNavSection = {
  description?: string;
  id: string;
  items: AdminNavItem[];
  label: string;
};
