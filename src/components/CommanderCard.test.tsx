import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Commander } from "../models/Commander";
import { CommanderCard } from "./CommanderCard";

const commander: Commander = {
  id: "donatello",
  oracleId: "donatello-oracle",
  name: "Donatello, the Brains",
  colors: ["U"],
  colorIdentity: ["U"],
  imageUrl: "https://example.com/donatello.jpg",
  edhrecUrl: "https://edhrec.com/commanders/donatello-the-brains",
  scryfallUrl: "https://scryfall.com/card/donatello",
};

describe("CommanderCard pairing link", () => {
  it("renders the contextual EDHREC pairing link when available", () => {
    const markup = renderToStaticMarkup(
      <CommanderCard
        commander={{
          ...commander,
          pairing: {
            url: "https://edhrec.com/partners/donatello-the-brains",
            label: "Partners",
            kind: "partner",
          },
        }}
      />,
    );

    expect(markup).toContain('href="https://edhrec.com/partners/donatello-the-brains"');
    expect(markup).toContain(
      'aria-label="Open compatible Partners for Donatello, the Brains on EDHREC"',
    );
    expect(markup).toContain("Partners</a>");
    expect(markup).toContain("has-pairing");
  });

  it("keeps the resource row to EDHREC only when no pairing is available", () => {
    const markup = renderToStaticMarkup(<CommanderCard commander={commander} />);

    expect(markup).toContain('href="https://edhrec.com/commanders/donatello-the-brains"');
    expect(markup).not.toContain("/partners/");
    expect(markup).not.toContain("has-pairing");
  });
});
