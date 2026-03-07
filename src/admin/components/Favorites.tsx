"use client";

import { NavGroup } from "./NavGroup";
import { NavItem } from "./NavItem";
import type { AdminNavItem } from "./types";

type FavoritesProps = {
  isOpen: boolean;
  items: AdminNavItem[];
  onSelect: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleGroup: (id: string) => void;
  pathname: string;
};

function isActivePath(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (!pathname.startsWith(href)) {
    return false;
  }

  return ["/", undefined].includes(pathname[href.length]);
}

export function Favorites({
  isOpen,
  items,
  onSelect,
  onToggleFavorite,
  onToggleGroup,
  pathname,
}: FavoritesProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <NavGroup
      count={items.length}
      description="Pinned shortcuts for daily marketing work"
      id="favorites"
      isOpen={isOpen}
      label="Favorites"
      onToggle={onToggleGroup}
    >
      <div className="jb-admin-sidebar__items">
        {items.map((item) => (
          <NavItem
            active={isActivePath(pathname, item.href)}
            isFavorite={true}
            item={item}
            key={item.id}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </NavGroup>
  );
}
