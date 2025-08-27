-- Migration script for test branch to fix database schema issues
-- Run this in your Vercel Postgres Query editor

-- Fix the criteria table: rename max_score to weight if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'criteria' AND column_name = 'max_score') THEN
        ALTER TABLE criteria RENAME COLUMN max_score TO weight;
        RAISE NOTICE 'Renamed criteria.max_score to criteria.weight';
    ELSE
        RAISE NOTICE 'Column criteria.max_score does not exist, skipping rename';
    END IF;
END$$;

-- Fix the app_state table: replace active_team_id with active_team_ids array
DO $$
BEGIN
    -- Check if old column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_state' AND column_name = 'active_team_id') THEN
        -- Add new column
        ALTER TABLE app_state ADD COLUMN active_team_ids UUID[] DEFAULT ARRAY[]::UUID[];
        RAISE NOTICE 'Added active_team_ids column';
        
        -- Migrate data if there was an active team
        UPDATE app_state SET active_team_ids = ARRAY[active_team_id] WHERE active_team_id IS NOT NULL;
        RAISE NOTICE 'Migrated existing active_team_id data';
        
        -- Drop old column
        ALTER TABLE app_state DROP COLUMN active_team_id;
        RAISE NOTICE 'Dropped old active_team_id column';
    ELSE
        -- Ensure the column exists even if the table was created differently
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_state' AND column_name = 'active_team_ids') THEN
            ALTER TABLE app_state ADD COLUMN active_team_ids UUID[] DEFAULT ARRAY[]::UUID[];
            RAISE NOTICE 'Added active_team_ids column (no migration needed)';
        ELSE
            RAISE NOTICE 'Column active_team_ids already exists';
        END IF;
    END IF;
END$$;