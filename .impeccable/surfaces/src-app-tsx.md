---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/App.css","src/components/PlayerList.tsx","src/components/DrawResults.tsx"]
---

# Commander Roulette draw screen

**Scope & mode:** Operate. This is the whole draw screen for a group preparing a shared Commander deckbuilding challenge.

**Audience, job & constraints:** Friends set up a pod, choose a language and commander count, add or name players, draw unique commanders, reroll one player without changing the others, and share a read-only result. All existing behavior, the custom logo, accessibility, light/dark modes, and the collector’s-workshop identity remain intact.

## Direction contract

**THESIS:** The screen is a shared pod circuit: establish the whole table first, then open a generous, player-by-player commander field. It refuses the conventional narrow settings sidebar that feels detached from the group it controls.

**OWN-WORLD:** Forest green, pale workshop paper, muted dividers, compact system type, the existing framed logo, and real commander art. Working surfaces stay sober and quiet; card art supplies variation.

**STORY:** A player instantly sees who is at the table, what will be drawn, and the one next action. After drawing, every player can inspect their lane, reroll only their own result, transform a double-faced card, or share the completed pod.

**FIRST VIEWPORT:** A compact branded header leads into a full-width pod roster and draw controls. Below, a broad commander field is reserved for the empty invitation or the player lanes. The primary draw action is prominent in the roster stage; language remains a compact header utility.

**FORM:** The Pod Circuit, third in the grounded structure list and assigned by surface seed `316372d3`. Its signature interaction is the roster-to-results handoff: the same ordered player identities carry from setup into their commander lanes after a draw.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
