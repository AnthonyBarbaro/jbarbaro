---
name: "J. Barbaro Clothiers"
description: "A composed, merchandise-first digital clothier that connects premium shopping with personal fit."
colors:
  ink: "#0b0f14"
  ivory: "#ffffff"
  stone: "#f4f6f8"
  product-canvas: "#f3f1ed"
  gold: "#c7a46a"
  deep-teal: "#0f5b5b"
  smoke: "#6b7280"
  sale: "#8f2632"
typography:
  display:
    fontFamily: "Playfair Display, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif"
    fontSize: "2.8rem"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "normal"
  headline:
    fontFamily: "Playfair Display, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.16em"
rounded:
  md: "0.375rem"
  lg: "0.5rem"
  full: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section-sm: "3rem"
  section-lg: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.25rem"
    height: "2.75rem"
  button-secondary:
    backgroundColor: "{colors.ivory}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.25rem"
    height: "2.75rem"
  button-teal:
    backgroundColor: "{colors.deep-teal}"
    textColor: "{colors.ivory}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.25rem"
    height: "2.75rem"
  button-commerce:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ivory}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.875rem 1.25rem"
    height: "3.5rem"
  card:
    backgroundColor: "{colors.ivory}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
  input:
    backgroundColor: "{colors.ivory}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.625rem 0.75rem"
    height: "2.75rem"
---

# Design System: J. Barbaro Clothiers

## Overview

**Creative North Star: "The Modern Clothier's Floor"**

The interface should feel like entering a well-run independent menswear store: composed at the threshold, merchandise-forward once browsing begins, and personally helpful when fit or occasion creates uncertainty. Editorial type and campaign imagery establish authority; clear product grids, prices, filters, and shopping actions make the experience commercially direct.

Luxury comes from proportion, restraint, product presentation, and knowledgeable service—not from hiding utility or adding ornamental friction. The system is bright and breathable, with dark ink anchoring navigation and trust moments, brass-gold reserved for decisive commercial emphasis, and deep teal carrying fit guidance and service actions.

**Key Characteristics:**

- Merchandise-first layouts with a clear route from discovery to product.
- Editorial serif headlines paired with compact, highly legible commerce typography.
- Restrained gold emphasis and trustworthy deep-teal service cues.
- Bright product surfaces, quiet borders, and low ambient elevation.
- Direct shopping controls supported by human fit expertise.

## Colors

The palette is a clean showroom foundation with two disciplined accents: Tailor's Brass for high-value emphasis and Fitting-Room Teal for guidance, fit, and service.

### Primary

- **Tailor's Brass:** The rare commercial accent for primary calls to action, selected states, and premium emphasis.
- **Fitting-Room Teal:** The service and guidance accent for fit tools, helpful links, focus states, and secondary commercial actions.

### Neutral

- **Midnight Ink:** Primary text, dark brand surfaces, overlays, and the footer.
- **Gallery White:** The main canvas and product-card surface.
- **Fitting-Room Stone:** Alternating sections, filter backgrounds, and quiet grouped surfaces.
- **Product Canvas:** A warm, near-white stage that keeps product cutouts consistent across cards, search, cart, and product detail.
- **Soft Smoke:** Supporting copy, metadata, placeholders, and subdued labels.

### State

- **Sale Oxblood:** Sale pricing and genuine promotional states only. It is not a decorative accent.

**The Two-Accent Rule.** Gold signals decisive commercial emphasis; teal signals guidance and service. Do not use both to compete for the same action.

**The Product-First Canvas Rule.** Product imagery sits on the dedicated warm Product Canvas unless campaign art explicitly calls for a dark editorial treatment.

## Typography

**Display Font:** Playfair Display (with Palatino and Georgia fallbacks)

**Body Font:** Inter (with Segoe UI, Helvetica, and Arial fallbacks)

**Character:** Playfair gives campaign and section headlines the authority of a clothier's editorial voice. Inter keeps product names, prices, filters, forms, and transactional states fast to scan.

### Hierarchy

- **Display** (regular, 2.8rem rising to 4.5rem, 0.98 line-height): Hero and campaign statements only.
- **Headline** (regular, 2.25rem rising to 3rem, approximately 1.1 line-height): Major merchandising and service sections.
- **Title** (semibold, 1rem, 1.5 line-height): Product names, card titles, and action-oriented subheads.
- **Body** (regular, 1rem, 1.75 line-height): Descriptions and guidance, generally kept below 70 characters per line.
- **Label** (semibold, 0.75rem, 0.16em letter-spacing, uppercase): Buttons, badges, filters, product metadata, and short retail signposts.

**The Serif Has a Job Rule.** Use the display face for editorial hierarchy, not for prices, filters, form labels, availability, or cart mechanics.

**The Price Must Scan Rule.** Prices use the sans-serif face with stronger weight and tighter tracking than surrounding metadata.

## Layout

The public site uses a centered 80rem content container with 1rem mobile gutters, 1.5rem tablet gutters, and 2rem desktop gutters. Storefront navigation and dense catalog surfaces may expand to 84rem. Major sections use 3rem to 4rem of vertical padding; related controls and card content use the tighter 0.5rem to 2rem spacing scale.

Merchandising grids begin at two columns on narrow screens, progress through three columns, and reach four columns where image and title legibility remain comfortable. Product detail and cart layouts become asymmetric two-column compositions on desktop while preserving a single, obvious purchase path on mobile. Horizontal rails are reserved for category discovery and compact curated sets, not the primary catalog.

Responsive decisions occur at the incumbent Tailwind breakpoints: 40rem, 48rem, 64rem, 80rem, and 96rem. Interactive controls maintain at least a 2.75rem target, with primary purchase actions generally 3.5rem high.

**The Browse Before Brand Story Rule.** On commerce entry surfaces, category and product discovery appear before extended showroom, history, or service storytelling.

## Elevation & Depth

The system is flat by default. Thin low-contrast borders and alternating neutral surfaces create structure; small ambient shadows separate cards and controls only when tonal contrast is insufficient. Larger shadows belong to temporary layers such as search results, drawers, dropdowns, and lightboxes.

### Shadow Vocabulary

- **Quiet Surface:** A minimal small shadow with very low ink opacity for cards on white or stone.
- **Luxe Ambient:** A broad, heavily diffused shadow for editorial media and elevated feature surfaces.
- **Temporary Layer:** A directional or deep shadow for menus, drawers, search results, and overlays.

**The Flat-at-Rest Rule.** Product cards stay visually quiet at rest and gain emphasis through border, image, or slight position changes on interaction.

## Shapes

The core form language uses gently squared corners: medium corners for controls and large corners for cards. Pills are reserved for badges, filters, status, and compact selection controls. Large editorial imagery may use broader clipping, but routine commerce surfaces should not mix many competing radii.

**The Radius by Role Rule.** Controls use medium corners, cards use large corners, and pills communicate metadata or selectable facets.

## Components

### Buttons

- **Shape:** Compact and gently squared with medium corners.
- **Primary:** Brass background, ink text, uppercase label typography, and a quiet shadow.
- **Hover / Focus:** A warmer brass hover and a visible four-pixel tonal focus ring; active state compresses subtly.
- **Secondary:** White or transparent surface with an ink border; used for lower-priority navigation and supporting actions.
- **Teal:** Deep teal with white text; used for fit, service, and strong secondary commerce actions.
- **Commerce:** Ink with white text and a taller 3.5rem target; reserved for add-to-bag and checkout actions.

### Badges and Filter Pills

- **Style:** Uppercase compact labels; gold and teal carry semantic emphasis while neutral pills identify passive metadata.
- **State:** Selected filter pills may invert to ink or teal. Decorative badges never masquerade as controls.

### Cards / Containers

- **Corner Style:** Gently curved large corners.
- **Background:** White for card copy, Product Canvas for product imagery, and stone for grouped supporting content.
- **Shadow Strategy:** Quiet at rest, with border or small positional feedback on hover.
- **Border:** Thin ink tint to preserve separation on bright surfaces.
- **Internal Padding:** Usually 1.25rem, rising to 1.5rem or 1.75rem for larger editorial cards.

### Inputs / Fields

- **Style:** White surface, thin ink-tint border, medium corners, and body typography.
- **Focus:** Border shifts to teal with a broad low-opacity teal ring.
- **Error / Disabled:** Error copy remains adjacent to the field; disabled controls preserve readable labels and clearly reduced affordance.

### Navigation

The header is sticky, light, and commercially useful: logo, product search, account, and bag are primary utilities. Main navigation uses restrained sans-serif labels, tonal active states, and image-supported dropdowns only where they accelerate category discovery. Mobile navigation uses a trapped drawer with large, explicit targets.

### Product Card

Product cards use a consistent image stage, vendor eyebrow, two-line product title, and strongly weighted price. Sale, sold-out, and fit-match labels occupy stable corners of the image without covering the product. Hover may reveal an alternate image and sharpen the border, but the card remains understandable without hover.

## Do's and Don'ts

### Do:

- **Do** put merchandise, categories, prices, filters, and purchase paths ahead of extended brand storytelling on shop surfaces.
- **Do** use real product and campaign imagery with stable aspect ratios and useful alternative text.
- **Do** preserve visible focus, 2.75rem minimum targets, and clear hover, loading, disabled, success, and error states.
- **Do** use gold sparingly for primary commercial emphasis and teal for fit or service guidance.
- **Do** keep Shopify data and repository content as the source of truth for prices, availability, brands, ratings, and claims.

### Don't:

- **Don't** turn the site into a generic marketplace or a discount-first visual system.
- **Don't** hide shopping utilities behind decorative luxury conventions.
- **Don't** use Playfair Display for dense transactional text, controls, prices, or form mechanics.
- **Don't** introduce new claims, badges, scarcity messages, testimonials, or promotional prices without real data.
- **Don't** add new corner, shadow, or accent treatments when an existing component role already fits.
