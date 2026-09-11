import { useCallback, useRef, useState } from "react";
import type { Commander } from "../models/Commander";
import { fetchCommanders, type CardLanguage } from "../services/scryfall";

const CACHE_KEY = "commander-roulette:commanders:v4";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface CommanderCache {
  commanders: Commander[];
  fetchedAt: number;
}

function cacheKey(language: CardLanguage): string {
  return `${CACHE_KEY}:${language}`;
}

function readCache(language: CardLanguage): CommanderCache | null {
  try {
    const stored = localStorage.getItem(cacheKey(language));
    if (!stored) {
      return null;
    }

    const cache = JSON.parse(stored) as CommanderCache;
    const isValid =
      Array.isArray(cache.commanders) &&
      cache.commanders.length > 0 &&
      typeof cache.fetchedAt === "number" &&
      Date.now() - cache.fetchedAt < CACHE_DURATION_MS;

    return isValid ? cache : null;
  } catch {
    return null;
  }
}

function saveCache(language: CardLanguage, commanders: Commander[]): void {
  try {
    localStorage.setItem(
      cacheKey(language),
      JSON.stringify({ commanders, fetchedAt: Date.now() } satisfies CommanderCache),
    );
  } catch {
    // Drawing still works if storage is unavailable or full.
  }
}

export function useCommanders() {
  const cacheRef = useRef(new Map<CardLanguage, CommanderCache>());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCommanders = useCallback(async (language: CardLanguage = "en"): Promise<Commander[]> => {
    const memoryCache = cacheRef.current.get(language);
    if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_DURATION_MS) {
      return memoryCache.commanders;
    }

    const cached = readCache(language);
    if (cached) {
      cacheRef.current.set(language, cached);
      return cached.commanders;
    }

    setIsLoading(true);
    setError(null);
    try {
      const commanders = await fetchCommanders(language);
      cacheRef.current.set(language, { commanders, fetchedAt: Date.now() });
      saveCache(language, commanders);
      return commanders;
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Unable to retrieve commanders from Scryfall.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { getCommanders, isLoading, error, clearError };
}
