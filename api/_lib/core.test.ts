import { afterEach, describe, expect, it } from "vitest";
import {
  ApiError,
  drawOracleIds,
  signAccessToken,
  validatePublishInput,
  verifyAccessToken,
} from "./core";

const originalSecret = process.env.ACCESS_TOKEN_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.ACCESS_TOKEN_SECRET;
  else process.env.ACCESS_TOKEN_SECRET = originalSecret;
});

describe("collaborative game server rules", () => {
  it("signs a role-scoped access token and rejects a different game", () => {
    process.env.ACCESS_TOKEN_SECRET = "a-very-long-test-secret-that-is-safe-to-use";
    const token = signAccessToken({ gameId: "game-a", role: "player", playerId: "player-a", version: 2 });
    expect(verifyAccessToken(token, "game-a")).toMatchObject({ role: "player", playerId: "player-a", version: 2 });
    expect(() => verifyAccessToken(token, "game-b")).toThrow(ApiError);
  });

  it("validates a publish payload and rejects duplicate commanders across the table", () => {
    expect(() => validatePublishInput({
      language: "en",
      cardsPerPlayer: 1,
      jokersPerPlayer: 2,
      players: [
        { name: "Alice", jokersRemaining: 2, commanderOracleIds: ["same"], lockedCommanderOracleIds: [] },
        { name: "Bob", jokersRemaining: 2, commanderOracleIds: ["same"], lockedCommanderOracleIds: [] },
      ],
    })).toThrow("A commander is assigned more than once");
  });

  it("draws only from oracle ids not already assigned", () => {
    const result = drawOracleIds(["a", "b", "c", "d"], new Set(["a", "b"]), 2);
    expect(new Set(result)).toEqual(new Set(["c", "d"]));
  });
});
