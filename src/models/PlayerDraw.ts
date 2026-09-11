import type { Commander } from "./Commander";
import type { Player } from "./Player";

export interface PlayerDraw {
  player: Player;
  commanders: Commander[];
}
