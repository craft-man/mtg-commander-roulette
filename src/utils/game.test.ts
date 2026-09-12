import { describe, expect, it } from "vitest";
import type { Commander } from "../models/Commander";
import type { PlayerDraw } from "../models/PlayerDraw";
import type { PlayerGameStates } from "../models/PlayerGameState";
import { createPlayerGameStates, getRerollEligiblePlayerIds, spendJokers } from "./game";

const commanders: Commander[] = Array.from({ length: 4 }, (_, index) => ({
  id: `commander-${index}`,
  oracleId: `oracle-${index}`,
  name: `Commander ${index}`,
  colors: [],
  colorIdentity: [],
  imageUrl: "https://example.com/card.jpg",
  edhrecUrl: "https://edhrec.com/commanders/example",
  scryfallUrl: "https://scryfall.com",
}));

const draws: PlayerDraw[] = [
  { player: { id: "alice", name: "Alice" }, commanders: commanders.slice(0, 2) },
  { player: { id: "bob", name: "Bob" }, commanders: commanders.slice(2, 4) },
];

describe("player game state", () => {
  it("starts every player with the configured joker allowance and no fixed cards", () => {
    expect(createPlayerGameStates(draws.map((draw) => draw.player), 2)).toEqual({
      alice: { jokersRemaining: 2, lockedCommanderOracleIds: [] },
      bob: { jokersRemaining: 2, lockedCommanderOracleIds: [] },
    });
  });

  it("selects only players who have a joker and at least one unfixed commander", () => {
    const states: PlayerGameStates = {
      alice: { jokersRemaining: 1, lockedCommanderOracleIds: [commanders[0].oracleId] },
      bob: {
        jokersRemaining: 1,
        lockedCommanderOracleIds: draws[1].commanders.map((commander) => commander.oracleId),
      },
    };

    expect(getRerollEligiblePlayerIds(draws, states)).toEqual(["alice"]);
    states.alice.jokersRemaining = 0;
    expect(getRerollEligiblePlayerIds(draws, states)).toEqual([]);
  });

  it("spends one joker only for players included in a partial global reroll", () => {
    const states = createPlayerGameStates(draws.map((draw) => draw.player), 2);
    const updated = spendJokers(states, new Set(["alice"]));

    expect(updated.alice.jokersRemaining).toBe(1);
    expect(updated.bob.jokersRemaining).toBe(2);
    expect(states.alice.jokersRemaining).toBe(2);
  });

  it("never lets a joker counter become negative", () => {
    const states: PlayerGameStates = {
      alice: { jokersRemaining: 0, lockedCommanderOracleIds: [] },
    };

    expect(spendJokers(states, new Set(["alice"])).alice.jokersRemaining).toBe(0);
  });
});
