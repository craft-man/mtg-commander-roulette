import type { Commander } from "../models/Commander";
import type {
  CollaborativeAccess,
  GameSnapshot,
  PublishGameInput,
} from "../models/CollaborativeGame";
import type { PlayerGameStates } from "../models/PlayerGameState";
import type { PlayerDraw } from "../models/PlayerDraw";
import type { CardLanguage } from "../services/commanderApi";

export function readCollaborativeAccess(hash: string): CollaborativeAccess | null {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  const parameters = new URLSearchParams(value);
  const gameId = parameters.get("game")?.trim();
  const token = parameters.get("access")?.trim();
  return gameId && token ? { gameId, token } : null;
}

export function createCollaborativeUrl(
  gameId: string,
  token: string,
  location: Pick<Location, "origin" | "pathname" | "search">,
): string {
  const baseUrl = `${location.origin}${location.pathname}${location.search}`;
  const parameters = new URLSearchParams({ game: gameId, access: token });
  return `${baseUrl}#${parameters.toString()}`;
}

export function createPublishGameInput(
  draws: PlayerDraw[],
  playerGameStates: PlayerGameStates,
  language: CardLanguage,
  cardsPerPlayer: number,
  jokersPerPlayer: number,
): PublishGameInput {
  return {
    language,
    cardsPerPlayer,
    jokersPerPlayer,
    players: draws.map((draw) => ({
      name: draw.player.name,
      jokersRemaining: playerGameStates[draw.player.id]?.jokersRemaining ?? jokersPerPlayer,
      commanderOracleIds: draw.commanders.map((commander) => commander.oracleId),
      lockedCommanderOracleIds:
        playerGameStates[draw.player.id]?.lockedCommanderOracleIds ?? [],
    })),
  };
}

export function hydrateGameSnapshot(
  snapshot: GameSnapshot,
  commanders: Commander[],
): { draws: PlayerDraw[]; playerGameStates: PlayerGameStates } {
  const byOracleId = new Map(commanders.map((commander) => [commander.oracleId, commander]));
  const draws = snapshot.players.map((player) => {
    const assigned = player.commanderOracleIds.map((oracleId) => byOracleId.get(oracleId));
    if (assigned.some((commander) => !commander)) {
      throw new Error("This game includes a commander that is no longer available.");
    }
    return {
      player: { id: player.id, name: player.name },
      commanders: assigned as Commander[],
    };
  });
  const playerGameStates = Object.fromEntries(
    snapshot.players.map((player) => [
      player.id,
      {
        jokersRemaining: player.jokersRemaining,
        lockedCommanderOracleIds: player.lockedCommanderOracleIds,
      },
    ]),
  );
  return { draws, playerGameStates };
}
