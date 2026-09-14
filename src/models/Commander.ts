export type CommanderPairingLabel =
  | "Partners"
  | "Backgrounds"
  | "Commanders"
  | "Doctors"
  | "Companions";

export type CommanderPairingKind =
  | "partner"
  | "partner-with"
  | "friends-forever"
  | "choose-a-background"
  | "background"
  | "doctors-companion"
  | "time-lord-doctor";

export interface CommanderPairing {
  url: string;
  label: CommanderPairingLabel;
  kind?: CommanderPairingKind;
  partnerWith?: {
    name: string;
    oracleId?: string;
  };
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
