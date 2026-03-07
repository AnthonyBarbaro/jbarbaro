"use client";

import { Link } from "@payloadcms/ui";
import { Star } from "lucide-react";

import { resolveNavIcon } from "./iconMap";
import type { AdminNavItem } from "./types";

type NavItemProps = {
  active: boolean;
  isFavorite: boolean;
  item: AdminNavItem;
  onSelect: () => void;
  onToggleFavorite: (id: string) => void;
};

export function NavItem({ active, isFavorite, item, onSelect, onToggleFavorite }: NavItemProps) {
  const Icon = resolveNavIcon(item.icon);
  const canFavorite = item.kind !== "system";

  return (
    <div className={`jb-admin-sidebar__item ${active ? "is-active" : ""}`}>
      <Link
        className="jb-admin-sidebar__item-link"
        href={item.href}
        onClick={onSelect}
        prefetch={false}
      >
        <span className="jb-admin-sidebar__item-accent" />
        <span className="jb-admin-sidebar__item-icon-wrap">
          <Icon aria-hidden="true" className="jb-admin-sidebar__item-icon" />
        </span>
        <span className="jb-admin-sidebar__item-label">{item.label}</span>
      </Link>
      {canFavorite ? (
        <button
          aria-label={isFavorite ? `Remove ${item.label} from favorites` : `Add ${item.label} to favorites`}
          aria-pressed={isFavorite}
          className={`jb-admin-sidebar__favorite-toggle ${isFavorite ? "is-favorite" : ""}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(item.id);
          }}
          type="button"
        >
          <Star aria-hidden="true" className="jb-admin-sidebar__favorite-icon" />
        </button>
      ) : null}
    </div>
  );
}
