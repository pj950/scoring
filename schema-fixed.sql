-- AI Hackathon Scorer Database Schema
-- Copy and paste the entire content into the Neon SQL Editor and run it once.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for Judges  
CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  secret_id VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for Scoring Criteria
CREATE TABLE IF NOT EXISTS criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  weight INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for Ratings
-- Each judge can only rate each team once.
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(judge_id, team_id)
);

-- Table for general application state (like setup lock and active teams)
-- This table will only ever have one row.
CREATE TABLE IF NOT EXISTS app_state (
  id INT PRIMARY KEY DEFAULT 1,
  is_setup_locked BOOLEAN NOT NULL DEFAULT FALSE,
  active_team_ids UUID[] DEFAULT ARRAY[]::UUID[],
  scoring_system INTEGER NOT NULL DEFAULT 10,
  CONSTRAINT single_row CHECK (id = 1),
  CONSTRAINT valid_scoring_system CHECK (scoring_system IN (10, 100))
);

-- Insert the initial single row for app_state
INSERT INTO app_state (id, is_setup_locked, active_team_ids, scoring_system)
VALUES (1, FALSE, ARRAY[]::UUID[], 10)
ON CONFLICT (id) DO NOTHING;

-- Verify tables were created successfully
SELECT 'Schema creation completed successfully' as status;