import { ArrowsClockwise, Copy } from "@phosphor-icons/react";
import type { PlayerDraw } from "../models/PlayerDraw";
import { CommanderCard } from "./CommanderCard";

interface DrawResultsProps {
  draws: PlayerDraw[];
  isRerolling: boolean;
  onRerollAll?: () => void;
  onRerollPlayer?: (playerId: string) => void;
  onShare?: () => void;
  shareStatus?: string | null;
  announcement?: { id: number; message: string } | null;
  readOnly?: boolean;
}

export function DrawResults({
  draws,
  isRerolling,
  onRerollAll,
  onRerollPlayer,
  onShare,
  shareStatus,
  announcement,
  readOnly = false,
}: DrawResultsProps) {
  if (draws.length === 0) {
    return (
      <section className="results-empty" aria-live="polite">
        <div className="results-empty-content">
          <p className="section-label">02 / The draw</p>
          <h2>Leave the commander<br /><em>to chance.</em></h2>
          <p>
            A few unexpected picks. A deck you wouldn’t usually build.
            Draw commanders for your table, choose your favourite, and meet back here for a game.
          </p>
        </div>
        <div className="draw-note"><span aria-hidden="true">↳</span><p>One choice each.<br />No duplicate commanders.<br />The rest is up to you.</p></div>
      </section>
    );
  }

  return (
    <section className="results-section" aria-labelledby="results-title">
      {announcement ? (
        <p key={announcement.id} className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement.message}
        </p>
      ) : null}
      <div className="results-heading">
        <div>
          <p className="section-label">02 / The draw</p>
          <h2 id="results-title">Your commanders</h2>
          <p className="results-summary">
            Each player chooses one of their drawn commanders, then builds a deck around it.
          </p>
        </div>
        {!readOnly ? (
          <div className="results-actions">
            <button className="secondary-button" type="button" onClick={onShare}>
              <Copy size={18} weight="bold" />
              Share link
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onRerollAll}
              disabled={isRerolling}
            >
              <ArrowsClockwise size={19} weight="bold" />
              Reroll all
            </button>
            {shareStatus ? (
              <p className="results-status" role="status">
                {shareStatus}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="draw-list">
        {draws.map((draw) => (
          <article className="player-draw" key={draw.player.id}>
            <div className="draw-player-heading">
              <h3>{draw.player.name || "Unnamed player"}</h3>
              {!readOnly ? (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => onRerollPlayer?.(draw.player.id)}
                  disabled={isRerolling}
                >
                  <ArrowsClockwise size={16} weight="bold" />
                  Reroll
                </button>
              ) : null}
            </div>
            <div className="commander-grid">
              {draw.commanders.map((commander) => (
                <CommanderCard key={commander.id} commander={commander} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
