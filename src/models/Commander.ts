export type CommanderPairingLabel =
  | "Partners"
  | "Backgrounds"
  | "Commanders"
  | "Doctors"
  | "Companions";

export interface CommanderPairing {
  url: string;
  label: CommanderPairingLabel;
}

export interface Commander {
  id: string;
  oracleId: string;
  name: string;
  colors: string[];
  colorIdentity: string[];
  imageUrl: string;
  backImageUrl?: string;
  edhrecUrl: string;
  scryfallUrl: string;
  pairing?: CommanderPairing;
}
