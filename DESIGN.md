# Commander Roulette — design

## Direction

A game-table journal: warm paper, forest ink, confident serif typography and practical controls. The identity comes from the type, logo and actual Magic cards. Use the existing workshop background as atmospheric scenery under a theme-aware veil. Preserve readable text. Avoid repeated rounded containers, oversized empty boxes and ornamental shadows.

## Palette and type

- Light canvas: `#f2efe6`; ink: `#283a31`; accent: `#38634f`.
- Dark canvas: `#171f1b`; headings: `#ebe6d7`; accent: `#9bb79e`.
- Copper action accent: `#c78050`, with dark button text `#241b14` and hover `#db996b`. Section labels and hovered links use `#874621` in light mode and `#dda071` in dark mode. Keep copper concentrated on the draw action and small wayfinding details.
- Dark fields: `#202b24`, with light text. Honor the system theme.
- The wordmark uses the existing self-hosted Cinzel. Editorial headings use Georgia, regular weight, with close tracking. Controls and supporting text use Segoe UI Variable / Aptos / system sans.
- Small numbered section labels distinguish setup from results. Use tabular numbers for the player count.

## Composition

The shell has a 1200px maximum width. The header gives the existing logo a prominent 136 × 148px frame beside the wordmark, with card-language selection on the right. On small phones the logo uses an 88 × 96px frame and the controls can wrap. A fine rule separates the header from the table.

The full-width setup stage has a title and actual player count, then a two-column player roster and a narrower draw-control area. On small screens these stack. Inputs resemble lines in a roster; Add player is a compact text action. The primary Draw commanders button is copper, distinct from the forest-green surroundings. Its disabled state is muted warm brown.

Before a draw, a short editorial invitation and a small rules note fill the result area without another panel. The note moves below the invitation on narrow screens. After a draw, each player has a distinct row of commander options. Card columns are capped at 260px so one or two choices do not become enormous. Preserve the card aspect ratio, flip interaction and resource links.

## Surfaces and interaction

Use space and thin rules for structure. No shadows on the main panels or commander containers. Controls have a restrained 4px radius; player inputs have an underline. Menus retain a raised surface because they overlay content.

Keep 44px targets, visible keyboard focus, semantic headings, real loading and error feedback, and reduced-motion support. The card's modest hover lift and existing face flip remain. No continuous decorative animation.

## Preserved product behavior

Player addition, removal and renaming; commander count; whole-table and individual draws; rerolls; supported card languages; sharing and read-only shared draws; EDHREC links; double-faced cards; fan-content attribution.

The header wordmark opens a new table. UI copy remains English; language selection controls card print language.
