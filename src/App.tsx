import { CaretDown } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import brandLogo from "./assets/commander-roulette-logo.png";
import { DrawResults } from "./components/DrawResults";
import { NewGameDialog } from "./components/NewGameDialog";
import { OrganizerTablePanel } from "./components/OrganizerTablePanel";
import { PlayerList } from "./components/PlayerList";
import { ShareTableDialog } from "./components/ShareTableDialog";
import { useCommanders } from "./hooks/useCommanders";
import type {
  CollaborativeAccess,
  CollaborativeGameView,
  OrganizerGameView,
} from "./models/CollaborativeGame";
import type { PlayerGameStates } from "./models/PlayerGameState";
import type { Player } from "./models/Player";
import type { PlayerDraw } from "./models/PlayerDraw";
import {
  CARD_LANGUAGES,
  COMMANDER_LOAD_ERROR,
  type CardLanguage,
} from "./services/commanderApi";
import {
  addSharedPlayer,
  fetchGame,
  GameApiError,
  publishGame,
  removeSharedPlayer,
  rerollSharedPlayer,
  resetSharedGame,
  rotateSharedAccess,
  setSharedCommanderLock,
  updateSharedLanguage,
  updateSharedPlayer,
} from "./services/gameApi";
import {
  createCollaborativeUrl,
  createPublishGameInput,
  hydrateGameSnapshot,
  readCollaborativeAccess,
} from "./utils/collaborative";
import { drawForPlayers, rerollPlayers } from "./utils/draw";
import {
  createPlayerGameState,
  createPlayerGameStates,
  getRerollEligiblePlayerIds,
  lockedCommanderMap,
  spendJokers,
} from "./utils/game";
import { hydrateSharedDraw, readSharedDraw } from "./utils/share";

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
  const [collaborativeAccess, setCollaborativeAccess] = useState<CollaborativeAccess | null>(() =>
    readCollaborativeAccess(window.location.hash),
  );
  const [publishedView, setPublishedView] = useState<OrganizerGameView | null>(null);
  const [openShareAfterPublish, setOpenShareAfterPublish] = useState(false);
  const [sharedDraw] = useState(() =>
    readCollaborativeAccess(window.location.hash) ? null : readSharedDraw(window.location.hash),
  );
  const [players, setPlayers] = useState<Player[]>([]);
  const [cardsPerPlayer, setCardsPerPlayer] = useState(3);
  const [jokersPerPlayer, setJokersPerPlayer] = useState(2);
  const [language, setLanguage] = useState<CardLanguage>(sharedDraw?.language ?? "en");
  const [draws, setDraws] = useState<PlayerDraw[]>([]);
  const [playerGameStates, setPlayerGameStates] = useState<PlayerGameStates>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [resultAnnouncement, setResultAnnouncement] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const [isNewGameDialogOpen, setIsNewGameDialogOpen] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
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
    setPlayerGameStates((current) => {
      const remaining = { ...current };
      delete remaining[id];
      return remaining;
    });
  };

  const updateCardsPerPlayer = (count: number) => {
    setCardsPerPlayer(Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1);
  };

  const updateJokersPerPlayer = (count: number) => {
    setJokersPerPlayer(Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0);
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
          current.flatMap((draw) => draw.commanders.map((commander) => commander.oracleId)),
        );
        const available = pool.filter((commander) => !assignedIds.has(commander.oracleId));
        const newDraw = drawForPlayers([preparedPlayer], available, cardsPerPlayer)[0];
        return [...current, newDraw].sort(
          (first, second) =>
            players.findIndex((currentPlayer) => currentPlayer.id === first.player.id) -
            players.findIndex((currentPlayer) => currentPlayer.id === second.player.id),
        );
      });
      setPlayerGameStates((current) => ({
        ...current,
        [playerId]: createPlayerGameState(jokersPerPlayer),
      }));
      announceResult(`${preparedPlayer.name}'s commander options are ready.`);
    } catch (cause) {
      if (cause instanceof Error && cause.message !== COMMANDER_LOAD_ERROR) {
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
      setPlayerGameStates(createPlayerGameStates(preparedPlayers, jokersPerPlayer));
      announceResult(
        `${preparedPlayers.length} player${preparedPlayers.length === 1 ? "" : "s"} have commander assignments ready.`,
      );
    } catch (cause) {
      if (cause instanceof Error && cause.message !== COMMANDER_LOAD_ERROR) {
        setActionError(cause.message);
      }
    } finally {
      setIsRerolling(false);
    }
  };

  const rerollAll = async () => {
    const eligiblePlayerIds = new Set(getRerollEligiblePlayerIds(draws, playerGameStates));
    const eligibleDraws = draws.filter((draw) => eligiblePlayerIds.has(draw.player.id));
    if (eligiblePlayerIds.size === 0) {
      announceResult("No player can reroll: release a commander or start a new game for more jokers.");
      return;
    }

    setActionError(null);
    setIsRerolling(true);
    try {
      const pool = await getCommanders(language);
      const nextDraws = rerollPlayers(
        draws,
        eligiblePlayerIds,
        pool,
        lockedCommanderMap(playerGameStates),
      );
      setDraws(nextDraws);
      setPlayerGameStates((current) => spendJokers(current, eligiblePlayerIds));
      const remainingSummary = eligibleDraws
        .map((draw) => {
          const remaining = playerGameStates[draw.player.id].jokersRemaining - 1;
          return `${draw.player.name}: ${remaining} ${remaining === 1 ? "joker" : "jokers"} left`;
        })
        .join("; ");
      const skippedCount = draws.length - eligibleDraws.length;
      announceResult(
        `${eligibleDraws.length} ${eligibleDraws.length === 1 ? "player" : "players"} redrawn. ${remainingSummary}.${
          skippedCount > 0 ? ` ${skippedCount} ${skippedCount === 1 ? "player was" : "players were"} skipped.` : ""
        }`,
      );
    } catch (cause) {
      if (cause instanceof Error && cause.message !== COMMANDER_LOAD_ERROR) {
        setActionError(cause.message);
      }
    } finally {
      setIsRerolling(false);
    }
  };

  const rerollOne = async (playerId: string) => {
    const draw = draws.find((currentDraw) => currentDraw.player.id === playerId);
    const gameState = playerGameStates[playerId];
    const lockedIds = new Set(gameState?.lockedCommanderOracleIds ?? []);
    if (
      !draw ||
      !gameState ||
      gameState.jokersRemaining < 1 ||
      draw.commanders.every((commander) => lockedIds.has(commander.oracleId))
    ) {
      return;
    }

    setActionError(null);
    setIsRerolling(true);
    try {
      const pool = await getCommanders(language);
      const player = players.find((currentPlayer) => currentPlayer.id === playerId);
      const nextDraws = rerollPlayers(
        draws,
        new Set([playerId]),
        pool,
        new Map([[playerId, lockedIds]]),
      );
      const jokersRemaining = gameState.jokersRemaining - 1;
      setDraws(nextDraws);
      setPlayerGameStates((current) => ({
        ...current,
        [playerId]: { ...current[playerId], jokersRemaining },
      }));
      announceResult(
        `${player?.name || "Player"}'s unfixed commanders have been redrawn. ${jokersRemaining} ${
          jokersRemaining === 1 ? "joker" : "jokers"
        } left.`,
      );
    } catch (cause) {
      if (cause instanceof Error && cause.message !== COMMANDER_LOAD_ERROR) {
        setActionError(cause.message);
      }
    } finally {
      setIsRerolling(false);
    }
  };

  const toggleCommanderLock = (playerId: string, commanderOracleId: string) => {
    const draw = draws.find((currentDraw) => currentDraw.player.id === playerId);
    const commander = draw?.commanders.find((card) => card.oracleId === commanderOracleId);
    if (!draw || !commander || !playerGameStates[playerId]) return;

    const isLocked = playerGameStates[playerId].lockedCommanderOracleIds.includes(commanderOracleId);
    setPlayerGameStates((current) => ({
      ...current,
      [playerId]: {
        ...current[playerId],
        lockedCommanderOracleIds: isLocked
          ? current[playerId].lockedCommanderOracleIds.filter((id) => id !== commanderOracleId)
          : [...current[playerId].lockedCommanderOracleIds, commanderOracleId],
      },
    }));
    announceResult(
      `${commander.name} ${isLocked ? "released" : "fixed"} for ${draw.player.name || "player"}.`,
    );
  };

  const startNewGame = () => {
    setDraws([]);
    setPlayerGameStates({});
    setActionError(null);
    setShareStatus(null);
    setResultAnnouncement(null);
    setIsNewGameDialogOpen(false);
  };

  const shareDraw = async () => {
    if (draws.length === 0 || isPublishing) return;
    setShareStatus(null);
    setActionError(null);
    setIsPublishing(true);
    try {
      const result = await publishGame(
        createPublishGameInput(draws, playerGameStates, language, cardsPerPlayer, jokersPerPlayer),
      );
      const access = { gameId: result.view.game.id, token: result.organizerToken };
      window.history.replaceState(null, "", createCollaborativeUrl(access.gameId, access.token, window.location));
      setPublishedView(result.view);
      setOpenShareAfterPublish(true);
      setCollaborativeAccess(access);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "This table could not be published.");
    } finally {
      setIsPublishing(false);
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
      if (cause instanceof Error && cause.message !== COMMANDER_LOAD_ERROR) {
        setActionError(cause.message);
      }
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const visibleError = error ?? actionError;
  const hasActiveGame = draws.length > 0;
  const drawLabel = isLoading || isRerolling
    ? "Drawing commanders..."
    : hasActiveGame
      ? "New game"
      : "Draw commanders";
  const isBlockingLoad = isLoading && (draws.length === 0 || isChangingLanguage);
  const isActionInProgress = isLoading || isRerolling || isChangingLanguage || isPublishing;

  if (collaborativeAccess) {
    return (
      <CollaborativeGameApp
        access={collaborativeAccess}
        initialView={publishedView}
        openShareOnLoad={openShareAfterPublish}
      />
    );
  }

  if (sharedDraw) {
    return (
      <>
        <main className="app-shell shared-app-shell" inert={isBlockingLoad}>
          <header className="app-header">
            <Brand />
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
          <Brand />
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
              jokersPerPlayer={jokersPerPlayer}
              onAdd={addPlayer}
              onCardsPerPlayerChange={updateCardsPerPlayer}
              onJokersPerPlayerChange={updateJokersPerPlayer}
              onChange={updatePlayer}
              onRemove={removePlayer}
              drawnPlayerIds={drawnPlayerIds}
              onDrawPlayer={drawAddedPlayer}
              onDrawAll={hasActiveGame ? () => setIsNewGameDialogOpen(true) : drawAll}
              drawLabel={drawLabel}
              isDrawDisabled={players.length === 0 || isActionInProgress}
              isBusy={isActionInProgress}
              settingsLocked={hasActiveGame}
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
                shareLabel={isPublishing ? "Publishing table..." : "Share table"}
                shareStatus={shareStatus}
                announcement={resultAnnouncement}
                playerGameStates={playerGameStates}
                onToggleLock={toggleCommanderLock}
              />
            ) : null}
          </div>
        </div>
        <SiteFooter />
      </main>
      <NewGameDialog
        isOpen={isNewGameDialogOpen}
        onCancel={() => setIsNewGameDialogOpen(false)}
        onConfirm={startNewGame}
      />
      {isBlockingLoad ? <InitialLoadOverlay isLanguageChange={isChangingLanguage} /> : null}
    </>
  );
}

function CollaborativeGameApp({
  access,
  initialView,
  openShareOnLoad,
}: {
  access: CollaborativeAccess;
  initialView: OrganizerGameView | null;
  openShareOnLoad: boolean;
}) {
  const [view, setView] = useState<CollaborativeGameView | null>(initialView);
  const [draws, setDraws] = useState<PlayerDraw[]>([]);
  const [playerGameStates, setPlayerGameStates] = useState<PlayerGameStates>({});
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(!initialView);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isShareOpen, setIsShareOpen] = useState(openShareOnLoad);
  const [isNewGameDialogOpen, setIsNewGameDialogOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<{ id: number; message: string } | null>(null);
  const etagRef = useRef<string | null>(null);
  const requestInFlight = useRef(false);
  const { getCommanders, isLoading: isLoadingCommanders, error: commanderError } = useCommanders();

  const announce = (message: string) => {
    setAnnouncement((current) => ({ id: (current?.id ?? 0) + 1, message }));
  };

  const refresh = useCallback(async (silent = false) => {
    if (requestInFlight.current || !navigator.onLine) return;
    requestInFlight.current = true;
    if (!silent) setIsRefreshing(true);
    try {
      const result = await fetchGame(access.gameId, access.token, etagRef.current);
      etagRef.current = result.etag;
      if (result.view) setView(result.view);
      setError(null);
      setIsOffline(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The shared table could not be loaded.");
    } finally {
      requestInFlight.current = false;
      if (!silent) setIsRefreshing(false);
    }
  }, [access.gameId, access.token]);

  useEffect(() => {
    if (!initialView) void refresh();
  }, [initialView, refresh]);

  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    const onOnline = () => {
      setIsOffline(false);
      poll();
    };
    const onOffline = () => setIsOffline(true);
    const interval = window.setInterval(poll, 3_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh]);

  useEffect(() => {
    if (!view) return;
    let isCurrent = true;
    setDraws([]);
    getCommanders(view.game.language)
      .then((commanders) => {
        if (!isCurrent) return;
        const hydrated = hydrateGameSnapshot(view.game, commanders);
        setDraws(hydrated.draws);
        setPlayerGameStates(hydrated.playerGameStates);
      })
      .catch((cause) => {
        if (isCurrent) setError(cause instanceof Error ? cause.message : "Commander cards could not be loaded.");
      });
    return () => { isCurrent = false; };
  }, [getCommanders, view]);

  const applyMutation = async (
    mutation: () => Promise<CollaborativeGameView>,
    successMessage: string,
  ) => {
    if (isBusy || !navigator.onLine) {
      if (!navigator.onLine) setIsOffline(true);
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const nextView = await mutation();
      etagRef.current = null;
      setView(nextView);
      announce(successMessage);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The shared table could not be updated.";
      setError(message);
      if (cause instanceof GameApiError && cause.status === 409) await refresh(true);
      throw cause;
    } finally {
      setIsBusy(false);
    }
  };

  const playerView = view?.role === "player" ? view : null;
  const organizerView = view?.role === "organizer" ? view : null;
  const player = playerView?.game.players[0];

  const rerollPlayer = async () => {
    if (!player) return;
    try {
      await applyMutation(
        () => rerollSharedPlayer(access.gameId, access.token, player.revision),
        `${player.name}'s unfixed commanders have been redrawn.`,
      );
    } catch {
      // The shared error message and refreshed state are already visible.
    }
  };

  const toggleLock = async (_playerId: string, oracleId: string) => {
    if (!player) return;
    const locked = !player.lockedCommanderOracleIds.includes(oracleId);
    try {
      await applyMutation(
        () => setSharedCommanderLock(access.gameId, access.token, oracleId, locked, player.revision),
        `${locked ? "Commander fixed" : "Commander released"}.`,
      );
    } catch {
      // The shared error message and refreshed state are already visible.
    }
  };

  const organizerMutation = async (
    mutation: () => Promise<CollaborativeGameView>,
    message: string,
  ) => {
    try {
      await applyMutation(mutation, message);
    } catch {
      // Keep the management form available with the server error in context.
    }
  };

  const roleLabel = view?.role === "organizer"
    ? "Table keeper · shared game"
    : view?.role === "player"
      ? "Your private draw"
      : "Spectator view · read only";
  const visibleError = error ?? commanderError;
  const isInitialLoad = isRefreshing && !view;

  if (!view && !isInitialLoad) {
    return (
      <main className="app-shell shared-app-shell">
        <header className="app-header"><Brand /></header>
        <section className="shared-fatal-state" role="alert">
          <h1>This table is out of reach</h1>
          <p>{visibleError || "The private link is invalid, revoked, or expired."}</p>
          <button className="secondary-button" type="button" onClick={() => refresh()}>Try again</button>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <>
      <main className={`app-shell${organizerView ? "" : " shared-app-shell"}`} inert={isInitialLoad}>
        <header className="app-header">
          <Brand />
          <div className="header-tools">
            <p>{roleLabel}</p>
            <LanguageSelect
              language={view?.game.language ?? "en"}
              onChange={organizerView ? (language) => void organizerMutation(
                () => updateSharedLanguage(access.gameId, access.token, language),
                "Card language updated for the table.",
              ) : undefined}
              disabled={!organizerView || isBusy}
            />
          </div>
        </header>

        {isOffline ? <p className="connection-banner" role="status">You are offline. Your last loaded draw stays visible; actions will resume when the connection returns.</p> : null}
        {visibleError ? <p className="error-message shared-error" role="alert">{visibleError}</p> : null}
        {isInitialLoad || (isLoadingCommanders && draws.length === 0) ? <LoadingResults /> : null}

        {view && draws.length > 0 ? organizerView ? (
          <div className="app-layout collaborative-layout">
            <section className="pod-stage">
              <OrganizerTablePanel
                game={organizerView.game}
                isBusy={isBusy}
                onAdd={(name) => organizerMutation(
                  () => addSharedPlayer(access.gameId, access.token, name),
                  `${name} joined the table and received a draw.`,
                )}
                onRename={(playerId, name) => organizerMutation(
                  () => updateSharedPlayer(access.gameId, access.token, playerId, name),
                  `Player renamed to ${name}.`,
                )}
                onRemove={async (playerId) => {
                  const name = organizerView.game.players.find((candidate) => candidate.id === playerId)?.name || "This player";
                  if (!window.confirm(`Remove ${name}? Their private link will stop working immediately.`)) return;
                  await organizerMutation(
                    () => removeSharedPlayer(access.gameId, access.token, playerId),
                    `${name} left the table.`,
                  );
                }}
                onNewGame={() => setIsNewGameDialogOpen(true)}
              />
            </section>
            <div className="results-column">
              <DrawResults
                draws={draws}
                isRerolling={isBusy}
                onShare={() => setIsShareOpen(true)}
                shareLabel="Table links"
                announcement={announcement}
                playerGameStates={playerGameStates}
              />
            </div>
          </div>
        ) : (
          <div className="collaborative-results">
            <DrawResults
              draws={draws}
              isRerolling={isBusy}
              onRerollPlayer={playerView ? () => void rerollPlayer() : undefined}
              announcement={announcement}
              playerGameStates={playerGameStates}
              onToggleLock={playerView ? toggleLock : undefined}
              readOnly={view.role === "spectator"}
            />
          </div>
        ) : null}
        <SiteFooter />
      </main>

      {organizerView ? (
        <ShareTableDialog
          isOpen={isShareOpen}
          view={organizerView}
          isBusy={isBusy}
          onClose={() => setIsShareOpen(false)}
          onRotate={async (target, playerId) => {
            setIsBusy(true);
            try {
              const next = await rotateSharedAccess(access.gameId, access.token, target, playerId);
              setView(next);
              announce(`${target === "spectator" ? "Spectator" : "Player"} link replaced.`);
            } finally {
              setIsBusy(false);
            }
          }}
        />
      ) : null}
      {organizerView ? (
        <NewGameDialog
          isOpen={isNewGameDialogOpen}
          onCancel={() => setIsNewGameDialogOpen(false)}
          onConfirm={() => void organizerMutation(
            () => resetSharedGame(access.gameId, access.token),
            "A new game is ready. Player links are unchanged and jokers are restored.",
          ).finally(() => setIsNewGameDialogOpen(false))}
        />
      ) : null}
      {isInitialLoad ? <InitialLoadOverlay /> : null}
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
        including mana symbols, is copyright Wizards of the Coast, LLC. Card images are provided by
        Scryfall.
      </p>
    </footer>
  );
}

function Brand() {
  return (
    <a className="brand" href={window.location.pathname} aria-label="Commander Roulette — new table">
      <img src={brandLogo} alt="" />
      <span><span className="brand-caption">Magic: The Gathering</span><span className="brand-name">Commander Roulette</span></span>
    </a>
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
