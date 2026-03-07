# Admin Design System

## Intent
Create a Payload admin that feels premium, calm, and highly scannable for a luxury clothing brand. The UI should read as editorial and operational at the same time: refined, spacious, and practical.

## Theme Tokens

### Core Colors
- `--jb-admin-bg`: `#111315`
- `--jb-admin-panel`: `#171a1d`
- `--jb-admin-panel-raised`: `#1d2126`
- `--jb-admin-panel-soft`: `#20262c`
- `--jb-admin-border`: `rgba(255, 255, 255, 0.08)`
- `--jb-admin-border-strong`: `rgba(255, 255, 255, 0.14)`
- `--jb-admin-text`: `#f3efe7`
- `--jb-admin-text-muted`: `#b8b0a0`
- `--jb-admin-text-soft`: `#8e96a0`
- `--jb-admin-accent`: `#c6a56a`
- `--jb-admin-accent-soft`: `rgba(198, 165, 106, 0.16)`
- `--jb-admin-focus`: `#7aa6c2`
- `--jb-admin-focus-ring`: `rgba(122, 166, 194, 0.32)`
- `--jb-admin-success`: `#6ea985`
- `--jb-admin-warning`: `#d1a15f`
- `--jb-admin-danger`: `#d47c72`

### Elevation / Surfaces
- Base application background uses `--jb-admin-bg`
- Primary panels use `--jb-admin-panel`
- Interactive raised surfaces use `--jb-admin-panel-raised`
- Hover or selected soft states use `--jb-admin-panel-soft`
- Borders stay low-contrast and thin, but present on every major surface

### Shadows
- Panel shadow: `0 20px 40px rgba(0, 0, 0, 0.22)`
- Hover shadow: `0 12px 28px rgba(0, 0, 0, 0.16)`
- Focus ring: `0 0 0 1px var(--jb-admin-focus), 0 0 0 4px var(--jb-admin-focus-ring)`

## Typography
- Sidebar group labels: `11px`, uppercase, `0.14em` tracking
- Sidebar items: `13px` to `14px`
- Utility/helper copy: `12px`
- Page body text: `14px`
- Important titles: preserve Payload defaults but increase spacing and weight contrast

## Spacing Scale
- `--jb-space-1`: `4px`
- `--jb-space-2`: `8px`
- `--jb-space-3`: `12px`
- `--jb-space-4`: `16px`
- `--jb-space-5`: `20px`
- `--jb-space-6`: `24px`
- `--jb-space-7`: `28px`
- `--jb-space-8`: `32px`

## Radius
- Small controls: `10px`
- Nav items / pills: `12px`
- Panels / cards: `18px`
- Large surfaces: `24px`

## Sidebar Rules
- Desktop width target: `320px`
- Mobile width target: `min(92vw, 340px)`
- Item height: `44px` minimum
- Item icon size: `18px`
- Group header padding: `12px 16px`
- Section dividers use `1px` border with low-opacity white
- Sidebar header remains sticky
- Only nav content scrolls
- Active item uses:
  - left accent bar
  - higher contrast text
  - tinted background
- Favorites section appears first when populated

## Interaction Rules
- Hover states tint the background slightly and never shift layout
- Focus states must be visible on dark surfaces and keyboard-friendly
- Group expand/collapse uses short opacity/height transitions
- Search filters instantly on input
- Favorites and collapse state persist with `localStorage`

## Lists / Tables
- Increase perceived row height
- Add clear panel boundary around table containers
- Make headers easier to parse using softer backgrounds and subtle separators
- Preserve existing Payload table behavior and controls

## Forms / Edit Views
- Inputs use raised charcoal surfaces instead of flat black
- Groups and cards receive larger internal padding
- Document controls sit on a clearer surface with better separation
- Buttons retain Payload semantics but gain more refined spacing and surface contrast

## Accessibility
- Maintain AA contrast for text and primary interactive elements
- Focus styles remain visible on every custom control
- Search, favorite toggles, and group collapse buttons remain keyboard-operable
- Avoid relying on color alone for active state; use position, surface, and iconography too

## Implementation Notes
- `src/admin/admin.scss` is the single admin theme entrypoint.
- Sidebar behavior lives in custom admin components registered through `admin.components.Nav`.
- The design system should apply consistently across login, dashboard, list views, edit screens, popups, and modals.
