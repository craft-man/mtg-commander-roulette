import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCommanders, mapScryfallCard } from "./scryfall";

describe("mapScryfallCard", () => {
  it("uses the first face artwork when the root image is absent", () => {
    const commander = mapScryfallCard({
      id: "double-faced",
      name: "A Double-Faced Commander",
      color_identity: ["G", "U"],
      scryfall_uri: "https://scryfall.com/card/example",
      card_faces: [
        { name: "Front face", image_uris: { normal: "https://example.com/face.jpg" } },
        { name: "Back face", image_uris: { normal: "https://example.com/back.jpg" } },
      ],
    });

    expect(commander).toMatchObject({
      id: "double-faced",
      imageUrl: "https://example.com/face.jpg",
      backImageUrl: "https://example.com/back.jpg",
      colorIdentity: ["G", "U"],
      edhrecUrl: "https://edhrec.com/commanders/a-double-faced-commander",
    });
  });

  it("skips cards that have no usable image", () => {
    expect(
      mapScryfallCard({
        id: "no-image",
        name: "No Image",
        scryfall_uri: "https://scryfall.com/card/no-image",
      }),
    ).toBeNull();
  });
});


describe("fetchCommanders network failures", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  const page = (id: string, next?: string) => ({
    ok: true,
    json: async () => ({
      data: [{ id, name: id, image_uris: { normal: "https://example.com/card.jpg" }, scryfall_uri: "https://scryfall.com/card/example" }],
      has_more: Boolean(next), next_page: next,
    }),
  });

  it("retries a failed page without losing earlier cards", async () => {
    vi.useFakeTimers();
    const request = vi.fn().mockResolvedValueOnce(page("first", "https://api.scryfall.com/page2"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(page("second"));
    vi.stubGlobal("fetch", request);
    const result = fetchCommanders();
    await vi.runAllTimersAsync();
    expect((await result).map(card => card.id)).toEqual(["first", "second"]);
    expect(request.mock.calls.map(call => call[0]).slice(1)).toEqual([
      "https://api.scryfall.com/page2", "https://api.scryfall.com/page2",
    ]);
  });

  it("stops after three attempts with an actionable error", async () => {
    vi.useFakeTimers();
    const request = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", request);
    const check = expect(fetchCommanders()).rejects.toThrow("Could not connect to Scryfall.");
    await vi.runAllTimersAsync();
    await check;
    expect(request).toHaveBeenCalledTimes(3);
  });

  it("does not retry a cancelled request", async () => {
    const request = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    vi.stubGlobal("fetch", request);
    await expect(fetchCommanders()).rejects.toMatchObject({name: "AbortError"});
    expect(request).toHaveBeenCalledTimes(1);
  });
});
