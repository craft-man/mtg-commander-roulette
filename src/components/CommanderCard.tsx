import {
  ArrowsClockwise,
  ArrowSquareOut,
  ChartLineUp,
  LockKey,
  LockKeyOpen,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { Commander } from "../models/Commander";
import { ManaSymbols } from "./ManaSymbols";

interface CommanderCardProps {
  commander: Commander;
  isLocked?: boolean;
  onToggleLock?: () => void;
  lockDisabled?: boolean;
}

export function CommanderCard({
  commander,
  isLocked = false,
  onToggleLock,
  lockDisabled = false,
}: CommanderCardProps) {
  const [isTransformed, setIsTransformed] = useState(false);
  const canTransform = Boolean(commander.backImageUrl);

  return (
    <article
      className={`commander-card${isTransformed ? " is-transformed" : ""}${isLocked ? " is-locked" : ""}`}
    >
      {onToggleLock ? (
        <button
          className="card-lock-button"
          type="button"
          onClick={onToggleLock}
          disabled={lockDisabled}
          aria-pressed={isLocked}
          aria-label={`${isLocked ? "Release" : "Fix"} ${commander.name}`}
          title={isLocked ? "Release this commander" : "Fix this commander"}
        >
          {isLocked ? <LockKey size={16} weight="fill" /> : <LockKeyOpen size={16} weight="bold" />}
          {isLocked ? <span>Fixed</span> : null}
        </button>
      ) : null}
      <a
        className="commander-card-link"
        href={commander.scryfallUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${commander.name} on Scryfall`}
      >
        <span className="card-flip">
          <img className="card-face" src={commander.imageUrl} alt={`Artwork for ${commander.name}`} />
          {canTransform ? (
            <img
              className="card-face card-face-back"
              src={commander.backImageUrl}
              alt=""
              aria-hidden="true"
            />
          ) : null}
        </span>
        <span className="commander-card-content">
          <span className="commander-card-topline">
            <span className="commander-name">{commander.name}</span>
            <ArrowSquareOut size={17} weight="bold" aria-hidden="true" />
          </span>
          <ManaSymbols colors={commander.colorIdentity} />
        </span>
      </a>
      {canTransform ? (
        <button
          className="transform-button"
          type="button"
          onClick={() => setIsTransformed((current) => !current)}
          aria-pressed={isTransformed}
        >
          <ArrowsClockwise size={16} weight="bold" />
          Transform
        </button>
      ) : null}
      <div className="commander-resource-links">
        <a
          className="commander-resource-link"
          href={commander.edhrecUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${commander.name} on EDHREC`}
        >
          <ChartLineUp size={16} weight="bold" />
          EDHREC
        </a>
      </div>
    </article>
  );
}
