import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  authorize,
  bearerToken,
  buildGameView,
  gameIdFromRequest,
  handleApiError,
  loadGame,
  requestBody,
  requireMethod,
  sendConditionalView,
  sendView,
  touchGame,
  validateLanguage,
  withClient,
  withTransaction,
} from "../_lib/core";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireMethod(request, response, ["GET", "PATCH"])) return;
  try {
    const gameId = gameIdFromRequest(request);
    const token = bearerToken(request);
    if (request.method === "GET") {
      const view = await withClient(async (client) => {
        const game = await loadGame(client, gameId);
        return buildGameView(game, authorize(game, token));
      });
      sendConditionalView(request, response, view);
      return;
    }

    const body = requestBody(request) as { language?: unknown };
    const language = validateLanguage(body?.language);
    const view = await withTransaction(async (client) => {
      const game = await loadGame(client, gameId, true);
      const claims = authorize(game, token, "organizer");
      if (game.snapshot.language !== language) {
        await client.query("UPDATE games SET language = $2 WHERE id = $1", [gameId, language]);
        await touchGame(client, gameId);
      }
      return buildGameView(await loadGame(client, gameId), claims);
    });
    sendView(response, view);
  } catch (cause) {
    handleApiError(response, cause);
  }
}
