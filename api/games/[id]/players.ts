import { randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ApiError,
  authorize,
  bearerToken,
  buildGameView,
  cleanName,
  drawOracleIds,
  gameIdFromRequest,
  gameLanguageForMutation,
  handleApiError,
  insertCommanderRows,
  loadCatalog,
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
    const language = await gameLanguageForMutation(gameId, token);
    const catalog = await loadCatalog(language);
    const body = requestBody(request) as { name?: unknown };
    const name = cleanName(body?.name);
    const view = await withTransaction(async (client) => {
      const game = await loadGame(client, gameId, true);
      const claims = authorize(game, token, "organizer");
      if (game.snapshot.language !== language) throw new ApiError(409, "The table language changed. Try again.");
      if (game.snapshot.players.length >= 50) throw new ApiError(409, "This table already has 50 players.");
      const excluded = new Set(game.snapshot.players.flatMap((player) => player.commanderOracleIds));
      const oracleIds = drawOracleIds(catalog, excluded, game.snapshot.cardsPerPlayer);
      const playerId = randomUUID();
      const position = game.snapshot.players.reduce((max, player) => Math.max(max, player.position), -1) + 1;
      await client.query(
        `INSERT INTO game_players (id, game_id, position, name, jokers_remaining)
         VALUES ($1, $2, $3, $4, $5)`,
        [playerId, gameId, position, name, game.snapshot.jokersPerPlayer],
      );
      await insertCommanderRows(client, gameId, playerId, oracleIds);
      await touchGame(client, gameId);
      return buildGameView(await loadGame(client, gameId), claims);
    });
    sendView(response, view, 201);
  } catch (cause) {
    handleApiError(response, cause);
  }
}
