import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ApiError,
  authorize,
  bearerToken,
  buildGameView,
  drawOracleIds,
  gameIdFromRequest,
  gameLanguageForMutation,
  handleApiError,
  insertCommanderRows,
  loadCatalog,
  loadGame,
  requireMethod,
  sendView,
  touchGame,
  withTransaction,
} from "../../_lib/core";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireMethod(request, response, ["POST"])) return;
  try {
    const gameId = gameIdFromRequest(request);
    const token = bearerToken(request);
    const language = await gameLanguageForMutation(gameId, token);
    const catalog = await loadCatalog(language);
    const view = await withTransaction(async (client) => {
      const game = await loadGame(client, gameId, true);
      const claims = authorize(game, token, "organizer");
      if (game.snapshot.language !== language) throw new ApiError(409, "The table language changed. Try again.");
      const total = game.snapshot.players.length * game.snapshot.cardsPerPlayer;
      if (catalog.length < total) throw new ApiError(409, "Not enough commanders are available for this table.");
      const available = new Set<string>();
      const assignments = new Map<string, string[]>();
      for (const player of game.snapshot.players) {
        const ids = drawOracleIds(catalog, available, game.snapshot.cardsPerPlayer);
        ids.forEach((id) => available.add(id));
        assignments.set(player.id, ids);
      }
      await client.query("DELETE FROM player_commanders WHERE game_id = $1", [gameId]);
      for (const player of game.snapshot.players) {
        await insertCommanderRows(client, gameId, player.id, assignments.get(player.id) ?? []);
      }
      await client.query(
        `UPDATE game_players
            SET jokers_remaining = $2, revision = revision + 1
          WHERE game_id = $1`,
        [gameId, game.snapshot.jokersPerPlayer],
      );
      await touchGame(client, gameId);
      return buildGameView(await loadGame(client, gameId), claims);
    });
    sendView(response, view);
  } catch (cause) {
    handleApiError(response, cause);
  }
}
