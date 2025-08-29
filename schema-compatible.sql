-- AI Hackathon Scorer Database Schema - Compatible Version
-- Copy and paste into Neon SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create judges table
CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  secret_id VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create criteria table
CREATE TABLE IF NOT EXISTS criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  weight INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(judge_id, team_id)
);

-- Create app_state table
CREATE TABLE IF NOT EXISTS app_state (
  id INT PRIMARY KEY DEFAULT 1,
  is_setup_locked BOOLEAN NOT NULL DEFAULT FALSE,
  active_team_ids UUID[],
  scoring_system INTEGER NOT NULL DEFAULT 10
);

-- Set default value for active_team_ids if not already set
ALTER TABLE app_state ALTER COLUMN active_team_ids SET DEFAULT ARRAY[]::UUID[];

-- Insert initial data
INSERT INTO app_state (id, is_setup_locked, active_team_ids, scoring_system)
VALUES (1, FALSE, ARRAY[]::UUID[], 10)
ON CONFLICT (id) DO NOTHING;