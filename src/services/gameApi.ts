import type {
  CollaborativeGameView,
  OrganizerGameView,
  PublishGameInput,
  PublishGameResponse,
} from "../models/CollaborativeGame";
import type { CardLanguage } from "./commanderApi";

export class GameApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function readError(response: Response): Promise<GameApiError> {
  try {
    const payload = (await response.json()) as { error?: string };
    return new GameApiError(payload.error || "The shared table could not be updated.", response.status);
  } catch {
    return new GameApiError("The shared table could not be updated.", response.status);
  }
}

async function request<T>(
  url: string,
  token: string | null,
  init: RequestInit = {},
): Promise<{ data: T; etag: string | null }> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw await readError(response);
  return { data: (await response.json()) as T, etag: response.headers.get("ETag") };
}

export async function publishGame(input: PublishGameInput): Promise<PublishGameResponse> {
  return (await request<PublishGameResponse>("/api/games", null, {
    method: "POST",
    body: JSON.stringify(input),
  })).data;
}

export async function fetchGame(
  gameId: string,
  token: string,
  etag?: string | null,
): Promise<{ view: CollaborativeGameView | null; etag: string | null }> {
  const headers = etag ? { "If-None-Match": etag } : undefined;
  const response = await fetch(`/api/games/${encodeURIComponent(gameId)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...headers },
    cache: "no-store",
  });
  if (response.status === 304) return { view: null, etag: etag ?? null };
  if (!response.ok) throw await readError(response);
  return {
    view: (await response.json()) as CollaborativeGameView,
    etag: response.headers.get("ETag"),
  };
}

async function mutate(
  gameId: string,
  token: string,
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<OrganizerGameView | CollaborativeGameView> {
  return (await request<OrganizerGameView | CollaborativeGameView>(
    `/api/games/${encodeURIComponent(gameId)}${path}`,
    token,
    { method, body: body === undefined ? undefined : JSON.stringify(body) },
  )).data;
}

export const rerollSharedPlayer = (
  gameId: string,
  token: string,
  expectedPlayerRevision: number,
) => mutate(gameId, token, "/reroll", "POST", { expectedPlayerRevision });

export const setSharedCommanderLock = (
  gameId: string,
  token: string,
  oracleId: string,
  locked: boolean,
  expectedPlayerRevision: number,
) => mutate(gameId, token, "/locks", "PATCH", { oracleId, locked, expectedPlayerRevision });

export const addSharedPlayer = (gameId: string, token: string, name: string) =>
  mutate(gameId, token, "/players", "POST", { name });

export const updateSharedPlayer = (gameId: string, token: string, playerId: string, name: string) =>
  mutate(gameId, token, `/players/${encodeURIComponent(playerId)}`, "PATCH", { name });

export const removeSharedPlayer = (gameId: string, token: string, playerId: string) =>
  mutate(gameId, token, `/players/${encodeURIComponent(playerId)}`, "DELETE");

export const resetSharedGame = (gameId: string, token: string) =>
  mutate(gameId, token, "/reset", "POST");

export const updateSharedLanguage = (gameId: string, token: string, language: CardLanguage) =>
  mutate(gameId, token, "", "PATCH", { language });

export const rotateSharedAccess = (
  gameId: string,
  token: string,
  target: "player" | "spectator",
  playerId?: string,
) => mutate(gameId, token, "/access", "POST", { target, playerId });
