import { describe, expect, it } from "vitest";
import { mapScryfallCard } from "./scryfall";

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
