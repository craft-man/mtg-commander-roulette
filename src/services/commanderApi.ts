import type { Commander } from "../models/Commander";

export const CARD_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "French" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
] as const;

export type CardLanguage = (typeof CARD_LANGUAGES)[number]["code"];

interface CommanderApiResponse {
  data: Commander[];
  meta: {
    generationId: string;
    language: CardLanguage;
  };
}

export const COMMANDER_LOAD_ERROR = "Unable to retrieve commanders from Commander Roulette.";

function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_COMMANDER_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return import.meta.env.DEV ? "http://localhost:3000" : "";
}

function isCommander(value: unknown): value is Commander {
  if (!value || typeof value !== "object") return false;
  const commander = value as Partial<Commander>;
  const pairing = commander.pairing;
  const validPairing =
    pairing === undefined ||
    (typeof pairing.url === "string" &&
      typeof pairing.label === "string" &&
      (pairing.kind === undefined || typeof pairing.kind === "string") &&
      (pairing.partnerWith === undefined ||
        (typeof pairing.partnerWith.name === "string" &&
          (pairing.partnerWith.oracleId === undefined || typeof pairing.partnerWith.oracleId === "string"))));
  return (
    typeof commander.id === "string" &&
    typeof commander.oracleId === "string" &&
    typeof commander.name === "string" &&
    Array.isArray(commander.colors) &&
    Array.isArray(commander.colorIdentity) &&
    typeof commander.imageUrl === "string" &&
    typeof commander.edhrecUrl === "string" &&
    typeof commander.scryfallUrl === "string" &&
    validPairing
  );
}

async function fetchCatalog(url: string, signal?: AbortSignal): Promise<Response> {
  for (let attempt = 0; ; attempt += 1) {
    signal?.throwIfAborted();
    try {
      const response = await fetch(url, {
        signal,
        headers: { Accept: "application/json" },
      });
      if (response.ok || attempt === 2 || ![502, 503, 504].includes(response.status)) return response;
    } catch (cause) {
      if (signal?.aborted || (cause instanceof Error && cause.name === "AbortError")) throw cause;
      if (attempt === 2) throw new Error(COMMANDER_LOAD_ERROR, { cause });
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
}

export async function fetchCommanders(
  language: CardLanguage = "en",
  signal?: AbortSignal,
): Promise<Commander[]> {
  const response = await fetchCatalog(
    `${apiBaseUrl()}/v1/commanders?language=${encodeURIComponent(language)}`,
    signal,
  );
  if (!response.ok) throw new Error(COMMANDER_LOAD_ERROR);

  const payload = (await response.json()) as CommanderApiResponse;
  if (!payload || !Array.isArray(payload.data) || payload.data.length === 0 || !payload.data.every(isCommander)) {
    throw new Error(COMMANDER_LOAD_ERROR);
  }
  return payload.data;
}
