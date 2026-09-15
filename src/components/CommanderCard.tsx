import {
  ArrowsClockwise,
  ArrowSquareOut,
  ChartLineUp,
  LockKey,
  LockKeyOpen,
  Users,
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
  const pairingText = commander.pairing?.partnerWith
    ? `Partner with ${commander.pairing.partnerWith.name}`
    : commander.pairing?.label;

  return (
    <article
      className={`commander-card${isTransformed ? " is-transformed" : ""}${isLocked ? " is-locked" : ""}`}
    >
      <div className="commander-card-media">
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
          aria-label={`Open artwork for ${commander.name} on Scryfall`}
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
        </a>
        {canTransform ? (
          <button
            className="transform-button"
            type="button"
            onClick={() => setIsTransformed((current) => !current)}
            aria-pressed={isTransformed}
            aria-label={`Transform ${commander.name}`}
            title="Transform commander"
          >
            <ArrowsClockwise size={18} weight="bold" />
          </button>
        ) : null}
      </div>
      <a
        className="commander-card-link"
        href={commander.scryfallUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${commander.name} on Scryfall`}
      >
        <span className="commander-card-content">
          <span className="commander-card-topline">
            <span className="commander-name">{commander.name}</span>
            <ArrowSquareOut size={17} weight="bold" aria-hidden="true" />
          </span>
          <ManaSymbols colors={commander.colorIdentity} />
        </span>
      </a>
      <div
        className={`commander-resource-links${commander.pairing ? " has-pairing" : ""}`}
      >
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
        {commander.pairing ? (
          <a
            className="commander-resource-link"
            href={commander.pairing.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open compatible ${pairingText} for ${commander.name} on EDHREC`}
          >
            <Users size={16} weight="bold" />
            {pairingText}
          </a>
        ) : null}
      </div>
    </article>
  );
}
