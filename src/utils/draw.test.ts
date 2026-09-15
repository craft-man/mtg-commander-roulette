import { describe, expect, it } from "vitest";
import type { Commander } from "../models/Commander";
import type { Player } from "../models/Player";
import { drawForPlayers, rerollPlayer, rerollPlayers } from "./draw";

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

  it("treats distinct print ids with the same oracle id as one commander", () => {
    const duplicatePrints = [
      ...commanders.slice(0, 5),
      { ...commanders[0], id: "commander-0-alt-art" },
    ];

    expect(() => drawForPlayers(players, duplicatePrints)).toThrow(
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

  it("keeps fixed commanders in place while replacing the other cards", () => {
    const draws = drawForPlayers(players, commanders);
    const alice = draws.find((draw) => draw.player.id === "alice")!;
    const fixedCommander = alice.commanders[1];
    const rerolled = rerollPlayer(
      draws,
      "alice",
      commanders,
      new Set([fixedCommander.oracleId]),
    );
    const rerolledAlice = rerolled.find((draw) => draw.player.id === "alice")!;

    expect(rerolledAlice.commanders[1]).toBe(fixedCommander);
    expect(rerolledAlice.commanders[0]).not.toBe(alice.commanders[0]);
    expect(rerolledAlice.commanders[2]).not.toBe(alice.commanders[2]);
    expect(new Set(rerolled.flatMap((draw) => draw.commanders.map((card) => card.id))).size).toBe(6);
  });

  it("rerolls several eligible players from one unique shared pool", () => {
    const draws = drawForPlayers(players, commanders);
    const aliceFixed = draws[0].commanders[0];
    const rerolled = rerollPlayers(
      draws,
      new Set(["alice", "bob"]),
      commanders,
      new Map([["alice", new Set([aliceFixed.oracleId])]]),
    );
    const ids = rerolled.flatMap((draw) => draw.commanders.map((card) => card.id));

    expect(rerolled[0].commanders[0]).toBe(aliceFixed);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns unchanged draws when every card for the player is fixed", () => {
    const draws = drawForPlayers(players, commanders);
    const alice = draws.find((draw) => draw.player.id === "alice")!;
    const lockedIds = new Set(alice.commanders.map((commander) => commander.oracleId));

    expect(rerollPlayer(draws, "alice", commanders, lockedIds)).toEqual(draws);
  });

  it("fails before changing any draw when the replacement pool is too small", () => {
    const draws = drawForPlayers(players, commanders.slice(0, 6));

    expect(() => rerollPlayers(draws, new Set(["alice", "bob"]), commanders.slice(0, 6))).toThrow(
      "Not enough commanders available for this draw.",
    );
    expect(draws.flatMap((draw) => draw.commanders)).toHaveLength(6);
  });
});
