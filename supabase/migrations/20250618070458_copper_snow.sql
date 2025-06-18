/*
  # Journal Enhancements

  1. New Features
    - Add metadata JSONB column to journal_entries table
    - Create indexes for better performance on metadata, tags, mood, and sentiment
    - Add function and trigger to automatically update the updated_at timestamp

  2. Changes
    - Add metadata column to journal_entries table
    - Create GIN index on metadata for better performance
    - Create GIN index on tags for better filtering
    - Create index on mood for better filtering
    - Create index on sentiment for better filtering
    - Create function to update updated_at timestamp
    - Create trigger to update updated_at timestamp
*/

-- Add metadata column to journal_entries table
ALTER TABLE IF EXISTS journal_entries 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on metadata for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_metadata 
ON journal_entries USING GIN (metadata);

-- Create index on tags for better filtering
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags 
ON journal_entries USING GIN (tags);

-- Create index on mood for better filtering
CREATE INDEX IF NOT EXISTS idx_journal_entries_mood 
ON journal_entries (mood);

-- Create index on sentiment for better filtering
CREATE INDEX IF NOT EXISTS idx_journal_entries_sentiment 
ON journal_entries (sentiment);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_journal_entries_updated_at_trigger ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at_trigger
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_journal_entries_updated_at();