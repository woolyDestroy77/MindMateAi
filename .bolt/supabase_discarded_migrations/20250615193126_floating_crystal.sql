/*
  # Create user mood data table

  1. New Tables
    - `user_mood_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, UNIQUE)
      - `current_mood` (text, emoji representation)
      - `mood_name` (text, mood category name)
      - `mood_interpretation` (text, AI-generated interpretation)
      - `wellness_score` (integer, calculated score)
      - `sentiment` (text, positive/negative/neutral)
      - `last_message` (text, last user message that triggered update)
      - `ai_response` (text, AI response that accompanied the update)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_mood_data` table
    - Add policy for authenticated users to read/write their own data

  3. Indexes
    - Index on user_id for fast lookups
    - Index on updated_at for recent data queries

  4. Constraints
    - Unique constraint on user_id to ensure one record per user
*/

CREATE TABLE IF NOT EXISTS user_mood_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_mood text NOT NULL DEFAULT '😌',
  mood_name text NOT NULL DEFAULT 'calm',
  mood_interpretation text NOT NULL DEFAULT 'Your emotional state is being tracked.',
  wellness_score integer NOT NULL DEFAULT 75,
  sentiment text NOT NULL DEFAULT 'neutral',
  last_message text,
  ai_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_mood_data ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_mood_data_user_id ON user_mood_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mood_data_updated_at ON user_mood_data(updated_at DESC);

-- Create policies
CREATE POLICY "Users can read own mood data"
  ON user_mood_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood data"
  ON user_mood_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood data"
  ON user_mood_data
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood data"
  ON user_mood_data
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function for updating updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_mood_data_updated_at ON user_mood_data;
CREATE TRIGGER update_user_mood_data_updated_at
  BEFORE UPDATE ON user_mood_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default mood data for existing users (if any)
INSERT INTO user_mood_data (user_id, current_mood, mood_name, mood_interpretation, wellness_score, sentiment)
SELECT 
  id,
  '😌',
  'calm',
  'Welcome to MindMate AI! Your mood will be tracked automatically as you chat with our AI.',
  75,
  'neutral'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_mood_data)
ON CONFLICT (user_id) DO NOTHING;