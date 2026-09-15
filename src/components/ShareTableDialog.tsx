import { ArrowClockwise, Copy, Eye, UsersThree, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { OrganizerGameView } from "../models/CollaborativeGame";
import { createCollaborativeUrl } from "../utils/collaborative";

interface ShareTableDialogProps {
  isOpen: boolean;
  view: OrganizerGameView;
  isBusy: boolean;
  onClose: () => void;
  onRotate: (target: "player" | "spectator", playerId?: string) => Promise<void>;
}

export function ShareTableDialog({ isOpen, view, isBusy, onClose, onRotate }: ShareTableDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
    if (!isOpen) setStatus(null);
  }, [isOpen]);

  const copy = async (label: string, token: string) => {
    try {
      await navigator.clipboard.writeText(createCollaborativeUrl(view.game.id, token, window.location));
      setStatus(`${label} link copied.`);
    } catch {
      setStatus("Your browser could not copy this link. Try again from a secure browser tab.");
    }
  };

  const copyAll = async () => {
    const lines = view.access.players.map(
      (player) => `${player.playerName}: ${createCollaborativeUrl(view.game.id, player.token, window.location)}`,
    );
    lines.push(`Spectator: ${createCollaborativeUrl(view.game.id, view.access.spectatorToken, window.location)}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setStatus("All private links copied.");
    } catch {
      setStatus("Your browser could not copy the links. Try again from a secure browser tab.");
    }
  };

  const rotate = async (target: "player" | "spectator", playerId?: string) => {
    const label = target === "spectator" ? "spectator" : "player";
    if (!window.confirm(`Replace this ${label} link? The previous link will stop working immediately.`)) return;
    setStatus(null);
    try {
      await onRotate(target, playerId);
      setStatus(`The ${label} link was replaced. Copy the new link before closing.`);
    } catch {
      setStatus(`The ${label} link could not be replaced. Please try again.`);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="share-table-dialog"
      aria-labelledby="share-table-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="share-table-dialog-content">
        <button className="dialog-close-button" type="button" onClick={onClose} aria-label="Close table links">
          <X size={19} weight="bold" />
        </button>
        <div className="share-dialog-heading">
          <span className="dialog-symbol" aria-hidden="true"><UsersThree size={25} weight="bold" /></span>
          <div>
            <h2 id="share-table-title">Pass the cards around</h2>
            <p>Each player link opens one private line. Replacing a link revokes the previous one.</p>
          </div>
        </div>

        <div className="share-link-list">
          {view.access.players.map((player) => (
            <div className="share-link-row" key={player.playerId}>
              <div><span>Player</span><strong>{player.playerName}</strong></div>
              <div className="share-link-actions">
                <button type="button" className="secondary-button compact-button" onClick={() => copy(player.playerName, player.token)} disabled={isBusy}>
                  <Copy size={16} weight="bold" /> Copy
                </button>
                <button type="button" className="icon-button" onClick={() => rotate("player", player.playerId)} disabled={isBusy} aria-label={`Replace ${player.playerName}'s link`} title="Replace link">
                  <ArrowClockwise size={18} weight="bold" />
                </button>
              </div>
            </div>
          ))}
          <div className="share-link-row spectator-link-row">
            <div><span><Eye size={15} weight="bold" /> Spectator</span><strong>Whole table · read only</strong></div>
            <div className="share-link-actions">
              <button type="button" className="secondary-button compact-button" onClick={() => copy("Spectator", view.access.spectatorToken)} disabled={isBusy}>
                <Copy size={16} weight="bold" /> Copy
              </button>
              <button type="button" className="icon-button" onClick={() => rotate("spectator")} disabled={isBusy} aria-label="Replace spectator link" title="Replace link">
                <ArrowClockwise size={18} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        <div className="share-dialog-footer">
          <p role="status">{status}</p>
          <button type="button" className="dialog-confirm-button" onClick={copyAll} disabled={isBusy}>
            <Copy size={18} weight="bold" /> Copy all links
          </button>
        </div>
      </div>
    </dialog>
  );
}
