import { DiceFive, Trash } from "@phosphor-icons/react";
import type { Player } from "../models/Player";

interface PlayerInputProps {
  player: Player;
  onChange: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onDraw?: (id: string) => void;
  disabled?: boolean;
}

export function PlayerInput({ player, onChange, onRemove, onDraw, disabled = false }: PlayerInputProps) {
  return (
    <div className={`player-row${onDraw ? " player-row-pending" : ""}`}>
      <label className="sr-only" htmlFor={`player-${player.id}`}>
        Player name
      </label>
      <input
        id={`player-${player.id}`}
        className="player-name-input"
        value={player.name}
        disabled={disabled}
        onChange={(event) => onChange(player.id, event.target.value)}
        placeholder="Player name"
      />
      {onDraw ? (
        <button
          className="player-draw-button"
          type="button"
          onClick={() => onDraw(player.id)}
          disabled={disabled}
          aria-label={`Draw commanders for ${player.name || "player"}`}
        >
          <DiceFive size={17} weight="fill" />
          Draw
        </button>
      ) : null}
      <button
        className="icon-button"
        type="button"
        onClick={() => onRemove(player.id)}
        disabled={disabled}
        aria-label={`Remove ${player.name || "player"}`}
        title="Remove player"
      >
        <Trash size={19} weight="bold" />
      </button>
    </div>
  );
}
