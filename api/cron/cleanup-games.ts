import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleApiError, requireMethod, withClient } from "../_lib/core.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!requireMethod(request, response, ["GET"])) return;
  if (!process.env.CRON_SECRET || request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    response.status(401).json({ error: "Unauthorized." });
    return;
  }
  try {
    const deleted = await withClient((client) =>
      client.query("DELETE FROM games WHERE expires_at <= now() RETURNING id"),
    );
    response.status(200).json({ deleted: deleted.rowCount ?? 0 });
  } catch (cause) {
    handleApiError(response, cause);
  }
}
