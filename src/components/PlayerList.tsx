import { Plus } from "@phosphor-icons/react";
import brandLogo from "../assets/commander-roulette-logo.png";
import type { Player } from "../models/Player";
import { PlayerInput } from "./PlayerInput";

interface PlayerListProps {
  players: Player[];
  cardsPerPlayer: number;
  onAdd: () => void;
  onCardsPerPlayerChange: (count: number) => void;
  onChange: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  drawnPlayerIds: Set<string>;
  onDrawPlayer: (id: string) => void;
  onDrawAll: () => void;
  drawLabel: string;
  isDrawDisabled: boolean;
  isBusy: boolean;
}

export function PlayerList({
  players,
  cardsPerPlayer,
  onAdd,
  onCardsPerPlayerChange,
  onChange,
  onRemove,
  drawnPlayerIds,
  onDrawPlayer,
  onDrawAll,
  drawLabel,
  isDrawDisabled,
  isBusy,
}: PlayerListProps) {
  return (
    <section className="player-panel" aria-label="Player setup">
      <div className="setup-heading">
        <div><p className="section-label">01 / The table</p><h1 className="player-panel-title">Who's playing?</h1></div>
        <p className="table-count">{players.length} {players.length === 1 ? "player" : "players"} seated</p>
      </div>
      <div className="pod-setup-grid">
        <div className="pod-player-zone">
          <div className="player-list">
            {players.length === 0 ? <p className="roster-empty">An open seat for every friend.<br />Add your players to get started.</p> : null}
            {players.map((player) => (
              <PlayerInput
                key={player.id}
                player={player}
                onChange={onChange}
                onRemove={onRemove}
                onDraw={
                  drawnPlayerIds.size > 0 && !drawnPlayerIds.has(player.id) && !isBusy
                    ? onDrawPlayer
                    : undefined
                }
                disabled={isBusy}
              />
            ))}
          </div>
          <button className="add-player-button" type="button" onClick={onAdd} disabled={isBusy}>
            <Plus size={19} weight="bold" />
            Add player
          </button>
        </div>

        <div className="pod-draw-controls">
          <div className="draw-count-field">
            <label htmlFor="cards-per-player">Commanders per player</label>
            <input
              id="cards-per-player"
              type="number"
              min="1"
              step="1"
              value={cardsPerPlayer}
              disabled={isBusy}
              onChange={(event) => onCardsPerPlayerChange(Number(event.target.value))}
            />
          </div>
          <button className="draw-button" type="button" onClick={onDrawAll} disabled={isDrawDisabled}>
            <span className="roulette-symbol roulette-symbol-button" aria-hidden="true">
              <img src={brandLogo} alt="" />
            </span>
            {drawLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
