import type { Commander } from "../models/Commander";
import type { Player } from "../models/Player";
import type { PlayerDraw } from "../models/PlayerDraw";
import { randomIndex } from "./random";

export function drawCommanders(pool: Commander[], count: number): Commander[] {
  if (!Number.isSafeInteger(count) || count < 1 || count > pool.length) {
    throw new Error("Not enough commanders available for this draw.");
  }

  const available = [...pool];
  const result: Commander[] = [];

  for (let index = 0; index < count; index += 1) {
    result.push(available.splice(randomIndex(available.length), 1)[0]);
  }

  return result;
}

export function drawForPlayers(
  players: Player[],
  pool: Commander[],
  commandersPerPlayer = 3,
): PlayerDraw[] {
  if (
    !Number.isSafeInteger(commandersPerPlayer) ||
    commandersPerPlayer < 1 ||
    players.length * commandersPerPlayer > pool.length
  ) {
    throw new Error("Not enough commanders available for this draw.");
  }

  const available = [...pool];

  return players.map((player) => ({
    player,
    commanders: drawCommandersFromPool(available, commandersPerPlayer),
  }));
}

export function rerollPlayers(
  draws: PlayerDraw[],
  playerIds: ReadonlySet<string>,
  pool: Commander[],
  lockedCommanderOracleIds: ReadonlyMap<string, ReadonlySet<string>> = new Map(),
): PlayerDraw[] {
  const targets = draws.filter((draw) => playerIds.has(draw.player.id));
  if (targets.length === 0) {
    return draws;
  }

  const assignedIds = new Set(
    draws.flatMap((draw) => draw.commanders.map((commander) => commander.id)),
  );
  const available = pool.filter((commander) => !assignedIds.has(commander.id));
  const replacementCount = targets.reduce((count, draw) => {
    const lockedIds = lockedCommanderOracleIds.get(draw.player.id) ?? new Set<string>();
    return count + draw.commanders.filter((commander) => !lockedIds.has(commander.oracleId)).length;
  }, 0);

  if (available.length < replacementCount) {
    throw new Error("Not enough commanders available for this draw.");
  }

  return draws.map((draw) => {
    if (!playerIds.has(draw.player.id)) return draw;

    const lockedIds = lockedCommanderOracleIds.get(draw.player.id) ?? new Set<string>();
    return {
      ...draw,
      commanders: draw.commanders.map((commander) =>
        lockedIds.has(commander.oracleId)
          ? commander
          : drawCommandersFromPool(available, 1)[0],
      ),
    };
  });
}

export function rerollPlayer(
  draws: PlayerDraw[],
  playerId: string,
  pool: Commander[],
  lockedCommanderOracleIds: ReadonlySet<string> = new Set(),
): PlayerDraw[] {
  return rerollPlayers(
    draws,
    new Set([playerId]),
    pool,
    new Map([[playerId, lockedCommanderOracleIds]]),
  );
}

function drawCommandersFromPool(pool: Commander[], count: number): Commander[] {
  if (count > pool.length) {
    throw new Error("Not enough commanders available for this draw.");
  }

  const result: Commander[] = [];
  for (let index = 0; index < count; index += 1) {
    result.push(pool.splice(randomIndex(pool.length), 1)[0]);
  }
  return result;
}
