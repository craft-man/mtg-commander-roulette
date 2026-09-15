CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL,
  cards_per_player integer NOT NULL CHECK (cards_per_player > 0),
  jokers_per_player integer NOT NULL CHECK (jokers_per_player >= 0),
  revision integer NOT NULL DEFAULT 1,
  organizer_access_version integer NOT NULL DEFAULT 1,
  spectator_access_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

CREATE TABLE IF NOT EXISTS game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  position integer NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  jokers_remaining integer NOT NULL CHECK (jokers_remaining >= 0),
  revision integer NOT NULL DEFAULT 1,
  access_version integer NOT NULL DEFAULT 1,
  UNIQUE (game_id, position),
  UNIQUE (game_id, id)
);

CREATE TABLE IF NOT EXISTS player_commanders (
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  slot integer NOT NULL,
  oracle_id text NOT NULL,
  locked boolean NOT NULL DEFAULT false,
  PRIMARY KEY (game_id, player_id, slot),
  UNIQUE (game_id, oracle_id),
  FOREIGN KEY (game_id, player_id) REFERENCES game_players(game_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS game_players_game_id_idx ON game_players(game_id);
CREATE INDEX IF NOT EXISTS player_commanders_game_id_idx ON player_commanders(game_id);
CREATE INDEX IF NOT EXISTS games_expires_at_idx ON games(expires_at);
