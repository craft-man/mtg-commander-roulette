import { afterEach, describe, expect, it, vi } from "vitest";
import { COMMANDER_LOAD_ERROR, fetchCommanders } from "./commanderApi";

const commander = {
  id: "card-fr",
  oracleId: "oracle-1",
  name: "Wilson, Refined Grizzly",
  colors: ["G"],
  colorIdentity: ["G"],
  imageUrl: "https://cards.scryfall.io/fr.jpg",
  edhrecUrl: "https://edhrec.com/commanders/wilson-refined-grizzly",
  scryfallUrl: "https://scryfall.com/card/example/fr",
};

describe("fetchCommanders", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("loads one compact catalog from the Commander Roulette API", async () => {
    const request = vi.fn().mockResolvedValue(
      Response.json({ data: [commander], meta: { generationId: "generation-1", language: "fr" } }),
    );
    vi.stubGlobal("fetch", request);

    await expect(fetchCommanders("fr")).resolves.toEqual([commander]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]?.[0]).toBe("http://localhost:3000/v1/commanders?language=fr");
  });

  it("rejects malformed catalogs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [{ id: "incomplete" }] })));
    await expect(fetchCommanders()).rejects.toThrow(COMMANDER_LOAD_ERROR);
  });

  it("retries temporary API failures", async () => {
    vi.useFakeTimers();
    const request = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(Response.json({ data: [commander], meta: { generationId: "generation-1" } }));
    vi.stubGlobal("fetch", request);

    const result = fetchCommanders();
    await vi.runAllTimersAsync();
    await expect(result).resolves.toEqual([commander]);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
