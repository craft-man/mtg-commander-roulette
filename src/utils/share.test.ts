import { describe, expect, it } from "vitest";
import type { Commander } from "../models/Commander";
import type { PlayerDraw } from "../models/PlayerDraw";
import { createShareUrl, hydrateSharedDraw, readSharedDraw } from "./share";

const commander: Commander = {
  id: "commander-id",
  oracleId: "oracle-id",
  name: "Shared Commander",
  colors: ["U"],
  colorIdentity: ["U"],
  imageUrl: "https://example.com/card.jpg",
  edhrecUrl: "https://edhrec.com/commanders/shared-commander",
  scryfallUrl: "https://scryfall.com/card/example",
};

const draws: PlayerDraw[] = [
  { player: { id: "alice", name: "Alice" }, commanders: [commander] },
];

describe("shared draws", () => {
  it("serializes a compact read-only hash and rebuilds it from a commander pool", () => {
    const location = new URL("https://roulette.example/app?theme=dark");
    const url = createShareUrl(draws, "en", location as unknown as Location);
    const payload = readSharedDraw(new URL(url).hash);

    expect(payload).not.toBeNull();
    expect(payload?.language).toBe("en");
    expect(hydrateSharedDraw(payload!, [commander])).toEqual([
      { player: { id: "shared-0", name: "Alice" }, commanders: [commander] },
    ]);
  });

  it("ignores malformed share hashes", () => {
    expect(readSharedDraw("#share=not-a-valid-payload")).toBeNull();
  });
});
