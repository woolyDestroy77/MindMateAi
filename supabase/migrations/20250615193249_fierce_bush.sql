/*
  # Add unique constraint to user_mood_data table

  1. Changes
    - Add UNIQUE constraint to user_id column in user_mood_data table
    - This enables upsert operations with ON CONFLICT (user_id)

  2. Notes
    - Table and policies already exist from previous migration
    - Only adding the missing unique constraint
*/

-- Add unique constraint to user_id column if it doesn't already exist
DO $$
BEGIN
  -- Check if the unique constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_mood_data_user_id_key' 
    AND conrelid = 'user_mood_data'::regclass
  ) THEN
    -- Add the unique constraint
    ALTER TABLE user_mood_data ADD CONSTRAINT user_mood_data_user_id_key UNIQUE (user_id);
  END IF;
END $$;