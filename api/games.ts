import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  handleApiError,
  loadCatalog,
  publishGame,
  requestBody,
  requireMethod,
  validatePublishInput,
  withTransaction,
} from "./_lib/core";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireMethod(request, response, ["POST"])) return;
  try {
    const input = validatePublishInput(requestBody(request));
    const catalog = await loadCatalog(input.language);
    const result = await withTransaction((client) => publishGame(client, input, catalog));
    response.setHeader("Cache-Control", "private, no-store");
    response.status(201).json(result);
  } catch (cause) {
    handleApiError(response, cause);
  }
}
