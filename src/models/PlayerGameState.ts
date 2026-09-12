export interface PlayerGameState {
  jokersRemaining: number;
  lockedCommanderOracleIds: string[];
}

export type PlayerGameStates = Record<string, PlayerGameState>;
