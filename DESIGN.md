---
name: Commander Roulette
description: A focused Commander deckbuilding challenge for a shared game table.
colors:
  forest: "#295a4b"
  forest-deep: "#1f4d40"
  forest-action: "#315e4e"
  mint: "#dcebe2"
  canvas: "#edf1ed"
  surface: "#fbfcfa"
  ink: "#1d2831"
  heading: "#202c27"
  muted: "#66766f"
  border: "#d6dfd9"
  danger: "#9a342c"
  dark-canvas: "#111916"
  dark-surface: "#18261f"
typography:
  display:
    fontFamily: "Segoe UI Variable, Aptos, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.2vw, 3.3rem)"
    fontWeight: "700"
    lineHeight: "0.98"
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Segoe UI Variable, Aptos, system-ui, sans-serif"
    fontSize: "1.42rem"
    fontWeight: "700"
    letterSpacing: "-0.045em"
  collectionTitle:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "clamp(1.2rem, 2.3vw, 2.15rem)"
    fontWeight: "700"
    lineHeight: "0.98"
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Segoe UI Variable, Aptos, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: "1.5"
  label:
    fontFamily: "Segoe UI Variable, Aptos, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: "750"
rounded:
  compact: "8px"
  control: "10px"
  card: "14px"
  panel: "16px"
spacing:
  tight: "8px"
  control: "10px"
  card: "14px"
  standard: "16px"
  panel: "24px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "#f7fbf8"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.forest-deep}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.forest-action}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  field:
    backgroundColor: "#fdfefd"
    textColor: "#25312c"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  card:
    backgroundColor: "#fafcf9"
    textColor: "#24302a"
    rounded: "{rounded.card}"
    padding: "12px"
---

# Design System: Commander Roulette

## Overview

**Creative North Star: "The Creative Deckbuilding Collector’s Workshop"**

Commander Roulette feels like a well-kept play table where a group can begin a deckbuilding challenge without ceremony. Forest green, pale paper surfaces, and the card art provide the atmosphere; the interface stays quiet enough for player names, choices, and commanders to do the work.

The system is intentionally sober and efficient. Its personality comes from measured craft: a custom emblem, soft paper-like surfaces, practical card treatment, and restrained movement that confirms an action. It must never compete with the actual Magic card images or make a simple draw feel like a dashboard.

**Key Characteristics:**

- Calm forest-and-parchment utility, with card artwork as the main visual content.
- A full-width pod roster that carries setup directly into a broad commander-results field.
- Softly lifted working surfaces, never decorative glass or heavy chrome.
- A recognizable framed logo that anchors the header without becoming a hero element.
- Friendly, direct copy with a small amount of game-table warmth.

## Colors

The palette is a muted workshop palette: dark evergreen carries commitment, pale greens organize action, and off-white surfaces preserve the legibility of the card art.

### Primary

- **Workshop Forest**: the main action color for the draw button, the logo, and high-confidence actions.
- **Deep Evergreen**: the hover state for primary commitment, used sparingly to retain a calm hierarchy.
- **Table Green**: the quieter action color for secondary controls, language selection, and text links.

### Secondary

- **Sleeve Mint**: a pale green surface for counts, selected options, and low-emphasis interaction feedback.

### Neutral

- **Paper Canvas**: the light application background; it keeps the page warm without reading as beige.
- **Card Surface**: the near-white container surface for panels, inputs, and cards.
- **Table Ink**: the main text color; headings use the slightly darker heading tone for authority.
- **Quiet Copy**: supporting text and legal copy only; it must not replace primary text.
- **Soft Divider**: the low-contrast structural line for panels and sections.
- **Night Table / Night Surface**: the dark-mode canvas and card surface; preserve their green cast rather than switching to neutral gray.

**The Card-Art Rule.** Color supports the draw flow; it never recolors, frames aggressively, or competes with the commander image.

## Typography

**Display Font:** Segoe UI Variable, with Aptos and the system sans-serif as fallbacks.

**Body Font:** Segoe UI Variable, with Aptos and the system sans-serif as fallbacks.

**Character:** A high-legibility system sans keeps the multiplayer tool efficient and familiar. The panel title alone uses self-hosted Cinzel, giving the collector's workshop a recognisable fantasy signature without affecting controls or card data.

### Hierarchy

- **Display**: used only by the empty-result invitation; the compact line-height and negative tracking make the first-draw prompt decisive without becoming theatrical.
- **Headline**: used for panel and result section titles; it establishes a clear working hierarchy at a modest scale.
- **Collection title**: used only for “Magic: The Gathering Commander Roulette” at the top-left of the player panel; self-hosted Cinzel gives the application a quiet fantasy-table identity.
- **Title**: used for player names and commander names; keep it compact so long card names remain readable.
- **Body**: used for instructions and supporting copy; use approximately 1.5 line-height and constrain explanatory paragraphs to their container.
- **Label**: used for button labels, controls, and status labels; use the established 750–800 weight range, never all caps unless an existing small eyebrow label calls for it.

**The Plain-Language Rule.** Every control names the result it produces. Interface copy is direct, friendly, and avoids collectible-game jargon unless the player needs that exact term.

## Layout

The primary screen uses a 1380px maximum application shell with a 40px outer gutter. On wide screens, the working area is a vertical Pod Circuit: a full-width roster stage sits above the broad commander-results field. Within the roster, player entries form a responsive grid while the card count and the single draw action occupy a distinct, narrow action zone. This makes the whole table visible before the draw.

Below 760px, the action zone moves below the player grid; below 620px it becomes a simple vertical stack. Outer gutters reduce to 14px per side, panels reduce their padding, and commander grids tighten from 14px to 10px gaps. Commander cards use responsive auto-fit columns with a 175px minimum, so the card content remains primary rather than squeezed into arbitrary fixed columns.

Use the existing spacing rhythm: 8–10px inside compact controls, 14–16px between card-level items, 24px within a panel, and 28px or more between distinct regions. Give headings more room above than below.

## Elevation & Depth

The interface is softly layered, not flat and not glossy. Panels, empty states, loading containers, and commander cards use low-contrast borders plus diffuse downward shadows to rise just enough from the paper canvas. A stronger shadow and a 3px upward lift appear only on commander-card hover or keyboard focus-within; controls otherwise communicate interaction through a restrained background or border change.

### Shadow Vocabulary

- **Working Panel** (`0 16px 40px rgb(44 72 60 / 0.07)`): ambient separation for the player panel, empty state, and loading surface.
- **Commander Card** (`0 12px 24px rgb(42 70 59 / 0.09)`): tighter elevation for a card with real card art.
- **Commander Card Active** (`0 16px 30px rgb(42 70 59 / 0.15)` plus `translateY(-3px)`): the sole pronounced lift, reserved for a card the player is inspecting.

**The Quiet Elevation Rule.** Shadows explain layers or interaction; they never become decoration, halos, or a substitute for structure.

## Shapes

Forms are gently rounded and compact: 8px for small action controls, 9–10px for inputs and standard buttons, 14px for commander cards, and 16px for large working panels. Borders are thin and muted green-gray. Card media is allowed to fill its familiar portrait proportion; no masking or ornamental clipping is added around it.

The custom logo is contained in a 48px rounded mark with a pale field so its green-and-ivory artwork stays legible in both themes. It is intentionally the strongest item in the header, but its muted border and flat surface keep it from competing with the draw action or commander cards. On compact mobile screens, it reduces to 42px. Flags remain small geometric SVGs with a 2px radius, never emoji replacements.

## Components

### Buttons

**Character:** Efficient tabletop controls with firm labels and quiet state changes.

- **Primary:** The full-width draw action uses Workshop Forest with light text, a 10px radius, 52px height, and a subtle downward shadow. Its hover deepens the forest; its disabled state loses elevation and becomes muted green-gray.
- **Secondary:** Share and reroll actions are transparent, green text buttons with a muted border and a 44px minimum target. Their hover is a pale mint fill, never a brighter accent.
- **Text and icon actions:** Reroll and remove remain visually light. Destructive hover moves to a restrained warm red field; do not make danger the default.
- **Focus:** Every interactive control uses the shared 3px translucent green outline with a 3px offset.

### Cards / Containers

**Character:** Paper-like working surfaces that frame information without pretending to be collectible cards themselves.

- **Pod roster:** A full-width 16px working panel. Its heading establishes the group, then a 30px-gapped roster/action split establishes the one draw action without turning settings into a sidebar.
- **Panels:** 16px radius, pale surface, muted 1px border, 24–30px padding, and the working-panel shadow.
- **Commander cards:** 14px radius, portrait card image first, then a compact 12px metadata block. Hover lifts only the card currently being inspected.
- **Empty state:** A large, calm, softly tinted container introduces the deckbuilding challenge before a draw. It is an invitation, not a marketing hero.

### Inputs / Fields

**Character:** Direct, dense, and easy to scan at the table.

- **Player input:** 44px height, 10px radius, near-white field, and 12px horizontal padding.
- **Number input:** Matches the player field but is 62px wide and centered for the per-player card count.
- **Focus:** The border changes to the active green and receives a low-opacity 3px green ring.

### Navigation

**Character:** A compact utility header rather than a product-navigation bar.

- **Brand:** A left-aligned 48px custom mark plus bold wordmark; it returns to a new draw. The logo gets a small pale frame and a quiet green hover shift, not a shadow or animation, so it remains recognizable without overpowering the working interface.
- **Language selector:** Right-aligned custom menu with a small SVG flag, concise label, and a caret that rotates on expansion.
- **Responsive behavior:** The header holds its two ends apart; explanatory header text, where present on the read-only view, hides below 620px rather than crowding controls.

### Loading & Transform States

**Character:** Clear operational feedback, not spectacle.

- **Initial loading:** A blocking paper-toned overlay names the real work and uses a 38px rotating green spinner.
- **Card loading:** Three portrait skeletons use a muted green shimmer.
- **Double-faced card:** The card image flips in 620ms with a purposeful 3D rotation. Reduced-motion preferences collapse this transition safely.

### Pod Circuit

**Character:** A compact multiplayer handoff from setup to choice.

- **Roster:** Player name fields retain their grid position before and after a draw, so the group’s order is never lost.
- **Action zone:** Card count and Draw commanders live together behind a 1px divider on wide screens; on narrow screens, they become the next clearly separated step.
- **Results field:** The empty invitation or the player lanes take the full width below the roster, keeping the commander options more visually important than setup controls.

## Do's and Don'ts

### Do:

- **Do** keep the draw action visually unmistakable with Workshop Forest and full-width placement in the roster action zone.
- **Do** establish the whole pod in a full-width roster before revealing individual commander lanes.
- **Do** let the framed Commander Roulette mark lead the header while keeping the Draw commanders action as the page’s strongest commitment.
- **Do** let commander images carry the visual variety; use the UI palette only to organize them.
- **Do** keep actions compact, explicit, and comfortably keyboard-focusable.
- **Do** give every pointer control a 44px minimum target, including language, reroll, removal, and card-count controls.
- **Do** preserve the light and dark systems as green-tinted workspaces, not generic white and black themes.
- **Do** use the existing short, eased transitions and honor `prefers-reduced-motion`.

### Don't:

- **Don't** introduce gradients, oversized hero treatments, dashboard metrics, or decorative illustration into the core draw flow.
- **Don't** use bright mana colors as general UI accents; mana symbols belong to the card information itself.
- **Don't** add heavy borders, glass effects, or hard-offset shadows around cards and panels.
- **Don't** make a secondary action visually compete with the Draw commanders button.
- **Don't** turn the logo into a hero graphic, add a heavy shadow, or animate it continually.
- **Don't** crowd small screens with header copy or force card names into unreadably dense layouts.
- **Don't** bring back a sticky settings sidebar that separates the player roster from the shared draw.
