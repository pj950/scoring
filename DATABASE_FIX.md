# Database Schema Fix for 500 Errors

## Issue Summary
The application was experiencing 500 errors on two API endpoints:
- `/api/data?entity=activeTeamIds:1`
- `/api/data?entity=finalScores:1`

## Root Causes

### 1. activeTeamIds Endpoint
- **Issue**: The API code was trying to query `active_team_ids` (plural, array) but the database schema had `active_team_id` (singular, UUID)
- **Impact**: SQL query failed causing 500 error

### 2. finalScores Endpoint
- **Issue**: The API code expected a `weight` column in the `criteria` table, but the schema had `max_score` instead
- **Impact**: Calculation failed when trying to access non-existent weight values

## Solution

### Step 1: Run Database Migration
Execute the migration script in `migration.sql` on your Vercel Postgres database:

```sql
-- This will:
-- 1. Add active_team_ids column (array) to app_state table
-- 2. Migrate data from old active_team_id column
-- 3. Add weight column to criteria table
-- 4. Remove max_score column from criteria table
```

### Step 2: For Fresh Installations
If setting up a new database, use the updated `schema.sql` file which includes:
- `active_team_ids UUID[]` in app_state table
- `weight NUMERIC(5,2)` in criteria table

### Step 3: Verify the Fix
After applying the migration:
1. The `/api/data?entity=activeTeamIds` endpoint should return an array (possibly empty)
2. The `/api/data?entity=finalScores` endpoint should return calculated scores with rankings

## Files Updated
- `services/database.ts` - Updated schema definition
- `schema.sql` - Complete updated schema for new installations
- `migration.sql` - Migration script for existing databases

## Note
The API code in `api/data.ts` was already correct and expecting the proper schema. The issue was a mismatch between the code expectations and the actual database schema.