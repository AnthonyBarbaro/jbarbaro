import { getTranslation } from "@payloadcms/translations";
import { Logout } from "@payloadcms/ui";
import { RenderServerComponent } from "@payloadcms/ui/elements/RenderServerComponent";
import type { ImportMap, PayloadComponent } from "payload";
import { formatAdminURL } from "payload/shared";

import { SidebarClient } from "./SidebarClient";
import type { AdminNavItem, AdminNavSection } from "./types";

type SidebarProps = {
  collectionSlug?: string;
  documentSubViewType?: string;
  docID?: number | string;
  globalSlug?: string;
  i18n: {
    t: (key: string) => string;
  };
  locale?: string;
  params?: Promise<Record<string, string | string[]>>;
  payload: {
    config: PayloadConfigShape;
    importMap: ImportMap;
  };
  permissions?: PermissionsShape;
  req?: Record<string, unknown>;
  searchParams?: Promise<Record<string, string | string[]>>;
  user?: Record<string, unknown>;
  viewType?: string;
  visibleEntities: {
    collections: string[];
    globals: string[];
  };
};

type LabelResolver = string | ((args: { i18n: SidebarProps["i18n"]; t: SidebarProps["i18n"]["t"] }) => string);

type AdminEntity = {
  label?: LabelResolver;
  labels?: {
    plural?: LabelResolver;
  };
  slug: string;
};

type CustomComponentsShape = {
  afterNav?: PayloadComponent | PayloadComponent[];
  afterNavLinks?: PayloadComponent | PayloadComponent[];
  beforeNav?: PayloadComponent | PayloadComponent[];
  beforeNavLinks?: PayloadComponent | PayloadComponent[];
  logout?: {
    Button?: PayloadComponent;
  };
  settingsMenu?: PayloadComponent[];
};

type PayloadConfigShape = {
  admin: {
    components: CustomComponentsShape;
    routes?: {
      account?: string;
    };
  };
  collections: AdminEntity[];
  globals: AdminEntity[];
  routes?: {
    admin?: string;
  };
};

type PermissionsShape = {
  collections?: Record<string, { read?: boolean } | undefined>;
  globals?: Record<string, { read?: boolean } | undefined>;
};

function humanizeSlug(slug: string) {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ensureAdminPath(path?: string): `/${string}` | "" | undefined {
  if (!path) {
    return undefined;
  }

  if (path.startsWith("/")) {
    return path as `/${string}`;
  }

  return `/${path}` as `/${string}`;
}

function resolveLabel(entity: AdminEntity, i18n: SidebarProps["i18n"]) {
  const labelOrFunction = "labels" in entity ? entity.labels?.plural : entity.label;

  if (typeof labelOrFunction === "function") {
    return labelOrFunction({ i18n, t: i18n.t });
  }

  if (labelOrFunction) {
    return getTranslation(labelOrFunction, i18n as never);
  }

  return humanizeSlug(entity.slug);
}

function buildItems(args: {
  adminRoute: string;
  entities: AdminEntity[];
  i18n: SidebarProps["i18n"];
  kind: AdminNavItem["kind"];
  visibleSlugs: string[];
}) {
  const { adminRoute, entities, i18n, kind, visibleSlugs } = args;

  return entities
    .filter((entity) => visibleSlugs.includes(entity.slug))
    .map((entity) => ({
      href: formatAdminURL({
        adminRoute,
        path: kind === "collection" ? `/collections/${entity.slug}` : `/globals/${entity.slug}`,
      }),
      icon: entity.slug,
      id: `${kind}-${entity.slug}`,
      keywords: [entity.slug, kind],
      kind,
      label: resolveLabel(entity, i18n),
      slug: entity.slug,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export async function Sidebar(props: SidebarProps) {
  const {
    collectionSlug,
    documentSubViewType,
    docID,
    globalSlug,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewType,
    visibleEntities,
  } = props;

  if (!payload?.config) {
    return null;
  }

  const {
    admin: {
      components: { afterNav, afterNavLinks, beforeNav, beforeNavLinks, logout, settingsMenu },
      routes: adminRoutes,
    },
    collections,
    globals,
    routes,
  } = payload.config;

  const adminRoute = routes?.admin || "/cms";
  const accountRoute = ensureAdminPath(adminRoutes?.account) || "/account";
  const clientProps = {
    documentSubViewType,
    viewType,
    visibleEntities,
  };
  const serverProps = {
    collectionSlug,
    docID,
    globalSlug,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
  };

  const collectionItems = buildItems({
    adminRoute,
    entities: collections.filter((entity) => permissions?.collections?.[entity.slug]?.read),
    i18n,
    kind: "collection",
    visibleSlugs: visibleEntities.collections,
  });

  const globalItems = buildItems({
    adminRoute,
    entities: globals.filter((entity) => permissions?.globals?.[entity.slug]?.read),
    i18n,
    kind: "global",
    visibleSlugs: visibleEntities.globals,
  });

  const sections: AdminNavSection[] = [
    {
      description: "Operational workflows and live appointment requests",
      id: "operations",
      items: [
        {
          href: formatAdminURL({ adminRoute, path: "/appointments" }),
          icon: "appointments",
          id: "operations-appointments",
          keywords: ["appointments", "bookings", "calendar", "requests"],
          kind: "collection",
          label: "Appointments",
          slug: "appointments",
        },
      ],
      label: "Operations",
    },
    {
      description: "Reusable content collections and media libraries",
      id: "collections",
      items: collectionItems,
      label: "Collections",
    },
    {
      description: "Page content, navigation, and sitewide settings",
      id: "globals",
      items: globalItems,
      label: "Globals",
    },
    {
      description: "Admin home and account controls",
      id: "system",
      items: [
        {
          href: formatAdminURL({ adminRoute }),
          icon: "dashboard",
          id: "system-dashboard",
          keywords: ["home", "overview"],
          kind: "system",
          label: "Dashboard",
        },
        {
          href: formatAdminURL({ adminRoute, path: accountRoute }),
          icon: "account",
          id: "system-account",
          keywords: ["profile", "user"],
          kind: "system",
          label: "Account",
        },
      ],
      label: "System",
    },
  ];

  const renderedSettingsMenu = Array.isArray(settingsMenu)
    ? settingsMenu.map((item, index) =>
        RenderServerComponent({
          clientProps,
          Component: item,
          importMap: payload.importMap,
          key: `settings-menu-item-${index}`,
          serverProps,
        }),
      )
    : [];

  const logoutControl = RenderServerComponent({
    clientProps,
    Component: logout?.Button,
    Fallback: Logout,
    importMap: payload.importMap,
    serverProps,
  });

  const renderedBeforeNav = RenderServerComponent({
    clientProps,
    Component: beforeNav,
    importMap: payload.importMap,
    serverProps,
  });

  const renderedBeforeLinks = RenderServerComponent({
    clientProps,
    Component: beforeNavLinks,
    importMap: payload.importMap,
    serverProps,
  });

  const renderedAfterLinks = RenderServerComponent({
    clientProps,
    Component: afterNavLinks,
    importMap: payload.importMap,
    serverProps,
  });

  const renderedAfterNav = RenderServerComponent({
    clientProps,
    Component: afterNav,
    importMap: payload.importMap,
    serverProps,
  });

  return (
    <SidebarClient
      afterLinks={renderedAfterLinks}
      afterNav={renderedAfterNav}
      beforeLinks={renderedBeforeLinks}
      beforeNav={renderedBeforeNav}
      logoutControl={logoutControl}
      sections={sections}
      settingsMenu={renderedSettingsMenu}
    />
  );
}
