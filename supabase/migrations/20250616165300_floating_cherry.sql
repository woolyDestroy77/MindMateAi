DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_addictions' AND column_name = 'last_clean_day_marked'
  ) THEN
    ALTER TABLE user_addictions ADD COLUMN last_clean_day_marked date;
  END IF;
END $$;