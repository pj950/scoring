-- Database schema for AI Hackathon Scorer
-- Run this entire file once in your Postgres instance

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  secret_id VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  weight REAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(judge_id, team_id)
);

CREATE TABLE IF NOT EXISTS app_state (
  id INT PRIMARY KEY DEFAULT 1,
  is_setup_locked BOOLEAN NOT NULL DEFAULT FALSE,
  active_team_ids UUID[] NOT NULL DEFAULT ARRAY[]::uuid[],
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO app_state (id, is_setup_locked, active_team_ids)
VALUES (1, FALSE, ARRAY[]::uuid[])
ON CONFLICT (id) DO NOTHING;