import type { Player } from "../models/Player";
import type { PlayerDraw } from "../models/PlayerDraw";
import type { PlayerGameState, PlayerGameStates } from "../models/PlayerGameState";

export function createPlayerGameState(jokersPerPlayer: number): PlayerGameState {
  return { jokersRemaining: jokersPerPlayer, lockedCommanderOracleIds: [] };
}

export function createPlayerGameStates(
  players: Player[],
  jokersPerPlayer: number,
): PlayerGameStates {
  return Object.fromEntries(
    players.map((player) => [player.id, createPlayerGameState(jokersPerPlayer)]),
  );
}

export function getRerollEligiblePlayerIds(
  draws: PlayerDraw[],
  states: PlayerGameStates,
): string[] {
  return draws
    .filter((draw) => {
      const state = states[draw.player.id];
      if (!state || state.jokersRemaining < 1) return false;
      const lockedIds = new Set(state.lockedCommanderOracleIds);
      return draw.commanders.some((commander) => !lockedIds.has(commander.oracleId));
    })
    .map((draw) => draw.player.id);
}

export function spendJokers(
  states: PlayerGameStates,
  playerIds: ReadonlySet<string>,
): PlayerGameStates {
  return Object.fromEntries(
    Object.entries(states).map(([playerId, state]) => [
      playerId,
      playerIds.has(playerId)
        ? { ...state, jokersRemaining: Math.max(0, state.jokersRemaining - 1) }
        : state,
    ]),
  );
}

export function lockedCommanderMap(
  states: PlayerGameStates,
): Map<string, ReadonlySet<string>> {
  return new Map(
    Object.entries(states).map(([playerId, state]) => [
      playerId,
      new Set(state.lockedCommanderOracleIds),
    ]),
  );
}
