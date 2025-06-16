/*
  # Add last_clean_day_marked column to user_addictions

  1. Changes
    - Add `last_clean_day_marked` column to track when user last marked a clean day
    - This prevents users from marking multiple clean days in a single day
    - Column stores date in YYYY-MM-DD format

  2. Security
    - No changes to RLS policies needed
    - Column follows existing security model
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_addictions' AND column_name = 'last_clean_day_marked'
  ) THEN
    ALTER TABLE user_addictions ADD COLUMN last_clean_day_marked date;
  END IF;
END $$;