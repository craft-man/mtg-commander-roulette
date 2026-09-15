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
  loadCatalog,
  loadGame,
  requestBody,
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
    const body = requestBody(request) as { expectedPlayerRevision?: unknown };
    const expectedRevision = body?.expectedPlayerRevision;
    if (!Number.isSafeInteger(expectedRevision)) throw new ApiError(400, "A player revision is required.");

    const view = await withTransaction(async (client) => {
      const game = await loadGame(client, gameId, true);
      const claims = authorize(game, token, "player");
      if (game.snapshot.language !== language) throw new ApiError(409, "The table language changed. Try again.");
      const player = game.snapshot.players.find((candidate) => candidate.id === claims.playerId);
      if (!player) throw new ApiError(403, "This player link has been revoked.");
      if (player.revision !== expectedRevision) throw new ApiError(409, "Your line changed in another tab. It has been refreshed.");
      if (player.jokersRemaining < 1) throw new ApiError(409, "No jokers remain for this player.");
      const locked = new Set(player.lockedCommanderOracleIds);
      const slotsToReplace = player.commanderOracleIds
        .map((oracleId, slot) => ({ oracleId, slot }))
        .filter(({ oracleId }) => !locked.has(oracleId));
      if (slotsToReplace.length === 0) throw new ApiError(409, "Release a commander before rerolling.");
      const excluded = new Set(game.snapshot.players.flatMap((candidate) => candidate.commanderOracleIds));
      const replacements = drawOracleIds(catalog, excluded, slotsToReplace.length);
      for (const [index, target] of slotsToReplace.entries()) {
        await client.query(
          `UPDATE player_commanders SET oracle_id = $4, locked = false
            WHERE game_id = $1 AND player_id = $2 AND slot = $3`,
          [gameId, player.id, target.slot, replacements[index]],
        );
      }
      await client.query(
        `UPDATE game_players
            SET jokers_remaining = jokers_remaining - 1, revision = revision + 1
          WHERE game_id = $1 AND id = $2`,
        [gameId, player.id],
      );
      await touchGame(client, gameId);
      const updated = await loadGame(client, gameId);
      return buildGameView(updated, { ...claims, version: updated.playerAccessVersions.get(player.id) ?? claims.version });
    });
    sendView(response, view);
  } catch (cause) {
    handleApiError(response, cause);
  }
}
