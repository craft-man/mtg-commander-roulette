import type { Commander } from "../models/Commander";
import type { PlayerDraw } from "../models/PlayerDraw";
import type { CardLanguage } from "../services/scryfall";

const HASH_PREFIX = "#share=";
const SHARE_VERSION = 3;

interface SharedPlayerDraw {
  name: string;
  commanderOracleIds: string[];
}

export interface SharedDrawPayload {
  version: number;
  language: CardLanguage;
  players: SharedPlayerDraw[];
}

export function createShareUrl(
  draws: PlayerDraw[],
  language: CardLanguage,
  location: Location,
): string {
  const payload: SharedDrawPayload = {
    version: SHARE_VERSION,
    language,
    players: draws.map((draw) => ({
      name: draw.player.name,
      commanderOracleIds: draw.commanders.map((commander) => commander.oracleId),
    })),
  };

  const baseUrl = `${location.origin}${location.pathname}${location.search}`;
  return `${baseUrl}${HASH_PREFIX}${encodePayload(payload)}`;
}

export function readSharedDraw(hash: string): SharedDrawPayload | null {
  if (!hash.startsWith(HASH_PREFIX)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodePayload(hash.slice(HASH_PREFIX.length))) as SharedDrawPayload;
    if (
      payload.version !== SHARE_VERSION ||
      !isCardLanguage(payload.language) ||
      !Array.isArray(payload.players) ||
      payload.players.length === 0 ||
      payload.players.length > 50 ||
      !payload.players.every(
        (player) =>
          typeof player.name === "string" &&
          Array.isArray(player.commanderOracleIds) &&
          player.commanderOracleIds.length > 0 &&
          player.commanderOracleIds.length <= 50 &&
          player.commanderOracleIds.every((id) => typeof id === "string"),
      )
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function isCardLanguage(language: unknown): language is CardLanguage {
  return ["en", "es", "fr", "de", "it", "ja"].includes(language as string);
}

export function hydrateSharedDraw(
  payload: SharedDrawPayload,
  commanders: Commander[],
): PlayerDraw[] {
  const commanderByOracleId = new Map(
    commanders.map((commander) => [commander.oracleId, commander]),
  );

  return payload.players.map((player, index) => {
    const assignedCommanders = player.commanderOracleIds.map((id) => commanderByOracleId.get(id));
    if (assignedCommanders.some((commander) => !commander)) {
      throw new Error("This shared draw includes a commander that is no longer available.");
    }

    return {
      player: { id: `shared-${index}`, name: player.name },
      commanders: assignedCommanders as Commander[],
    };
  });
}

function encodePayload(payload: SharedDrawPayload): string {
  const binary = Array.from(new TextEncoder().encode(JSON.stringify(payload)), (byte) =>
    String.fromCharCode(byte),
  ).join("");

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodePayload(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
