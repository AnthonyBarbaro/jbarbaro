# Payload Admin Redesign Audit

## Context
- Project: Jason Barbaro storefront CMS admin
- Payload version: 3.79.0
- Admin route: `/cms`
- Current theme mode: dark
- Audit date: March 6, 2026

## Current Nav Structure

### Collections
- Users
- Media
- Categories
- Brands
- Locations
- Testimonials
- Swatches
- Posts

### Globals
- Site Settings
- Navigation
- Home Page
- About Page
- Our History Page
- Services Content
- Contact Page
- Reviews Page
- Schedule Page
- Rentals Page
- Wedding Page
- Designers Page
- For Men Page
- Locations Page Content
- Tailored Page
- Blog Index
- Style Guide Index

### System / Utility Areas
- Settings menu via gear popup
- Logout action
- Mobile nav toggler

## Current UI Pain Points

### Sidebar / Navigation
- Sidebar is visually cramped. Items stack with too little vertical spacing and read like a dense list instead of clear sections.
- Sidebar width is too narrow for long labels such as `Locations Page Content` and `Services Content`, which hurts scan speed.
- Grouping is technically present, but the visual hierarchy is weak. `Collections` and `Globals` do not feel like strong sections.
- Click targets are undersized relative to an editorial/admin workflow.
- Hover and active states are too subtle and do not provide strong orientation.
- Keyboard focus states are not prominent enough for reliable navigation.
- There is no type-to-filter search for admins managing a long list of globals.
- There is no quick-access concept for high-frequency content such as Home Page, Navigation, Site Settings, Posts, or Tailored Page.
- Sidebar scroll behavior feels flat and unstructured. There is no sticky utility area above the nav list.

### Overall Visual Hierarchy
- Current dark theme is close to pure black, which creates harsh contrast and makes the UI feel unfinished instead of premium.
- Surfaces do not separate clearly enough from the page background.
- Typography hierarchy is weak in list views and edit views.
- Spacing between major admin regions is inconsistent.

### Dashboard / Cards
- Dashboard cards need more breathing room and clearer surface treatment.
- Empty and informational states feel utilitarian rather than intentional.
- Card borders and elevation are too faint to help scanning.

### Lists / Tables
- Table rows feel compressed.
- Filter/search controls and list headers do not have enough separation.
- Dense headers and low-contrast separators make list views harder to parse than necessary.

### Forms / Edit Views
- Panels, groups, and controls need stronger spacing rhythm.
- Inputs blend together too much in dark mode.
- Document controls need stronger visual separation from the rest of the edit screen.

## Screenshot References
- User-provided screenshot in this conversation: `Categories` list view showing the current cramped sidebar, narrow nav, dense table rows, and flat black background.
- Current local implementation reference: `src/app/(payload)/custom.scss` only overrides a small set of dark theme variables, leaving most admin layout defaults intact.

## Proposed Improvements

### Navigation / Sidebar
- Replace the default nav with a custom Payload `admin.components.Nav` implementation.
- Increase desktop sidebar width to approximately `320px`.
- Add a branded sticky sidebar header with title, helper copy, and search input.
- Split nav into explicit sections: `Favorites`, `Collections`, `Globals`, `System`.
- Add collapsible groups with persistent `localStorage` state.
- Add search/filter across collections and globals.
- Add pin/unpin favorites with persistent `localStorage` state.
- Add consistent icons for each nav item.
- Increase row height to a `44px` minimum, with larger padding and improved line-height.
- Improve active state with a stronger surface highlight, accent bar, and text emphasis.
- Improve hover and keyboard focus states.
- Make sidebar header sticky and keep nav content independently scrollable.

### Theme / Visual System
- Move admin styling into `src/admin/admin.scss` as the single theme entrypoint.
- Shift from pure black to layered charcoal surfaces.
- Use muted gold as the main accent and steel-blue for supporting interactive/focus states.
- Introduce consistent border, radius, spacing, and shadow tokens.
- Tune text colors for high contrast without harsh white-on-black fatigue.

### Dashboard / Content Views
- Increase spacing across dashboard widgets and list/edit screens.
- Improve card surfaces, borders, and subtle elevation.
- Improve table row spacing and control spacing.
- Improve form field grouping, input backgrounds, and edit header clarity.
- Improve modal, popup, and empty-state presentation so the admin feels finished rather than default.

## Implementation Notes
- Payload 3.79.0 supports replacing the full nav through `admin.components.Nav`.
- This repo does not expose a separate admin CSS config field in the current Payload setup, so the admin stylesheet will be centralized in `src/admin/admin.scss` and imported from the Payload app layout.
- Slugs, auth, endpoints, and database models remain unchanged.
