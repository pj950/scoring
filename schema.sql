-- AI Hackathon Scorer Database Schema

-- Teams table to store participating teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Judges table to store judge information
CREATE TABLE IF NOT EXISTS judges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    secret_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criteria table to store scoring criteria and their weights
CREATE TABLE IF NOT EXISTS criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table to store judge scores for teams
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    scores JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, judge_id)
);

-- App state table to store application-wide state
CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    active_team_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default app state if it doesn't exist
INSERT INTO app_state (id, active_team_ids) 
VALUES (1, '{}') 
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_team_id ON ratings(team_id);
CREATE INDEX IF NOT EXISTS idx_ratings_judge_id ON ratings(judge_id);
CREATE INDEX IF NOT EXISTS idx_ratings_team_judge ON ratings(team_id, judge_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at);
CREATE INDEX IF NOT EXISTS idx_judges_created_at ON judges(created_at);
CREATE INDEX IF NOT EXISTS idx_criteria_created_at ON criteria(created_at);