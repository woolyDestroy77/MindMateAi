/*
  # Anxiety Support Schema

  1. New Tables
    - `anxiety_sessions` - Tracks breathing exercises, meditation sessions, etc.
    - `anxiety_journal_entries` - Anxiety-specific journal entries
    - `cbt_worksheets` - Cognitive behavioral therapy worksheets
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create anxiety_sessions table
CREATE TABLE IF NOT EXISTS anxiety_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('breathing', 'meditation', 'journal', 'cbt', 'panic_relief')),
  technique_used text NOT NULL,
  duration_minutes integer NOT NULL,
  anxiety_before integer NOT NULL CHECK (anxiety_before BETWEEN 1 AND 10),
  anxiety_after integer CHECK (anxiety_after BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create anxiety_journal_entries table
CREATE TABLE IF NOT EXISTS anxiety_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anxiety_level integer NOT NULL CHECK (anxiety_level BETWEEN 1 AND 10),
  triggers text[] DEFAULT ARRAY[]::text[],
  physical_symptoms text[] DEFAULT ARRAY[]::text[],
  thoughts text,
  coping_strategies text[] DEFAULT ARRAY[]::text[],
  mood_after integer CHECK (mood_after BETWEEN 1 AND 10),
  created_at timestamptz DEFAULT now()
);

-- Create cbt_worksheets table
CREATE TABLE IF NOT EXISTS cbt_worksheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worksheet_type text NOT NULL CHECK (worksheet_type IN ('thought_record', 'exposure_hierarchy', 'worry_time', 'grounding')),
  situation text NOT NULL,
  automatic_thoughts text,
  emotions text[] DEFAULT ARRAY[]::text[],
  evidence_for text,
  evidence_against text,
  balanced_thought text,
  new_emotion_rating integer CHECK (new_emotion_rating BETWEEN 1 AND 10),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE anxiety_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anxiety_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_worksheets ENABLE ROW LEVEL SECURITY;

-- Create policies for anxiety_sessions
CREATE POLICY "Users can select their own anxiety sessions"
  ON anxiety_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anxiety sessions"
  ON anxiety_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anxiety sessions"
  ON anxiety_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anxiety sessions"
  ON anxiety_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for anxiety_journal_entries
CREATE POLICY "Users can select their own anxiety journal entries"
  ON anxiety_journal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anxiety journal entries"
  ON anxiety_journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anxiety journal entries"
  ON anxiety_journal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anxiety journal entries"
  ON anxiety_journal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for cbt_worksheets
CREATE POLICY "Users can select their own CBT worksheets"
  ON cbt_worksheets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CBT worksheets"
  ON cbt_worksheets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CBT worksheets"
  ON cbt_worksheets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CBT worksheets"
  ON cbt_worksheets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_anxiety_sessions_user_id ON anxiety_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_anxiety_sessions_created_at ON anxiety_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anxiety_journal_entries_user_id ON anxiety_journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_anxiety_journal_entries_created_at ON anxiety_journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cbt_worksheets_user_id ON cbt_worksheets(user_id);
CREATE INDEX IF NOT EXISTS idx_cbt_worksheets_created_at ON cbt_worksheets(created_at DESC);