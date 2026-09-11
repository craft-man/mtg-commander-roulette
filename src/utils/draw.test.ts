import { describe, expect, it } from "vitest";
import type { Commander } from "../models/Commander";
import type { Player } from "../models/Player";
import { drawForPlayers, rerollPlayer } from "./draw";

const commanders: Commander[] = Array.from({ length: 20 }, (_, index) => ({
  id: `commander-${index}`,
  oracleId: `oracle-${index}`,
  name: `Commander ${index}`,
  colors: [],
  colorIdentity: [],
  imageUrl: "https://example.com/card.jpg",
  edhrecUrl: "https://edhrec.com/commanders/example",
  scryfallUrl: "https://scryfall.com",
}));

const players: Player[] = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
];

describe("commander draw", () => {
  it("deals three unique commanders to every player", () => {
    const draws = drawForPlayers(players, commanders);
    const ids = draws.flatMap((draw) => draw.commanders.map((commander) => commander.id));

    expect(draws).toHaveLength(2);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
  });

  it("rejects a draw when the pool is too small", () => {
    expect(() => drawForPlayers(players, commanders.slice(0, 5))).toThrow(
      "Not enough commanders available for this draw.",
    );
  });

  it("uses the requested number of commanders per player", () => {
    const draws = drawForPlayers(players, commanders, 5);
    const drawnCommanders = draws.flatMap((draw) => draw.commanders);

    expect(drawnCommanders).toHaveLength(10);
    expect(new Set(drawnCommanders.map((commander) => commander.id)).size).toBe(10);
  });

  it("rerolls one player without colliding with other assignments", () => {
    const draws = drawForPlayers(players, commanders);
    const rerolled = rerollPlayer(draws, "alice", commanders);
    const ids = rerolled.flatMap((draw) => draw.commanders.map((commander) => commander.id));

    expect(new Set(ids).size).toBe(6);
    expect(rerolled.find((draw) => draw.player.id === "bob")).toEqual(
      draws.find((draw) => draw.player.id === "bob"),
    );
  });
});
