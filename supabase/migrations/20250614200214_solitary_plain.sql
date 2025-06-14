/*
  # Add chat sessions functionality

  1. New Tables
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, session name based on creation date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean, marks current active session)

  2. Table Updates
    - Add `session_id` to `dappier_chat_history` table to link messages to sessions

  3. Security
    - Enable RLS on `chat_sessions` table
    - Add policies for authenticated users to manage their own sessions
    - Update existing policies for chat history to include session filtering

  4. Indexes
    - Add index on user_id and is_active for efficient session queries
    - Add index on session_id in chat history for message retrieval
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Add session_id to dappier_chat_history if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dappier_chat_history' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE dappier_chat_history ADD COLUMN session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_active ON chat_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON dappier_chat_history(session_id);

-- Create policies for chat_sessions
CREATE POLICY "Users can read own chat sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_sessions_updated_at();