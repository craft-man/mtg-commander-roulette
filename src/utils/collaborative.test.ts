import { describe, expect, it } from "vitest";
import type { Commander } from "../models/Commander";
import {
  createCollaborativeUrl,
  createPublishGameInput,
  hydrateGameSnapshot,
  readCollaborativeAccess,
} from "./collaborative";

const commander: Commander = {
  id: "print-id",
  oracleId: "oracle-id",
  name: "Commander",
  colors: [],
  colorIdentity: [],
  imageUrl: "https://example.com/card.jpg",
  edhrecUrl: "https://edhrec.com/commanders/example",
  scryfallUrl: "https://scryfall.com/card/example",
};

describe("collaborative game URL and hydration", () => {
  it("keeps the secret access token in the URL fragment", () => {
    const url = createCollaborativeUrl("game-id", "secret-token", new URL("https://roulette.example/app") as unknown as Location);
    expect(new URL(url).search).toBe("");
    expect(readCollaborativeAccess(new URL(url).hash)).toEqual({ gameId: "game-id", token: "secret-token" });
  });

  it("publishes locks and remaining jokers, then hydrates a private row", () => {
    const input = createPublishGameInput(
      [{ player: { id: "local-player", name: "Alice" }, commanders: [commander] }],
      { "local-player": { jokersRemaining: 1, lockedCommanderOracleIds: ["oracle-id"] } },
      "en",
      1,
      2,
    );
    expect(input.players[0]).toEqual({
      name: "Alice",
      jokersRemaining: 1,
      commanderOracleIds: ["oracle-id"],
      lockedCommanderOracleIds: ["oracle-id"],
    });

    expect(hydrateGameSnapshot({
      id: "game-id",
      language: "en",
      cardsPerPlayer: 1,
      jokersPerPlayer: 2,
      revision: 1,
      expiresAt: "2026-10-01T00:00:00.000Z",
      players: [{
        id: "server-player",
        position: 0,
        name: "Alice",
        jokersRemaining: 1,
        revision: 4,
        commanderOracleIds: ["oracle-id"],
        lockedCommanderOracleIds: ["oracle-id"],
      }],
    }, [commander])).toEqual({
      draws: [{ player: { id: "server-player", name: "Alice" }, commanders: [commander] }],
      playerGameStates: { "server-player": { jokersRemaining: 1, lockedCommanderOracleIds: ["oracle-id"] } },
    });
  });
});
