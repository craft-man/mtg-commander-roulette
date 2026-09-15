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
} from "../../_lib/core.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireMethod(request, response, ["POST"])) return;
  try {
    const gameId = gameIdFromRequest(request);
    const token = bearerToken(request);
    const body = requestBody(request) as { target?: unknown; playerId?: unknown };
    if (body?.target !== "player" && body?.target !== "spectator") {
      throw new ApiError(400, "Choose a player or spectator link to regenerate.");
    }
    const view = await withTransaction(async (client) => {
      const game = await loadGame(client, gameId, true);
      const claims = authorize(game, token, "organizer");
      if (body.target === "spectator") {
        await client.query(
          "UPDATE games SET spectator_access_version = spectator_access_version + 1 WHERE id = $1",
          [gameId],
        );
      } else {
        if (typeof body.playerId !== "string" || !game.snapshot.players.some((player) => player.id === body.playerId)) {
          throw new ApiError(404, "That player is no longer at this table.");
        }
        await client.query(
          "UPDATE game_players SET access_version = access_version + 1 WHERE game_id = $1 AND id = $2",
          [gameId, body.playerId],
        );
      }
      await touchGame(client, gameId);
      return buildGameView(await loadGame(client, gameId), claims);
    });
    sendView(response, view);
  } catch (cause) {
    handleApiError(response, cause);
  }
}
