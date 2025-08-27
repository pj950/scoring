-- Migration to update app_state table to support multiple active teams

-- Step 1: Add the new column for multiple active teams
ALTER TABLE app_state 
ADD COLUMN IF NOT EXISTS active_team_ids UUID[] DEFAULT '{}';

-- Step 2: Migrate existing data from active_team_id to active_team_ids
UPDATE app_state 
SET active_team_ids = CASE 
    WHEN active_team_id IS NOT NULL THEN ARRAY[active_team_id]
    ELSE '{}'
END
WHERE id = 1;

-- Step 3: Drop the old column (optional - only do this after confirming the migration worked)
-- ALTER TABLE app_state DROP COLUMN active_team_id;

-- Step 4: Update criteria table to include weight column if it doesn't exist
ALTER TABLE criteria 
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2) DEFAULT 1.0;

-- Remove max_score column if it exists (since the code expects weight instead)
ALTER TABLE criteria 
DROP COLUMN IF EXISTS max_score;