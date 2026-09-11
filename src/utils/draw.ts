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

export function rerollPlayer(
  draws: PlayerDraw[],
  playerId: string,
  pool: Commander[],
): PlayerDraw[] {
  const target = draws.find((draw) => draw.player.id === playerId);
  if (!target) {
    return draws;
  }

  const assignedIds = new Set(
    draws.flatMap((draw) => draw.commanders.map((commander) => commander.id)),
  );
  const available = pool.filter((commander) => !assignedIds.has(commander.id));
  const commandersPerPlayer = target.commanders.length;

  if (available.length < commandersPerPlayer) {
    throw new Error("Not enough commanders available for this draw.");
  }

  const replacements = drawCommandersFromPool(available, commandersPerPlayer);
  return draws.map((draw) =>
    draw.player.id === playerId ? { ...draw, commanders: replacements } : draw,
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
