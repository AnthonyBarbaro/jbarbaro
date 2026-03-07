"use client";

import type { ReactNode } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";

import { GearIcon, Popup, useNav, useWindowInfo } from "@payloadcms/ui";
import { PanelLeftClose } from "lucide-react";
import { usePathname } from "next/navigation";

import { Favorites } from "./Favorites";
import { NavGroup } from "./NavGroup";
import { NavItem } from "./NavItem";
import { NavSearch } from "./NavSearch";
import type { AdminNavItem, AdminNavSection } from "./types";

const COLLAPSED_STORAGE_KEY = "jb-admin-nav-collapsed-v1";
const FAVORITES_STORAGE_KEY = "jb-admin-nav-favorites-v1";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesItem(item: AdminNavItem, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [item.label, item.slug, ...(item.keywords || [])].join(" ").toLowerCase();
  return haystack.includes(query);
}

function isActivePath(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (!pathname.startsWith(href)) {
    return false;
  }

  return ["/", undefined].includes(pathname[href.length]);
}

type SidebarClientProps = {
  afterLinks?: ReactNode;
  afterNav?: ReactNode;
  beforeLinks?: ReactNode;
  beforeNav?: ReactNode;
  logoutControl?: ReactNode;
  sections: AdminNavSection[];
  settingsMenu?: ReactNode[];
};

export function SidebarClient({
  afterLinks,
  afterNav,
  beforeLinks,
  beforeNav,
  logoutControl,
  sections,
  settingsMenu,
}: SidebarClientProps) {
  const pathname = usePathname() || "";
  const { hydrated, navOpen, navRef, setNavOpen, shouldAnimate } = useNav();
  const {
    breakpoints: { l: largeBreak, m: midBreak, s: smallBreak },
  } = useWindowInfo();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const isModalNav = Boolean(largeBreak || midBreak || smallBreak);
  const normalizedQuery = normalize(query);

  const allItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);
  const itemMap = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const storedCollapsed = localStorage.getItem(COLLAPSED_STORAGE_KEY);

      if (storedFavorites) {
        const parsed = JSON.parse(storedFavorites);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter((value): value is string => typeof value === "string"));
        }
      }

      if (storedCollapsed) {
        const parsed = JSON.parse(storedCollapsed);
        if (parsed && typeof parsed === "object") {
          setCollapsed(parsed as Record<string, boolean>);
        }
      }
    } catch {
      // Ignore corrupted browser state and fall back to defaults.
    }
  }, []);

  useEffect(() => {
    const availableIds = new Set(allItems.map((item) => item.id));
    setFavorites((current) => current.filter((id) => availableIds.has(id)));
  }, [allItems]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage failures.
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      // Ignore storage failures.
    }
  }, [collapsed]);

  const favoriteItems = useMemo(() => {
    const ordered = favorites
      .map((id) => itemMap.get(id))
      .filter((item): item is AdminNavItem => Boolean(item))
      .filter((item) => item.kind !== "system" && matchesItem(item, normalizedQuery));

    return ordered;
  }, [favorites, itemMap, normalizedQuery]);

  const filteredSections = useMemo(() => {
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => matchesItem(item, normalizedQuery)),
      }))
      .filter((section) => section.items.length > 0);
  }, [normalizedQuery, sections]);

  const matchCount = favoriteItems.length + filteredSections.reduce((count, section) => count + section.items.length, 0);

  function handleToggleGroup(sectionId: string) {
    setCollapsed((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  function handleToggleFavorite(id: string) {
    setFavorites((current) => {
      if (current.includes(id)) {
        return current.filter((entry) => entry !== id);
      }

      return [...current, id];
    });
  }

  function handleSelectItem() {
    if (isModalNav) {
      setNavOpen(false);
    }
  }

  const sidebarClassName = [
    "jb-admin-sidebar",
    navOpen && "jb-admin-sidebar--nav-open",
    shouldAnimate && "jb-admin-sidebar--nav-animate",
    hydrated && "jb-admin-sidebar--nav-hydrated",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={sidebarClassName} inert={!navOpen ? true : undefined}>
      <div className="jb-admin-sidebar__scroll" ref={navRef}>
        <div className="jb-admin-sidebar__surface">
          {beforeNav ? <div className="jb-admin-sidebar__slot jb-admin-sidebar__slot--before-nav">{beforeNav}</div> : null}

          <header className="jb-admin-sidebar__header">
            <div className="jb-admin-sidebar__header-top">
              <div>
                <p className="jb-admin-sidebar__eyebrow">Jason Barbaro</p>
                <h1 className="jb-admin-sidebar__title">Admin Atelier</h1>
                <p className="jb-admin-sidebar__subtitle">Marketing, merchandising, and store content in one place.</p>
              </div>
              <button
                aria-label="Close navigation"
                className="jb-admin-sidebar__mobile-close"
                onClick={() => setNavOpen(false)}
                tabIndex={!navOpen ? -1 : undefined}
                type="button"
              >
                <PanelLeftClose aria-hidden="true" />
              </button>
            </div>

            <NavSearch onChange={setQuery} value={query} />

            <div className="jb-admin-sidebar__search-meta">
              {normalizedQuery ? `${matchCount} match${matchCount === 1 ? "" : "es"}` : "Quick access for daily admin work"}
            </div>
          </header>

          <div className="jb-admin-sidebar__content">
            {beforeLinks ? <div className="jb-admin-sidebar__slot jb-admin-sidebar__slot--before-links">{beforeLinks}</div> : null}

            <Favorites
              isOpen={normalizedQuery ? true : !collapsed.favorites}
              items={favoriteItems}
              onSelect={handleSelectItem}
              onToggleFavorite={handleToggleFavorite}
              onToggleGroup={handleToggleGroup}
              pathname={pathname}
            />

            {filteredSections.map((section) => {
              const isOpen = normalizedQuery ? true : !collapsed[section.id];

              return (
                <NavGroup
                  count={section.items.length}
                  description={section.description}
                  id={section.id}
                  isOpen={isOpen}
                  key={section.id}
                  label={section.label}
                  onToggle={handleToggleGroup}
                >
                  <div className="jb-admin-sidebar__items">
                    {section.items.map((item) => (
                      <NavItem
                        active={isActivePath(pathname, item.href)}
                        isFavorite={favorites.includes(item.id)}
                        item={item}
                        key={item.id}
                        onSelect={handleSelectItem}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                </NavGroup>
              );
            })}

            {!favoriteItems.length && !filteredSections.length ? (
              <div className="jb-admin-sidebar__empty-state">
                <p className="jb-admin-sidebar__empty-title">No destinations match your search.</p>
                <p className="jb-admin-sidebar__empty-copy">Try a page name, collection slug, or clear the filter.</p>
              </div>
            ) : null}

            {afterLinks ? <div className="jb-admin-sidebar__slot jb-admin-sidebar__slot--after-links">{afterLinks}</div> : null}
          </div>

          <footer className="jb-admin-sidebar__footer">
            <div className="jb-admin-sidebar__footer-actions">
              {settingsMenu && settingsMenu.length ? (
                <Popup
                  button={<GearIcon ariaLabel="Open settings menu" />}
                  className="jb-admin-sidebar__settings-menu"
                  horizontalAlign="left"
                  id="jb-admin-settings-menu"
                  size="small"
                  verticalAlign="top"
                >
                  {settingsMenu.map((item, index) => (
                    <Fragment key={`settings-menu-item-${index}`}>{item}</Fragment>
                  ))}
                </Popup>
              ) : null}
              {logoutControl ? <div className="jb-admin-sidebar__logout">{logoutControl}</div> : null}
            </div>
          </footer>

          {afterNav ? <div className="jb-admin-sidebar__slot jb-admin-sidebar__slot--after-nav">{afterNav}</div> : null}
        </div>
      </div>
    </aside>
  );
}
