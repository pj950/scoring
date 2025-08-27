-- Migration script to fix database schema issues
-- Run this if your database was created with the old schema

-- Fix the criteria table: rename max_score to weight if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'criteria' AND column_name = 'max_score') THEN
        ALTER TABLE criteria RENAME COLUMN max_score TO weight;
    END IF;
END$$;

-- Fix the app_state table: replace active_team_id with active_team_ids array
DO $$
BEGIN
    -- Check if old column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_state' AND column_name = 'active_team_id') THEN
        -- Add new column
        ALTER TABLE app_state ADD COLUMN active_team_ids UUID[] DEFAULT ARRAY[]::UUID[];
        
        -- Migrate data if there was an active team
        UPDATE app_state SET active_team_ids = ARRAY[active_team_id] WHERE active_team_id IS NOT NULL;
        
        -- Drop old column
        ALTER TABLE app_state DROP COLUMN active_team_id;
    END IF;
    
    -- Ensure the column exists even if the table was created differently
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_state' AND column_name = 'active_team_ids') THEN
        ALTER TABLE app_state ADD COLUMN active_team_ids UUID[] DEFAULT ARRAY[]::UUID[];
    END IF;
END$$;