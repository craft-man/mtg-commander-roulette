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

interface ScryfallImageUris {
  normal?: string;
  large?: string;
  small?: string;
}

interface ScryfallCard {
  id: string;
  oracle_id?: string;
  name: string;
  colors?: string[];
  color_identity?: string[];
  image_uris?: ScryfallImageUris;
  card_faces?: Array<{ name: string; image_uris?: ScryfallImageUris }>;
  related_uris?: { edhrec?: string };
  scryfall_uri: string;
}

interface ScryfallPage {
  data: ScryfallCard[];
  has_more: boolean;
  next_page?: string;
}

export async function fetchCommanders(
  language: CardLanguage = "en",
  signal?: AbortSignal,
): Promise<Commander[]> {
  const commanders: Commander[] = [];
  let pageUrl: string | undefined = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(
    `is:commander lang:${language}`,
  )}`;
  const visitedPages = new Set<string>();

  while (pageUrl) {
    if (visitedPages.has(pageUrl)) {
      throw new Error("Unable to retrieve commanders from Scryfall.");
    }
    visitedPages.add(pageUrl);

    const response = await fetchPage(pageUrl, signal);
    if (!response.ok) {
      throw new Error("Unable to retrieve commanders from Scryfall.");
    }

    const page = (await response.json()) as ScryfallPage;
    commanders.push(
      ...page.data
        .map(mapScryfallCard)
        .filter((commander): commander is Commander => commander !== null),
    );

    pageUrl = page.has_more ? page.next_page : undefined;
    if (page.has_more && !pageUrl) {
      throw new Error("Unable to retrieve commanders from Scryfall.");
    }
  }

  if (commanders.length === 0) {
    throw new Error("Unable to retrieve commanders from Scryfall.");
  }

  return commanders;
}


// Retry the current page only, so a brief connection failure does not discard progress.
async function fetchPage(url: string, signal?: AbortSignal): Promise<Response> {
  for (let attempt = 0; ; attempt += 1) {
    signal?.throwIfAborted();
    try {
      return await fetch(url, { signal });
    } catch (cause) {
      if (signal?.aborted || (cause instanceof Error && cause.name === "AbortError")) throw cause;
      if (attempt === 2) {
        throw new Error("Could not connect to Scryfall. Check your connection and try again. Your current draw has been kept.");
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

export function mapScryfallCard(card: ScryfallCard): Commander | null {
  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  const imageUrl = imageUris?.normal ?? imageUris?.large ?? imageUris?.small;
  const backImageUris = card.card_faces?.[1]?.image_uris;
  const backImageUrl =
    backImageUris?.normal ?? backImageUris?.large ?? backImageUris?.small;

  if (!imageUrl) {
    return null;
  }

  return {
    id: card.id,
    oracleId: card.oracle_id ?? card.id,
    name: card.name,
    colors: card.colors ?? [],
    colorIdentity: card.color_identity ?? [],
    imageUrl,
    ...(backImageUrl ? { backImageUrl } : {}),
    edhrecUrl: card.related_uris?.edhrec ?? `https://edhrec.com/commanders/${toSlug(card.name)}`,
    scryfallUrl: card.scryfall_uri,
  };
}

function toSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\/\/.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
