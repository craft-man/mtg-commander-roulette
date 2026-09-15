import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { Pool, neonConfig, type PoolClient } from "@neondatabase/serverless";
import ws from "ws";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type {
  CollaborativeGameView,
  GameAccessRole,
  GamePlayerSnapshot,
  GameSnapshot,
  OrganizerGameView,
  PublishGameInput,
} from "../../src/models/CollaborativeGame.js";
import type { CardLanguage } from "../../src/services/commanderApi.js";

neonConfig.webSocketConstructor = ws;

const CARD_LANGUAGES = new Set<CardLanguage>(["en", "es", "fr", "de", "it", "ja"]);
const GAME_LIFETIME_DAYS = 30;
const MAX_PLAYERS = 50;
const MAX_COMMANDERS_PER_PLAYER = 50;
const MAX_JOKERS = 100;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface AccessClaims {
  gameId: string;
  role: GameAccessRole;
  playerId?: string;
  version: number;
}

interface GameRow {
  id: string;
  language: CardLanguage;
  cards_per_player: number;
  jokers_per_player: number;
  revision: number;
  organizer_access_version: number;
  spectator_access_version: number;
  expires_at: Date | string;
}

interface PlayerRow {
  id: string;
  position: number;
  name: string;
  jokers_remaining: number;
  revision: number;
  access_version: number;
}

interface CommanderRow {
  player_id: string;
  slot: number;
  oracle_id: string;
  locked: boolean;
}

export interface LoadedGame {
  snapshot: GameSnapshot;
  organizerAccessVersion: number;
  spectatorAccessVersion: number;
  playerAccessVersions: Map<string, number>;
}

export function handleApiError(response: VercelResponse, cause: unknown): void {
  if (cause instanceof ApiError) {
    response.status(cause.status).json({ error: cause.message });
    return;
  }
  console.error("Collaborative game request failed", cause instanceof Error ? cause.message : "unknown error");
  response.status(500).json({ error: "The shared table could not be updated." });
}

export function requireMethod(
  request: VercelRequest,
  response: VercelResponse,
  methods: string[],
): boolean {
  if (request.method && methods.includes(request.method)) return true;
  response.setHeader("Allow", methods.join(", "));
  response.status(405).json({ error: "Method not allowed." });
  return false;
}

export function gameIdFromRequest(request: VercelRequest): string {
  const value = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
  if (!value) throw new ApiError(400, "A game id is required.");
  return value;
}

export function playerIdFromRequest(request: VercelRequest): string {
  const value = Array.isArray(request.query.playerId) ? request.query.playerId[0] : request.query.playerId;
  if (!value) throw new ApiError(400, "A player id is required.");
  return value;
}

export function bearerToken(request: VercelRequest): string {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) throw new ApiError(401, "This private link is incomplete.");
  return authorization.slice(7);
}

export function requestBody(request: VercelRequest): unknown {
  if (typeof request.body !== "string") return request.body;
  try {
    return JSON.parse(request.body) as unknown;
  } catch {
    throw new ApiError(400, "The request body is not valid JSON.");
  }
}

function accessSecret(): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret || secret.length < 32) throw new ApiError(503, "Shared tables are not configured yet.");
  return secret;
}

export function signAccessToken(claims: AccessClaims): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", accessSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAccessToken(token: string, gameId: string): AccessClaims {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) throw new ApiError(403, "This private link is invalid or revoked.");
  const expected = createHmac("sha256", accessSecret()).update(payload).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, "base64url");
  } catch {
    throw new ApiError(403, "This private link is invalid or revoked.");
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new ApiError(403, "This private link is invalid or revoked.");
  }
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AccessClaims;
    if (
      claims.gameId !== gameId ||
      !["organizer", "player", "spectator"].includes(claims.role) ||
      !Number.isSafeInteger(claims.version) ||
      (claims.role === "player" && !claims.playerId)
    ) {
      throw new Error("invalid claims");
    }
    return claims;
  } catch {
    throw new ApiError(403, "This private link is invalid or revoked.");
  }
}

function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new ApiError(503, "Shared tables are not configured yet.");
  return value;
}

export async function withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: databaseUrl(), max: 1 });
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
    await pool.end();
  }
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (cause) {
      await client.query("ROLLBACK");
      throw cause;
    }
  });
}

function isoDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function loadGame(client: PoolClient, gameId: string, lock = false): Promise<LoadedGame> {
  const gameResult = await client.query<GameRow>(
    `SELECT id, language, cards_per_player, jokers_per_player, revision,
            organizer_access_version, spectator_access_version, expires_at
       FROM games WHERE id = $1${lock ? " FOR UPDATE" : ""}`,
    [gameId],
  );
  const game = gameResult.rows[0];
  if (!game) throw new ApiError(404, "This shared table does not exist.");
  if (new Date(game.expires_at).getTime() <= Date.now()) {
    throw new ApiError(410, "This shared table has expired after 30 days without activity.");
  }

  const [playerResult, commanderResult] = await Promise.all([
    client.query<PlayerRow>(
      `SELECT id, position, name, jokers_remaining, revision, access_version
         FROM game_players WHERE game_id = $1 ORDER BY position`,
      [gameId],
    ),
    client.query<CommanderRow>(
      `SELECT player_id, slot, oracle_id, locked
         FROM player_commanders WHERE game_id = $1 ORDER BY player_id, slot`,
      [gameId],
    ),
  ]);
  const commandersByPlayer = new Map<string, CommanderRow[]>();
  for (const commander of commanderResult.rows) {
    const current = commandersByPlayer.get(commander.player_id) ?? [];
    current.push(commander);
    commandersByPlayer.set(commander.player_id, current);
  }
  const players: GamePlayerSnapshot[] = playerResult.rows.map((player) => {
    const commanders = commandersByPlayer.get(player.id) ?? [];
    return {
      id: player.id,
      position: player.position,
      name: player.name,
      jokersRemaining: player.jokers_remaining,
      revision: player.revision,
      commanderOracleIds: commanders.map((commander) => commander.oracle_id),
      lockedCommanderOracleIds: commanders
        .filter((commander) => commander.locked)
        .map((commander) => commander.oracle_id),
    };
  });
  return {
    snapshot: {
      id: game.id,
      language: game.language,
      cardsPerPlayer: game.cards_per_player,
      jokersPerPlayer: game.jokers_per_player,
      revision: game.revision,
      expiresAt: isoDate(game.expires_at),
      players,
    },
    organizerAccessVersion: game.organizer_access_version,
    spectatorAccessVersion: game.spectator_access_version,
    playerAccessVersions: new Map(playerResult.rows.map((player) => [player.id, player.access_version])),
  };
}

export function authorize(game: LoadedGame, token: string, requiredRole?: GameAccessRole): AccessClaims {
  const claims = verifyAccessToken(token, game.snapshot.id);
  const currentVersion = claims.role === "organizer"
    ? game.organizerAccessVersion
    : claims.role === "spectator"
      ? game.spectatorAccessVersion
      : game.playerAccessVersions.get(claims.playerId ?? "");
  if (currentVersion !== claims.version || (requiredRole && claims.role !== requiredRole)) {
    throw new ApiError(403, "This private link is invalid or revoked.");
  }
  return claims;
}

export function buildGameView(game: LoadedGame, claims: AccessClaims): CollaborativeGameView {
  if (claims.role === "organizer") {
    return {
      role: "organizer",
      game: game.snapshot,
      access: {
        players: game.snapshot.players.map((player) => ({
          playerId: player.id,
          playerName: player.name,
          token: signAccessToken({
            gameId: game.snapshot.id,
            role: "player",
            playerId: player.id,
            version: game.playerAccessVersions.get(player.id) ?? 1,
          }),
        })),
        spectatorToken: signAccessToken({
          gameId: game.snapshot.id,
          role: "spectator",
          version: game.spectatorAccessVersion,
        }),
      },
    } satisfies OrganizerGameView;
  }
  if (claims.role === "player") {
    const player = game.snapshot.players.find((candidate) => candidate.id === claims.playerId);
    if (!player) throw new ApiError(403, "This player link has been revoked.");
    return {
      role: "player",
      playerId: player.id,
      game: { ...game.snapshot, players: [player] },
    };
  }
  return { role: "spectator", game: game.snapshot };
}

export function etagForView(view: CollaborativeGameView): string {
  const revision = view.role === "player" ? view.game.players[0]?.revision ?? 0 : view.game.revision;
  return `W/\"${view.role}-${view.game.id}-${revision}\"`;
}

export function sendView(response: VercelResponse, view: CollaborativeGameView, status = 200): void {
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("ETag", etagForView(view));
  response.status(status).json(view);
}

export function sendConditionalView(
  request: VercelRequest,
  response: VercelResponse,
  view: CollaborativeGameView,
): void {
  const etag = etagForView(view);
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("ETag", etag);
  if (request.headers["if-none-match"] === etag) {
    response.status(304).end();
    return;
  }
  response.status(200).json(view);
}

export async function touchGame(client: PoolClient, gameId: string): Promise<void> {
  await client.query(
    `UPDATE games
        SET revision = revision + 1,
            updated_at = now(),
            expires_at = now() + ($2 * interval '1 day')
      WHERE id = $1`,
    [gameId, GAME_LIFETIME_DAYS],
  );
}

function readInteger(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new ApiError(400, `${label} is outside the supported range.`);
  }
  return value as number;
}

export function cleanName(value: unknown, fallback?: string): string {
  if (typeof value !== "string") throw new ApiError(400, "Every player needs a name.");
  const name = value.trim() || fallback;
  if (!name || name.length > 80) throw new ApiError(400, "Player names must be 1 to 80 characters.");
  return name;
}

export function validateLanguage(value: unknown): CardLanguage {
  if (!CARD_LANGUAGES.has(value as CardLanguage)) throw new ApiError(400, "That card language is not supported.");
  return value as CardLanguage;
}

export function validatePublishInput(value: unknown): PublishGameInput {
  if (!value || typeof value !== "object") throw new ApiError(400, "The table data is missing.");
  const input = value as Partial<PublishGameInput>;
  const language = validateLanguage(input.language);
  const cardsPerPlayer = readInteger(input.cardsPerPlayer, 1, MAX_COMMANDERS_PER_PLAYER, "Commanders per player");
  const jokersPerPlayer = readInteger(input.jokersPerPlayer, 0, MAX_JOKERS, "Jokers per player");
  if (!Array.isArray(input.players) || input.players.length < 1 || input.players.length > MAX_PLAYERS) {
    throw new ApiError(400, "A shared table needs between 1 and 50 players.");
  }
  const seen = new Set<string>();
  const players = input.players.map((player, index) => {
    if (!player || typeof player !== "object") throw new ApiError(400, "A player entry is invalid.");
    const commanderOracleIds = Array.isArray(player.commanderOracleIds)
      ? player.commanderOracleIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
    if (commanderOracleIds.length !== cardsPerPlayer || new Set(commanderOracleIds).size !== commanderOracleIds.length) {
      throw new ApiError(400, "Every player must have the configured number of distinct commanders.");
    }
    for (const oracleId of commanderOracleIds) {
      if (seen.has(oracleId)) throw new ApiError(400, "A commander is assigned more than once at this table.");
      seen.add(oracleId);
    }
    const lockedCommanderOracleIds = Array.isArray(player.lockedCommanderOracleIds)
      ? player.lockedCommanderOracleIds.filter((id): id is string => typeof id === "string")
      : [];
    if (
      new Set(lockedCommanderOracleIds).size !== lockedCommanderOracleIds.length ||
      lockedCommanderOracleIds.some((id) => !commanderOracleIds.includes(id))
    ) {
      throw new ApiError(400, "A fixed commander is not part of that player's draw.");
    }
    return {
      name: cleanName(player.name, `Player ${index + 1}`),
      jokersRemaining: readInteger(player.jokersRemaining, 0, jokersPerPlayer, "Jokers remaining"),
      commanderOracleIds,
      lockedCommanderOracleIds,
    };
  });
  return { language, cardsPerPlayer, jokersPerPlayer, players };
}

export async function loadCatalog(language: CardLanguage): Promise<string[]> {
  const baseUrl = (process.env.COMMANDER_API_URL || process.env.VITE_COMMANDER_API_URL || "").replace(/\/$/, "");
  if (!baseUrl) throw new ApiError(503, "The commander catalog is not configured for shared tables.");
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1/commanders?language=${encodeURIComponent(language)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new ApiError(503, "The commander catalog is temporarily unavailable. Try again.");
  }
  if (!response.ok) throw new ApiError(503, "The commander catalog is temporarily unavailable. Try again.");
  const payload = (await response.json()) as { data?: Array<{ oracleId?: unknown }> };
  if (!Array.isArray(payload.data)) throw new ApiError(503, "The commander catalog returned invalid data.");
  const unique = new Set(
    payload.data.map((commander) => commander.oracleId).filter((id): id is string => typeof id === "string"),
  );
  if (unique.size === 0) throw new ApiError(503, "The commander catalog returned no cards.");
  return [...unique];
}

export function drawOracleIds(catalog: string[], excluded: ReadonlySet<string>, count: number): string[] {
  const available = catalog.filter((oracleId) => !excluded.has(oracleId));
  if (available.length < count) throw new ApiError(409, "Not enough unused commanders remain for this draw.");
  const result: string[] = [];
  for (let index = 0; index < count; index += 1) {
    result.push(available.splice(randomInt(available.length), 1)[0]);
  }
  return result;
}

export async function publishGame(
  client: PoolClient,
  input: PublishGameInput,
  catalog: string[],
): Promise<{ organizerToken: string; view: OrganizerGameView }> {
  const catalogIds = new Set(catalog);
  if (input.players.some((player) => player.commanderOracleIds.some((id) => !catalogIds.has(id)))) {
    throw new ApiError(400, "This draw contains a commander that is no longer available.");
  }
  const gameId = randomUUID();
  await client.query(
    `INSERT INTO games (id, language, cards_per_player, jokers_per_player)
     VALUES ($1, $2, $3, $4)`,
    [gameId, input.language, input.cardsPerPlayer, input.jokersPerPlayer],
  );
  for (const [position, player] of input.players.entries()) {
    const playerId = randomUUID();
    await client.query(
      `INSERT INTO game_players (id, game_id, position, name, jokers_remaining)
       VALUES ($1, $2, $3, $4, $5)`,
      [playerId, gameId, position, player.name, player.jokersRemaining],
    );
    for (const [slot, oracleId] of player.commanderOracleIds.entries()) {
      await client.query(
        `INSERT INTO player_commanders (game_id, player_id, slot, oracle_id, locked)
         VALUES ($1, $2, $3, $4, $5)`,
        [gameId, playerId, slot, oracleId, player.lockedCommanderOracleIds.includes(oracleId)],
      );
    }
  }
  const game = await loadGame(client, gameId);
  const claims: AccessClaims = { gameId, role: "organizer", version: game.organizerAccessVersion };
  return { organizerToken: signAccessToken(claims), view: buildGameView(game, claims) as OrganizerGameView };
}

export async function gameLanguageForMutation(gameId: string, token: string): Promise<CardLanguage> {
  return withClient(async (client) => {
    const game = await loadGame(client, gameId);
    authorize(game, token);
    return game.snapshot.language;
  });
}

export async function insertCommanderRows(
  client: PoolClient,
  gameId: string,
  playerId: string,
  oracleIds: string[],
): Promise<void> {
  for (const [slot, oracleId] of oracleIds.entries()) {
    await client.query(
      `INSERT INTO player_commanders (game_id, player_id, slot, oracle_id, locked)
       VALUES ($1, $2, $3, $4, false)`,
      [gameId, playerId, slot, oracleId],
    );
  }
}
