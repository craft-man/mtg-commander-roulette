import { ArrowCounterClockwise, X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

interface NewGameDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function NewGameDialog({ isOpen, onCancel, onConfirm }: NewGameDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="new-game-dialog"
      aria-labelledby="new-game-title"
      aria-describedby="new-game-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="new-game-dialog-content">
        <button
          className="dialog-close-button"
          type="button"
          onClick={onCancel}
          aria-label="Close new game confirmation"
        >
          <X size={19} weight="bold" />
        </button>

        <span className="dialog-symbol" aria-hidden="true">
          <ArrowCounterClockwise size={24} weight="bold" />
        </span>
        <h2 id="new-game-title">Start a new game?</h2>
        <p id="new-game-description">
          Your current draw, fixed commanders, and remaining jokers will be cleared. Your players
          and game settings will stay at the table.
        </p>

        <div className="new-game-dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel} autoFocus>
            Keep this game
          </button>
          <button className="dialog-confirm-button" type="button" onClick={onConfirm}>
            Start new game
          </button>
        </div>
      </div>
    </dialog>
  );
}
