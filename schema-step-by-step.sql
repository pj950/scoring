-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create judges table
CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  secret_id VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 4: Create criteria table
CREATE TABLE IF NOT EXISTS criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  weight INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 5: Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(judge_id, team_id)
);

-- Step 6: Create app_state table
CREATE TABLE IF NOT EXISTS app_state (
  id INT PRIMARY KEY DEFAULT 1,
  is_setup_locked BOOLEAN NOT NULL DEFAULT FALSE,
  active_team_ids UUID[] DEFAULT ARRAY[]::UUID[],
  scoring_system INTEGER NOT NULL DEFAULT 10
);

-- Step 7: Add constraints to app_state
ALTER TABLE app_state ADD CONSTRAINT IF NOT EXISTS single_row CHECK (id = 1);
ALTER TABLE app_state ADD CONSTRAINT IF NOT EXISTS valid_scoring_system CHECK (scoring_system IN (10, 100));

-- Step 8: Insert initial data
INSERT INTO app_state (id, is_setup_locked, active_team_ids, scoring_system)
VALUES (1, FALSE, ARRAY[]::UUID[], 10)
ON CONFLICT (id) DO NOTHING;