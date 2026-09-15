import type { CardLanguage } from "../services/commanderApi";

export type GameAccessRole = "organizer" | "player" | "spectator";

export interface GamePlayerSnapshot {
  id: string;
  position: number;
  name: string;
  jokersRemaining: number;
  revision: number;
  commanderOracleIds: string[];
  lockedCommanderOracleIds: string[];
}

export interface GameSnapshot {
  id: string;
  language: CardLanguage;
  cardsPerPlayer: number;
  jokersPerPlayer: number;
  revision: number;
  expiresAt: string;
  players: GamePlayerSnapshot[];
}

export interface PlayerAccessLink {
  playerId: string;
  playerName: string;
  token: string;
}

export interface OrganizerAccessLinks {
  players: PlayerAccessLink[];
  spectatorToken: string;
}

export interface OrganizerGameView {
  role: "organizer";
  game: GameSnapshot;
  access: OrganizerAccessLinks;
}

export interface PlayerGameView {
  role: "player";
  game: GameSnapshot;
  playerId: string;
}

export interface SpectatorGameView {
  role: "spectator";
  game: GameSnapshot;
}

export type CollaborativeGameView = OrganizerGameView | PlayerGameView | SpectatorGameView;

export interface PublishPlayerInput {
  name: string;
  jokersRemaining: number;
  commanderOracleIds: string[];
  lockedCommanderOracleIds: string[];
}

export interface PublishGameInput {
  language: CardLanguage;
  cardsPerPlayer: number;
  jokersPerPlayer: number;
  players: PublishPlayerInput[];
}

export interface PublishGameResponse {
  organizerToken: string;
  view: OrganizerGameView;
}

export interface CollaborativeAccess {
  gameId: string;
  token: string;
}
