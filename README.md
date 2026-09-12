<p align="center">
  <a href="https://mtg-commander-roulette-pi.vercel.app/">
    <img src="src/assets/commander-roulette-logo.png" width="150" alt="Commander Roulette logo" />
  </a>
</p>

<h1 align="center">MTG Commander Roulette</h1>

<p align="center">A few unexpected picks. A deck you wouldn't usually build.</p>

<p align="center">
  <a href="https://mtg-commander-roulette-pi.vercel.app/"><strong>Try MTG Commander Roulette →</strong></a>
</p>

[![Commander Roulette demo: add players, draw commanders, and reroll one player's choices](docs/media/commander-roulette-demo.gif)](https://mtg-commander-roulette-pi.vercel.app/)

*A condensed walkthrough of the live site with Scryfall data preloaded in the browser cache. Actual commander choices are random; the first download may take a little while.*

## What is it?

Commander Roulette is a small Magic: The Gathering tool for friends who want a new deckbuilding challenge. Add the players at your table, choose how many commander options each person receives, and let chance decide the starting point.

Each player picks one of their drawn commanders, builds a deck around it, and meets the others for a game. Deckbuilding and games happen outside the app.

## How to play

1. Open [the live site](https://mtg-commander-roulette-pi.vercel.app/).
2. Use **Add player** to set up your table and enter everyone's name.
3. Set **Commanders per player** and click **Draw commanders**.
4. Choose one commander from your options. Follow the card's Scryfall link or its **EDHREC** link for more information and deckbuilding ideas.
5. Use **Share link** to send the table a read-only copy of the draw.

## Features

- **Distinct options across the table:** a commander is not assigned to multiple players in the same draw.
- **Flexible table setup:** add, rename, or remove players and choose the number of options per player.
- **Individual rerolls:** redraw one player's options while keeping everyone else's choices. **Reroll all** starts a fresh draw for the whole table.
- **Late arrivals:** add a player after a draw and deal their options without redrawing the others.
- **Card languages:** English, Spanish, French, German, Italian, and Japanese. The interface itself is in English; the selector changes the card prints.
- **Double-faced cards:** use **Transform** to view the other face when available.
- **Shareable draws:** player names and commander identifiers are encoded in the link, which opens in read-only mode.
- **Responsive layout:** works on desktop and mobile, with light and dark themes following your system preference.

## Card data and storage

Card data and images come from [Scryfall](https://scryfall.com/). The app uses Scryfall's `is:commander` search in the selected language; it does not independently validate a completed deck or your group's house rules.

Commander data is cached in your browser for 24 hours per language. The first draw or a new language may need a longer download. Brief network failures are retried automatically; a first load still needs a working connection to Scryfall.

There is no account or server-side draw database. Save a share link if you want to revisit a result. Anyone with that link can read the included player names and selections.

## Run locally

Use **Node.js 22.12 or newer**, with npm.

From the project directory:

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal, usually `http://localhost:5173`.

```sh
npm test       # Run the test suite
npm run build # Type-check and create the production build in dist/
```

No API key or environment variables are required.

## Deploy on Vercel

Import the repository into Vercel with these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | None required |

The current app uses `#share=…` links rather than server-side routes, so no custom routing configuration is needed.

## Built with

[React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/), [Vitest](https://vitest.dev/), and [Phosphor Icons](https://phosphoricons.com/). Hosted on [Vercel](https://vercel.com/).

## Credits

Commander Roulette is unofficial fan content and is not affiliated with or endorsed by Wizards of the Coast. Magic: The Gathering, card artwork, card text, and mana symbols belong to Wizards of the Coast, LLC and their respective rights holders.

Card data and images are provided by Scryfall. Deckbuilding links point to EDHREC. Neither service is affiliated with this project.
