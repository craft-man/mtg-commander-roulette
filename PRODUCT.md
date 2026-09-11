# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Inferred from the product workflow:** players of Magic: The Gathering Commander, primarily friends preparing a shared game session.
- Players enter a pod, receive a small set of commander options, choose one, and build a deck around it before playing each other.

## Product Purpose

Commander Roulette removes the “what should I play?” stall at the start of a Commander challenge. It gives every player a distinct, random set of legal commanders so the group can move quickly into deckbuilding and then play together.

## Positioning

Rather than recommending a single popular commander, Commander Roulette turns commander selection into a shared deckbuilding constraint: each player receives several distinct options, chooses one, and can share the resulting table without allowing it to be changed.

## Operating Context

- A browser-based tool used before a casual Commander game, a group deckbuilding session, or a community challenge.
- A player count and a configurable number of commanders per player define a draw.
- Each player can be drawn or rerolled individually after the initial draw, without changing other players’ options.
- A read-only hash link reproduces a completed draw for sharing.
- Card print images can be displayed in English, Spanish, French, German, Italian, or Japanese.

## Capabilities and Constraints

- Commander data and card images are retrieved from Scryfall; the initial language download can be slow and blocks the interface with a clear loading state.
- Draws are client-side and use distinct commanders across the active players.
- Double-faced cards can be transformed with a visual flip interaction.
- Commander cards link to EDHREC. Moxfield integration is intentionally absent.
- Shared draws are view-only and must not expose draw or reroll actions.
- The product is a React, TypeScript, and Vite application. It has no server-side persistence in the current implementation.

## Brand Commitments

- Product name: **Commander Roulette**.
- Voice: friendly, concise, and playful without obscuring how the challenge works.
- A custom green-and-ivory Commander Roulette logo lives at `src/assets/commander-roulette-logo.png`.
- The existing footer states that the site is unofficial fan content, acknowledges Wizards of the Coast’s ownership of Magic: The Gathering information and symbols, and clarifies that Scryfall is independent.

## Evidence on Hand

- Working product flows and UI copy in `src/App.tsx` and `src/components/`.
- Scryfall card mapping and language support in `src/services/scryfall.ts`.
- No testimonials, customer research, pricing information, or external performance claims are available; future work must not invent them.

## Product Principles

1. Turn commander selection into a fun, fair shared challenge.
2. Keep setup quick and understandable for every player at the table.
3. Preserve each player’s result when only one player needs another option.
4. Make a finished draw easy to share and safe to view without altering it.
5. Treat card information, language, and fan-content attribution accurately.

## Accessibility & Inclusion

- Use clear, action-oriented English UI labels and loading/error messages.
- Keep controls operable with keyboard and communicate dynamic results and loading states to assistive technology.
- Allow card images to follow the selected supported language while maintaining the same commander selection.
