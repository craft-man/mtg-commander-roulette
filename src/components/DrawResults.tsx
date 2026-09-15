import { ArrowsClockwise, Copy } from "@phosphor-icons/react";
import type { PlayerGameStates } from "../models/PlayerGameState";
import type { PlayerDraw } from "../models/PlayerDraw";
import { CommanderCard } from "./CommanderCard";
import { JokerCardIcon } from "./JokerCardIcon";

interface DrawResultsProps {
  draws: PlayerDraw[];
  isRerolling: boolean;
  onRerollAll?: () => void;
  onRerollPlayer?: (playerId: string) => void;
  onShare?: () => void;
  shareLabel?: string;
  shareStatus?: string | null;
  announcement?: { id: number; message: string } | null;
  playerGameStates?: PlayerGameStates;
  onToggleLock?: (playerId: string, commanderOracleId: string) => void;
  readOnly?: boolean;
}

export function DrawResults({
  draws,
  isRerolling,
  onRerollAll,
  onRerollPlayer,
  onShare,
  shareLabel = "Share table",
  shareStatus,
  announcement,
  playerGameStates = {},
  onToggleLock,
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

  const canRerollAny = draws.some((draw) => {
    const state = playerGameStates[draw.player.id];
    if (!state || state.jokersRemaining < 1) return false;
    const lockedIds = new Set(state.lockedCommanderOracleIds);
    return draw.commanders.some((commander) => !lockedIds.has(commander.oracleId));
  });

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
        {!readOnly && (onShare || onRerollAll) ? (
          <div className="results-actions">
            {onShare ? (
              <button className="secondary-button" type="button" onClick={onShare}>
                <Copy size={18} weight="bold" />
                {shareLabel}
              </button>
            ) : null}
            {onRerollAll ? (
              <button
                className="secondary-button"
                type="button"
                onClick={onRerollAll}
                disabled={isRerolling || !canRerollAny}
              >
                <ArrowsClockwise size={19} weight="bold" />
                Reroll all
              </button>
            ) : null}
            {shareStatus ? (
              <p className="results-status" role="status">
                {shareStatus}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="draw-list">
        {draws.map((draw) => {
          const gameState = playerGameStates[draw.player.id];
          const lockedIds = new Set(gameState?.lockedCommanderOracleIds ?? []);
          const allCommandersLocked = draw.commanders.every((commander) =>
            lockedIds.has(commander.oracleId),
          );
          const canRerollPlayer = Boolean(
            gameState && gameState.jokersRemaining > 0 && !allCommandersLocked,
          );

          return <article className="player-draw" key={draw.player.id}>
            <div className="draw-player-heading">
              <h3>{draw.player.name || "Unnamed player"}</h3>
              {!readOnly && onRerollPlayer ? (
                <div className="player-reroll-controls">
                  {gameState ? (
                  <span
                    className={`joker-count${gameState.jokersRemaining === 0 ? " is-empty" : ""}`}
                  >
                    <JokerCardIcon className="joker-count-icon" size={20} />
                    {gameState.jokersRemaining} {gameState.jokersRemaining === 1 ? "joker" : "jokers"} left
                  </span>
                  ) : null}
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onRerollPlayer?.(draw.player.id)}
                    disabled={isRerolling || !canRerollPlayer}
                    title={
                      gameState?.jokersRemaining === 0
                        ? "No jokers remaining"
                        : allCommandersLocked
                          ? "Release a commander before rerolling"
                          : "Spend one joker to reroll unfixed commanders"
                    }
                  >
                    <ArrowsClockwise size={16} weight="bold" />
                    Reroll
                  </button>
                </div>
              ) : null}
            </div>
            <div className="commander-grid">
              {draw.commanders.map((commander) => (
                <CommanderCard
                  key={commander.id}
                  commander={commander}
                  isLocked={lockedIds.has(commander.oracleId)}
                  onToggleLock={
                    readOnly || !onToggleLock
                      ? undefined
                      : () => onToggleLock(draw.player.id, commander.oracleId)
                  }
                  lockDisabled={isRerolling}
                />
              ))}
            </div>
          </article>;
        })}
      </div>
    </section>
  );
}
