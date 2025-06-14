/*
  # Create Dappier Chat History Table

  1. New Tables
    - `dappier_chat_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `user_message` (text, the user's message)
      - `ai_response` (text, the AI's response)
      - `widget_id` (text, the Dappier widget ID)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `dappier_chat_history` table
    - Add policies for authenticated users to manage their own chat history

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on created_at for chronological ordering
*/

CREATE TABLE IF NOT EXISTS dappier_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_message text NOT NULL,
  ai_response text NOT NULL,
  widget_id text NOT NULL DEFAULT 'wd_01jxpzftx6e3ntsgzwtgbze71c',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE dappier_chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own chat history"
  ON dappier_chat_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history"
  ON dappier_chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat history"
  ON dappier_chat_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history"
  ON dappier_chat_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dappier_chat_history_user_id 
  ON dappier_chat_history(user_id);

CREATE INDEX IF NOT EXISTS idx_dappier_chat_history_created_at 
  ON dappier_chat_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dappier_chat_history_widget_id 
  ON dappier_chat_history(widget_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_dappier_chat_history_updated_at'
  ) THEN
    CREATE TRIGGER update_dappier_chat_history_updated_at
      BEFORE UPDATE ON dappier_chat_history
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;