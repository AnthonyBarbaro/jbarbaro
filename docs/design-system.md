# J. Barbaro Clothiers Design System

## Brand Direction

A premium menswear visual language with editorial typography, generous whitespace, and high-contrast, conversion-oriented UI.

## Color Tokens

Defined in `src/app/globals.css` with Tailwind v4 `@theme inline`.

- `ink` `#0B0F14`
  - Primary text, navigation, dark surfaces, high-emphasis sections.
- `ivory` `#FAF7F2`
  - Base page background and light cards.
- `stone` `#E7DED3`
  - Alternate section background, utility surfaces.
- `gold` `#C7A46A`
  - Primary accent, CTA hover/focus cues, highlight chips.
- `deep-teal` `#0F5B5B`
  - Secondary accent, links, information highlights.
- `smoke` `#6B7280`
  - Muted body copy, metadata, secondary labels.

## Wave Gradient Tokens

- Wave A: `linear-gradient(90deg, rgba(199,164,106,0.35), rgba(15,91,91,0.35))`
- Wave B: `linear-gradient(90deg, rgba(15,91,91,0.30), rgba(11,15,20,0.25))`
- Wave C: `linear-gradient(90deg, rgba(231,222,211,1), rgba(250,247,242,1))`

Implemented with:

- `src/components/ui/WaveDivider.tsx`
- `src/components/ui/WaveSection.tsx`

### Wave Usage Rules

- Use `A` when transitioning from high-emotion hero or dark section into core marketing content.
- Use `B` for mid-page momentum changes or dark-to-light section transitions.
- Use `C` as a soft neutral bridge between content-heavy sections (`stone`/`ivory`).
- Prefer 1 top and 1 bottom wave max per section to avoid visual noise.

## Typography Scale

- Heading font: `Playfair Display` (`font-heading`)
- Body font: `Inter` (`font-sans`)

Scale usage:

- H1: `text-4xl` to `text-7xl` (hero/page titles)
- H2: `text-3xl` to `text-5xl` (section titles)
- H3: `text-2xl` to `text-3xl` (cards/modules)
- Body large: `text-lg` or `text-xl` for intro leads
- Body: `text-sm` to `text-base` with `leading-7`/`leading-8`
- Metadata/chips: `text-xs` + uppercase tracking

## Spacing System

- Section rhythm: `py-16` / `sm:py-20`
- Card padding: `p-6` / `sm:p-7`
- Container width: `max-w-7xl`
- Standard content gap: `gap-4` / `gap-6` / `gap-8`

## Core Components

### Buttons

`src/components/ui/Button.tsx`

Variants:

- `primary` (ink background, ivory text, gold hover)
- `secondary` (outlined, neutral)
- `teal` (deep-teal emphasis)
- `ghost` (low-emphasis utility)

Sizes:

- `sm`, `md`, `lg`

### Cards

`src/components/ui/Card.tsx`

- Rounded `3xl`, subtle border, luxe shadow.
- Tones: `ivory`, `stone`, `ink`.
- Use `CardContent` for consistent internal spacing.

### Badges

`src/components/ui/Badge.tsx`

- Variants: `gold`, `teal`, `neutral`.
- Used for section eyebrows, status chips, and category labels.

### Form Fields

`src/components/ui/Field.tsx`

- Shared style for `Input`, `Select`, `Textarea`.
- Rounded `2xl`, strong focus ring, high contrast placeholders.

## Page Templates

- Marketing template: `PageHero` + `WaveSection` + card grids + CTA rails.
- Content template (MDX): breadcrumbs + editorial header + constrained reading width + related CTA cards.
- Directory template: hero + search/filter + grouped cards and A–Z jumps.
- Form template: two-column layout with trust/support sidebar and high-clarity field styling.

## Interaction and Motion

- Use subtle `hover:-translate-y-1`, `transition-all duration-300` for cards/buttons.
- Carousel motion remains lightweight with fade transitions.
- Avoid heavy JS-driven animations; prefer CSS transitions and server rendering.

## Accessibility Baseline

- One H1 per page.
- Strong contrast against `ivory`, `stone`, and `ink` backgrounds.
- Focus-visible rings on inputs and buttons.
- Semantic labels and ARIA attributes preserved on navigation and forms.
