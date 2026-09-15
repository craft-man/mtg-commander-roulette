import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ApiError,
  authorize,
  bearerToken,
  buildGameView,
  gameIdFromRequest,
  handleApiError,
  loadGame,
  requestBody,
  requireMethod,
  sendView,
  touchGame,
  withTransaction,
} from "../../_lib/core";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireMethod(request, response, ["PATCH"])) return;
  try {
    const gameId = gameIdFromRequest(request);
    const token = bearerToken(request);
    const body = requestBody(request) as {
      oracleId?: unknown;
      locked?: unknown;
      expectedPlayerRevision?: unknown;
    };
    if (typeof body?.oracleId !== "string" || typeof body.locked !== "boolean" || !Number.isSafeInteger(body.expectedPlayerRevision)) {
      throw new ApiError(400, "A commander, lock state, and player revision are required.");
    }
    const view = await withTransaction(async (client) => {
      const game = await loadGame(client, gameId, true);
      const claims = authorize(game, token, "player");
      const player = game.snapshot.players.find((candidate) => candidate.id === claims.playerId);
      if (!player) throw new ApiError(403, "This player link has been revoked.");
      if (player.revision !== body.expectedPlayerRevision) {
        throw new ApiError(409, "Your line changed in another tab. It has been refreshed.");
      }
      if (!player.commanderOracleIds.includes(body.oracleId as string)) {
        throw new ApiError(400, "That commander is not on this player's line.");
      }
      const currentlyLocked = player.lockedCommanderOracleIds.includes(body.oracleId as string);
      if (currentlyLocked !== body.locked) {
        await client.query(
          `UPDATE player_commanders SET locked = $4
            WHERE game_id = $1 AND player_id = $2 AND oracle_id = $3`,
          [gameId, player.id, body.oracleId, body.locked],
        );
        await client.query(
          "UPDATE game_players SET revision = revision + 1 WHERE game_id = $1 AND id = $2",
          [gameId, player.id],
        );
        await touchGame(client, gameId);
      }
      const updated = await loadGame(client, gameId);
      return buildGameView(updated, { ...claims, version: updated.playerAccessVersions.get(player.id) ?? claims.version });
    });
    sendView(response, view);
  } catch (cause) {
    handleApiError(response, cause);
  }
}
