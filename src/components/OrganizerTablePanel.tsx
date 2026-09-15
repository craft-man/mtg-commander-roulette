import { Plus, Trash } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { GameSnapshot } from "../models/CollaborativeGame";
import { JokerCardIcon } from "./JokerCardIcon";

interface OrganizerTablePanelProps {
  game: GameSnapshot;
  isBusy: boolean;
  onAdd: (name: string) => Promise<void>;
  onRename: (playerId: string, name: string) => Promise<void>;
  onRemove: (playerId: string) => Promise<void>;
  onNewGame: () => void;
}

export function OrganizerTablePanel({ game, isBusy, onAdd, onRename, onRemove, onNewGame }: OrganizerTablePanelProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setNames(Object.fromEntries(game.players.map((player) => [player.id, player.name])));
  }, [game.players]);

  const add = async () => {
    const name = newName.trim() || `Player ${game.players.length + 1}`;
    await onAdd(name);
    setNewName("");
  };

  return (
    <section className="player-panel organizer-panel" aria-label="Shared table management">
      <div className="setup-heading">
        <div><p className="section-label">01 / The table</p><h1 className="player-panel-title">Table keeper</h1></div>
        <p className="table-count">{game.players.length} {game.players.length === 1 ? "player" : "players"} seated</p>
      </div>
      <p className="organizer-note">Players control their own fixed cards and rerolls. You keep the seats and links in order.</p>
      <div className="player-list organizer-player-list">
        {game.players.map((player) => (
          <div className="player-row" key={player.id}>
            <label className="sr-only" htmlFor={`shared-player-${player.id}`}>Player name</label>
            <input
              id={`shared-player-${player.id}`}
              className="player-name-input"
              value={names[player.id] ?? player.name}
              maxLength={80}
              disabled={isBusy}
              onChange={(event) => setNames((current) => ({ ...current, [player.id]: event.target.value }))}
              onBlur={() => {
                const nextName = (names[player.id] ?? "").trim();
                if (nextName && nextName !== player.name) void onRename(player.id, nextName);
                else if (!nextName) setNames((current) => ({ ...current, [player.id]: player.name }));
              }}
            />
            <button className="icon-button" type="button" disabled={isBusy} onClick={() => onRemove(player.id)} aria-label={`Remove ${player.name}`} title="Remove player">
              <Trash size={19} weight="bold" />
            </button>
          </div>
        ))}
      </div>
      <div className="organizer-add-player">
        <label className="sr-only" htmlFor="shared-new-player">New player name</label>
        <input id="shared-new-player" className="player-name-input" value={newName} maxLength={80} disabled={isBusy || game.players.length >= 50} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void add(); }} placeholder="New player" />
        <button className="add-player-button" type="button" onClick={add} disabled={isBusy || game.players.length >= 50}>
          <Plus size={18} weight="bold" /> Add
        </button>
      </div>
      <div className="shared-game-settings" aria-label="Game settings">
        <span>{game.cardsPerPlayer} commanders each</span>
        <span><JokerCardIcon size={18} /> {game.jokersPerPlayer} jokers each</span>
      </div>
      <button className="draw-button" type="button" onClick={onNewGame} disabled={isBusy || game.players.length === 0}>
        New game
      </button>
    </section>
  );
}
