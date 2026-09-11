const colorNames: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
};

interface ManaSymbolsProps {
  colors: string[];
}

export function ManaSymbols({ colors }: ManaSymbolsProps) {
  const symbols = colors.length > 0 ? colors : ["C"];
  const description = symbols.map((symbol) => colorNames[symbol] ?? symbol).join(", ");

  return (
    <span className="mana-symbols" aria-label={`Color identity: ${description}`}>
      {symbols.map((symbol) => (
        <img
          key={symbol}
          src={`https://svgs.scryfall.io/card-symbols/${symbol}.svg`}
          alt=""
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
