import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ApiError,
  authorize,
  bearerToken,
  buildGameView,
  cleanName,
  gameIdFromRequest,
  handleApiError,
  loadGame,
  playerIdFromRequest,
  requestBody,
  requireMethod,
  sendView,
  touchGame,
  withTransaction,
} from "../../../_lib/core.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireMethod(request, response, ["PATCH", "DELETE"])) return;
  try {
    const gameId = gameIdFromRequest(request);
    const playerId = playerIdFromRequest(request);
    const token = bearerToken(request);
    const view = await withTransaction(async (client) => {
      const game = await loadGame(client, gameId, true);
      const claims = authorize(game, token, "organizer");
      if (!game.snapshot.players.some((player) => player.id === playerId)) {
        throw new ApiError(404, "That player is no longer at this table.");
      }
      if (request.method === "PATCH") {
        const body = requestBody(request) as { name?: unknown };
        await client.query(
          "UPDATE game_players SET name = $3 WHERE game_id = $1 AND id = $2",
          [gameId, playerId, cleanName(body?.name)],
        );
      } else {
        await client.query("DELETE FROM game_players WHERE game_id = $1 AND id = $2", [gameId, playerId]);
      }
      await touchGame(client, gameId);
      return buildGameView(await loadGame(client, gameId), claims);
    });
    sendView(response, view);
  } catch (cause) {
    handleApiError(response, cause);
  }
}
