/*
  # Journal Enhancements

  1. New Columns
    - Add metadata JSONB column to journal_entries table for storing additional information
    
  2. Changes
    - Update existing journal_entries table to support enhanced journaling features
    
  3. Security
    - Maintain existing RLS policies
*/

-- Add metadata column to journal_entries table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'journal_entries' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE journal_entries ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index on metadata for better performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_journal_entries_metadata'
  ) THEN
    CREATE INDEX idx_journal_entries_metadata ON journal_entries USING GIN (metadata);
  END IF;
END $$;

-- Create index on tags for better filtering
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_journal_entries_tags'
  ) THEN
    CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN (tags);
  END IF;
END $$;

-- Create index on mood for better filtering
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_journal_entries_mood'
  ) THEN
    CREATE INDEX idx_journal_entries_mood ON journal_entries (mood);
  END IF;
END $$;

-- Create index on sentiment for better filtering
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_journal_entries_sentiment'
  ) THEN
    CREATE INDEX idx_journal_entries_sentiment ON journal_entries (sentiment);
  END IF;
END $$;

-- Create function to update updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_journal_entries_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Create trigger to update updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_journal_entries_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_journal_entries_updated_at_trigger
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_journal_entries_updated_at();
  END IF;
END $$;