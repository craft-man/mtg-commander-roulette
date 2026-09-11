import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import brandLogo from "./assets/commander-roulette-logo.png";
import { DrawResults } from "./components/DrawResults";
import { PlayerList } from "./components/PlayerList";
import { useCommanders } from "./hooks/useCommanders";
import type { Player } from "./models/Player";
import type { PlayerDraw } from "./models/PlayerDraw";
import { CARD_LANGUAGES, type CardLanguage } from "./services/scryfall";
import { drawForPlayers, rerollPlayer } from "./utils/draw";
import { createShareUrl, hydrateSharedDraw, readSharedDraw } from "./utils/share";

function createPlayerId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function normalisePlayers(players: Player[]): Player[] {
  return players.map((player, index) => ({
    ...player,
    name: player.name.trim() || `Player ${index + 1}`,
  }));
}

export default function App() {
  const [sharedDraw] = useState(() => readSharedDraw(window.location.hash));
  const [players, setPlayers] = useState<Player[]>([]);
  const [cardsPerPlayer, setCardsPerPlayer] = useState(3);
  const [language, setLanguage] = useState<CardLanguage>(sharedDraw?.language ?? "en");
  const [draws, setDraws] = useState<PlayerDraw[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [resultAnnouncement, setResultAnnouncement] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const [isRerolling, setIsRerolling] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isSharedLoading, setIsSharedLoading] = useState(Boolean(sharedDraw));
  const { getCommanders, isLoading, error, clearError } = useCommanders();
  const drawnPlayerIds = useMemo(() => new Set(draws.map((draw) => draw.player.id)), [draws]);

  const announceResult = (message: string) => {
    setResultAnnouncement((current) => ({
      id: (current?.id ?? 0) + 1,
      message,
    }));
  };

  useEffect(() => {
    if (!sharedDraw) return;

    let isCurrent = true;
    getCommanders(sharedDraw.language)
      .then((commanders) => {
        if (isCurrent) setDraws(hydrateSharedDraw(sharedDraw, commanders));
      })
      .catch((cause) => {
        if (isCurrent && cause instanceof Error) setActionError(cause.message);
      })
      .finally(() => {
        if (isCurrent) setIsSharedLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [getCommanders, sharedDraw]);

  const addPlayer = () => {
    setPlayers((current) => [
      ...current,
      { id: createPlayerId(), name: `Player ${current.length + 1}` },
    ]);
  };

  const updatePlayer = (id: string, name: string) => {
    setPlayers((current) => current.map((player) => (player.id === id ? { ...player, name } : player)));
    setDraws((current) =>
      current.map((draw) =>
        draw.player.id === id ? { ...draw, player: { ...draw.player, name } } : draw,
      ),
    );
  };

  const removePlayer = (id: string) => {
    setPlayers((current) => current.filter((player) => player.id !== id));
    setDraws((current) => current.filter((draw) => draw.player.id !== id));
  };

  const updateCardsPerPlayer = (count: number) => {
    setCardsPerPlayer(Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1);
  };

  const drawAddedPlayer = async (playerId: string) => {
    const playerIndex = players.findIndex((player) => player.id === playerId);
    const player = players[playerIndex];
    if (!player || drawnPlayerIds.has(playerId)) return;

    setActionError(null);
    setIsRerolling(true);
    try {
      const pool = await getCommanders(language);
      const preparedPlayer = {
        ...player,
        name: player.name.trim() || `Player ${playerIndex + 1}`,
      };
      setPlayers((current) =>
        current.map((currentPlayer) =>
          currentPlayer.id === playerId ? preparedPlayer : currentPlayer,
        ),
      );
      setDraws((current) => {
        const assignedIds = new Set(
          current.flatMap((draw) => draw.commanders.map((commander) => commander.id)),
        );
        const available = pool.filter((commander) => !assignedIds.has(commander.id));
        const newDraw = drawForPlayers([preparedPlayer], available, cardsPerPlayer)[0];
        return [...current, newDraw].sort(
          (first, second) =>
            players.findIndex((currentPlayer) => currentPlayer.id === first.player.id) -
            players.findIndex((currentPlayer) => currentPlayer.id === second.player.id),
        );
      });
      announceResult(`${preparedPlayer.name}'s commander options are ready.`);
    } catch (cause) {
      if (cause instanceof Error && cause.message !== "Unable to retrieve commanders from Scryfall.") {
        setActionError(cause.message);
      }
    } finally {
      setIsRerolling(false);
    }
  };

  const drawAll = async () => {
    if (players.length === 0) return;

    setActionError(null);
    setIsRerolling(true);
    clearError();
    try {
      const pool = await getCommanders(language);
      const preparedPlayers = normalisePlayers(players);
      setPlayers(preparedPlayers);
      setDraws(drawForPlayers(preparedPlayers, pool, cardsPerPlayer));
      announceResult(
        `${preparedPlayers.length} player${preparedPlayers.length === 1 ? "" : "s"} have commander assignments ready.`,
      );
    } catch (cause) {
      if (cause instanceof Error && cause.message !== "Unable to retrieve commanders from Scryfall.") {
        setActionError(cause.message);
      }
    } finally {
      setIsRerolling(false);
    }
  };

  const rerollAll = async () => {
    setActionError(null);
    setIsRerolling(true);
    try {
      const pool = await getCommanders(language);
      const preparedPlayers = normalisePlayers(players);
      setPlayers(preparedPlayers);
      setDraws(drawForPlayers(preparedPlayers, pool, cardsPerPlayer));
      announceResult("All commander assignments have been redrawn.");
    } catch (cause) {
      if (cause instanceof Error && cause.message !== "Unable to retrieve commanders from Scryfall.") {
        setActionError(cause.message);
      }
    } finally {
      setIsRerolling(false);
    }
  };

  const rerollOne = async (playerId: string) => {
    setActionError(null);
    setIsRerolling(true);
    try {
      const pool = await getCommanders(language);
      const player = players.find((currentPlayer) => currentPlayer.id === playerId);
      setDraws((current) => rerollPlayer(current, playerId, pool));
      announceResult(`${player?.name || "Player"}'s commander options have been redrawn.`);
    } catch (cause) {
      if (cause instanceof Error && cause.message !== "Unable to retrieve commanders from Scryfall.") {
        setActionError(cause.message);
      }
    } finally {
      setIsRerolling(false);
    }
  };

  const shareDraw = async () => {
    const url = createShareUrl(draws, language, window.location);
    setShareStatus(null);
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Share link copied to your clipboard.");
    } catch {
      setActionError("Your browser could not copy the share link.");
    }
  };

  const changeLanguage = async (nextLanguage: CardLanguage) => {
    if (draws.length === 0) {
      setLanguage(nextLanguage);
      return;
    }

    setActionError(null);
    setIsChangingLanguage(true);
    try {
      const translatedCommanders = await getCommanders(nextLanguage);
      const commanderByOracleId = new Map(
        translatedCommanders.map((commander) => [commander.oracleId, commander]),
      );
      setDraws((current) =>
        current.map((draw) => ({
          ...draw,
          commanders: draw.commanders.map(
            (commander) => commanderByOracleId.get(commander.oracleId) ?? commander,
          ),
        })),
      );
      setLanguage(nextLanguage);
    } catch (cause) {
      if (cause instanceof Error && cause.message !== "Unable to retrieve commanders from Scryfall.") {
        setActionError(cause.message);
      }
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const visibleError = error ?? actionError;
  const drawLabel = isLoading || isRerolling ? "Drawing commanders..." : "Draw commanders";
  const isBlockingLoad = isLoading && (draws.length === 0 || isChangingLanguage);
  const isActionInProgress = isLoading || isRerolling || isChangingLanguage;

  if (sharedDraw) {
    return (
      <>
        <main className="app-shell shared-app-shell" inert={isBlockingLoad}>
          <header className="app-header">
            <div className="header-tools">
              <p>Shared draw - read only.</p>
              <LanguageSelect language={language} disabled />
            </div>
          </header>
          {isSharedLoading ? <LoadingResults /> : null}
          {!isSharedLoading ? (
            <DrawResults draws={draws} isRerolling={false} readOnly />
          ) : null}
          {visibleError ? (
            <p className="error-message shared-error" role="alert">
              {visibleError}
            </p>
          ) : null}
          <SiteFooter />
        </main>
        {isBlockingLoad ? <InitialLoadOverlay isLanguageChange={isChangingLanguage} /> : null}
      </>
    );
  }

  return (
    <>
      <main className="app-shell" inert={isBlockingLoad}>
        <header className="app-header">
          <div className="header-tools">
            <LanguageSelect
              language={language}
              onChange={changeLanguage}
              disabled={isActionInProgress}
            />
          </div>
        </header>

        <div className="app-layout">
          <section className="pod-stage">
            <PlayerList
              players={players}
              cardsPerPlayer={cardsPerPlayer}
              onAdd={addPlayer}
              onCardsPerPlayerChange={updateCardsPerPlayer}
              onChange={updatePlayer}
              onRemove={removePlayer}
              drawnPlayerIds={drawnPlayerIds}
              onDrawPlayer={drawAddedPlayer}
              onDrawAll={drawAll}
              drawLabel={drawLabel}
              isDrawDisabled={players.length === 0 || isActionInProgress}
              isBusy={isActionInProgress}
            />
            {visibleError ? (
              <p className="error-message pod-error" role="alert">
                {visibleError}
              </p>
            ) : null}
          </section>

          <div className="results-column">
            {isLoading && draws.length === 0 ? <LoadingResults /> : null}
            {!isLoading || draws.length > 0 ? (
              <DrawResults
                draws={draws}
                isRerolling={isRerolling || isLoading}
                onRerollAll={rerollAll}
                onRerollPlayer={rerollOne}
                onShare={shareDraw}
                shareStatus={shareStatus}
                announcement={resultAnnouncement}
              />
            ) : null}
          </div>
        </div>
        <SiteFooter />
      </main>
      {isBlockingLoad ? <InitialLoadOverlay isLanguageChange={isChangingLanguage} /> : null}
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        Commander Roulette is not affiliated with Magic: The Gathering or Wizards of the Coast. It
        is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. The
        literal and graphical information presented on this site about Magic: The Gathering,
        including card images and mana symbols, is copyright Wizards of the Coast, LLC. Scryfall is
        not produced by or endorsed by Wizards of the Coast.
      </p>
    </footer>
  );
}

function InitialLoadOverlay({ isLanguageChange = false }: { isLanguageChange?: boolean }) {
  const title = isLanguageChange ? "Loading your selected language" : "Preparing the commander pool";
  const message = isLanguageChange
    ? "This language is being downloaded for the first time. It can take a little while; everything will unlock automatically when it is ready."
    : "The first download can take a little while. Please keep this page open; everything will unlock automatically when it is ready.";

  return (
    <section className="initial-load-overlay" role="status" aria-live="assertive">
      <div className="initial-load-message">
        <span className="initial-load-spinner roulette-symbol" aria-hidden="true">
          <img src={brandLogo} alt="" />
        </span>
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
    </section>
  );
}

function LoadingResults() {
  return (
    <section className="loading-results" aria-label="Loading commanders" aria-live="polite">
      <div className="loading-heading shimmer" />
      <div className="loading-cards">
        <div className="loading-card shimmer" />
        <div className="loading-card shimmer" />
        <div className="loading-card shimmer" />
      </div>
    </section>
  );
}

function LanguageSelect({
  language,
  onChange,
  disabled = false,
}: {
  language: CardLanguage;
  onChange?: (language: CardLanguage) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedOption, setFocusedOption] = useState(0);
  const selectRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedLanguage = CARD_LANGUAGES.find(({ code }) => code === language) ?? CARD_LANGUAGES[0];
  const selectedIndex = CARD_LANGUAGES.findIndex(({ code }) => code === language);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!selectRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener("mousedown", closeOnOutsideClick);
      window.addEventListener("keydown", closeOnEscape);
    }

    return () => {
      window.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) optionRefs.current[focusedOption]?.focus();
  }, [focusedOption, isOpen]);

  const openMenu = (index = selectedIndex) => {
    setFocusedOption(index);
    setIsOpen(true);
  };

  const selectLanguage = (nextLanguage: CardLanguage) => {
    onChange?.(nextLanguage);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const moveFocus = (index: number, direction: number) => {
    const nextIndex = (index + direction + CARD_LANGUAGES.length) % CARD_LANGUAGES.length;
    setFocusedOption(nextIndex);
  };

  return (
    <div className="language-select" ref={selectRef}>
      <button
        className="language-select-trigger"
        type="button"
        ref={triggerRef}
        aria-label="Card language"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            openMenu(selectedIndex);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            openMenu((selectedIndex + CARD_LANGUAGES.length - 1) % CARD_LANGUAGES.length);
          }
        }}
      >
        <LanguageFlag language={language} />
        <span>{selectedLanguage.label}</span>
        <CaretDown size={14} weight="bold" aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="language-select-menu" role="menu" aria-label="Card language">
          {CARD_LANGUAGES.map(({ code, label }, index) => (
            <button
              className="language-option"
              type="button"
              role="menuitemradio"
              aria-checked={language === code}
              key={code}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              onClick={() => selectLanguage(code)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  moveFocus(index, 1);
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  moveFocus(index, -1);
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  setFocusedOption(0);
                }
                if (event.key === "End") {
                  event.preventDefault();
                  setFocusedOption(CARD_LANGUAGES.length - 1);
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }
              }}
            >
              <LanguageFlag language={code} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LanguageFlag({ language }: { language: CardLanguage }) {
  const commonProps = {
    className: "language-flag",
    viewBox: "0 0 28 20",
    ariaHidden: true,
    focusable: false,
  };

  switch (language) {
    case "es":
      return (
        <svg {...commonProps}>
          <rect width="28" height="5" fill="#aa151b" />
          <rect y="5" width="28" height="10" fill="#f1bf00" />
          <rect y="15" width="28" height="5" fill="#aa151b" />
        </svg>
      );
    case "fr":
      return (
        <svg {...commonProps}>
          <rect width="9.34" height="20" fill="#1d45a2" />
          <rect x="9.33" width="9.34" height="20" fill="#fff" />
          <rect x="18.66" width="9.34" height="20" fill="#e33b47" />
        </svg>
      );
    case "de":
      return (
        <svg {...commonProps}>
          <rect width="28" height="6.67" fill="#1a1a1a" />
          <rect y="6.66" width="28" height="6.67" fill="#d4343b" />
          <rect y="13.33" width="28" height="6.67" fill="#eab739" />
        </svg>
      );
    case "it":
      return (
        <svg {...commonProps}>
          <rect width="9.34" height="20" fill="#16844a" />
          <rect x="9.33" width="9.34" height="20" fill="#fff" />
          <rect x="18.66" width="9.34" height="20" fill="#d8424b" />
        </svg>
      );
    case "ja":
      return (
        <svg {...commonProps}>
          <rect width="28" height="20" fill="#fff" />
          <circle cx="14" cy="10" r="5.6" fill="#cc3346" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <rect width="28" height="20" fill="#0d2862" />
          <path d="M0 0 28 20M28 0 0 20" stroke="#fff" strokeWidth="5" />
          <path d="M0 0 28 20M28 0 0 20" stroke="#cf3a48" strokeWidth="2" />
          <path d="M14 0v20M0 10h28" stroke="#fff" strokeWidth="7" />
          <path d="M14 0v20M0 10h28" stroke="#cf3a48" strokeWidth="3" />
        </svg>
      );
  }
}
