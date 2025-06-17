/*
  # Add Addiction Support Features

  1. New Tables
    - `addiction_types`
      - `id` (uuid, primary key)
      - `name` (text, addiction name)
      - `category` (text, substance/behavioral/other)
      - `description` (text)
      - `resources` (jsonb, helpful resources)
      - `created_at` (timestamp)

    - `user_addictions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `addiction_type_id` (uuid, foreign key to addiction_types)
      - `severity_level` (integer, 1-10 scale)
      - `start_date` (date, when addiction started)
      - `quit_attempts` (integer, number of previous attempts)
      - `current_status` (text, active/recovery/relapse/clean)
      - `days_clean` (integer, current streak)
      - `personal_triggers` (text array)
      - `support_contacts` (jsonb, emergency contacts)
      - `is_active` (boolean, currently tracking this addiction)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `addiction_tracking`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `user_addiction_id` (uuid, foreign key to user_addictions)
      - `entry_type` (text, craving/relapse/milestone/support)
      - `intensity_level` (integer, 1-10 for cravings)
      - `trigger_identified` (text)
      - `coping_strategy_used` (text)
      - `notes` (text)
      - `mood_before` (text)
      - `mood_after` (text)
      - `location` (text, optional)
      - `support_used` (boolean, did they reach out for help)
      - `created_at` (timestamp)

    - `addiction_milestones`
      - `id` (uuid, primary key)
      - `user_addiction_id` (uuid, foreign key to user_addictions)
      - `milestone_type` (text, days_clean/weeks_clean/months_clean/year_clean)
      - `milestone_value` (integer, number of days/weeks/months)
      - `achieved_at` (timestamp)
      - `celebration_notes` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for performance optimization
*/

-- Addiction Types Table (predefined addiction categories)
CREATE TABLE IF NOT EXISTS addiction_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('substance', 'behavioral', 'other')),
  description text,
  resources jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- User Addictions Table (user's specific addictions they're tracking)
CREATE TABLE IF NOT EXISTS user_addictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addiction_type_id uuid NOT NULL REFERENCES addiction_types(id),
  severity_level integer CHECK (severity_level >= 1 AND severity_level <= 10),
  start_date date,
  quit_attempts integer DEFAULT 0,
  current_status text NOT NULL DEFAULT 'active' CHECK (current_status IN ('active', 'recovery', 'relapse', 'clean')),
  days_clean integer DEFAULT 0,
  personal_triggers text[] DEFAULT ARRAY[]::text[],
  support_contacts jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Addiction Tracking Table (daily entries, cravings, relapses, etc.)
CREATE TABLE IF NOT EXISTS addiction_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_addiction_id uuid NOT NULL REFERENCES user_addictions(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('craving', 'relapse', 'milestone', 'support', 'trigger', 'success')),
  intensity_level integer CHECK (intensity_level >= 1 AND intensity_level <= 10),
  trigger_identified text,
  coping_strategy_used text,
  notes text,
  mood_before text,
  mood_after text,
  location text,
  support_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Addiction Milestones Table (achievements and celebrations)
CREATE TABLE IF NOT EXISTS addiction_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_addiction_id uuid NOT NULL REFERENCES user_addictions(id) ON DELETE CASCADE,
  milestone_type text NOT NULL CHECK (milestone_type IN ('days_clean', 'weeks_clean', 'months_clean', 'year_clean', 'custom')),
  milestone_value integer NOT NULL,
  achieved_at timestamptz DEFAULT now(),
  celebration_notes text
);

-- Enable RLS
ALTER TABLE addiction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE addiction_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE addiction_milestones ENABLE ROW LEVEL SECURITY;

-- Policies for addiction_types (public read, admin write)
CREATE POLICY "Anyone can read addiction types"
  ON addiction_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_addictions
CREATE POLICY "Users can read own addictions"
  ON user_addictions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addictions"
  ON user_addictions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addictions"
  ON user_addictions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addictions"
  ON user_addictions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for addiction_tracking
CREATE POLICY "Users can read own tracking"
  ON addiction_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracking"
  ON addiction_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracking"
  ON addiction_tracking
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracking"
  ON addiction_tracking
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for addiction_milestones (read through user_addictions relationship)
CREATE POLICY "Users can read own milestones"
  ON addiction_milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_addictions 
      WHERE user_addictions.id = addiction_milestones.user_addiction_id 
      AND user_addictions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own milestones"
  ON addiction_milestones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_addictions 
      WHERE user_addictions.id = addiction_milestones.user_addiction_id 
      AND user_addictions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own milestones"
  ON addiction_milestones
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_addictions 
      WHERE user_addictions.id = addiction_milestones.user_addiction_id 
      AND user_addictions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own milestones"
  ON addiction_milestones
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_addictions 
      WHERE user_addictions.id = addiction_milestones.user_addiction_id 
      AND user_addictions.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_addictions_user_id ON user_addictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addictions_active ON user_addictions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_addiction_tracking_user_id ON addiction_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_addiction_tracking_user_addiction ON addiction_tracking(user_addiction_id);
CREATE INDEX IF NOT EXISTS idx_addiction_tracking_created_at ON addiction_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_addiction_milestones_user_addiction ON addiction_milestones(user_addiction_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_addictions_updated_at
  BEFORE UPDATE ON user_addictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default addiction types
INSERT INTO addiction_types (name, category, description, resources) VALUES
-- Substance Addictions
('Alcohol', 'substance', 'Alcohol dependency and abuse', '{"helplines": ["1-800-662-4357"], "websites": ["aa.org", "samhsa.gov"], "apps": ["Sober Grid", "I Am Sober"]}'),
('Nicotine/Smoking', 'substance', 'Cigarettes, vaping, and tobacco products', '{"helplines": ["1-800-QUIT-NOW"], "websites": ["smokefree.gov", "quitnow.gov.au"], "apps": ["Smoke Free", "QuitNow"]}'),
('Cannabis/Marijuana', 'substance', 'Cannabis dependency and abuse', '{"helplines": ["1-800-662-4357"], "websites": ["marijuana-anonymous.org"], "apps": ["Grounded", "Quit Cannabis"]}'),
('Cocaine', 'substance', 'Cocaine addiction and dependency', '{"helplines": ["1-800-662-4357"], "websites": ["ca.org", "samhsa.gov"], "apps": ["Recovery Dharma", "Sober Grid"]}'),
('Opioids/Heroin', 'substance', 'Opioid and heroin addiction', '{"helplines": ["1-800-662-4357"], "websites": ["na.org", "samhsa.gov"], "apps": ["Recovery Dharma", "Sober Grid"]}'),
('Prescription Drugs', 'substance', 'Prescription medication abuse', '{"helplines": ["1-800-662-4357"], "websites": ["samhsa.gov"], "apps": ["Recovery Dharma", "Sober Grid"]}'),
('Caffeine', 'substance', 'Caffeine dependency', '{"websites": ["caffeineinformer.com"], "apps": ["Quit Caffeine", "Decaf"]}'),

-- Behavioral Addictions
('Gambling', 'behavioral', 'Compulsive gambling and betting', '{"helplines": ["1-800-522-4700"], "websites": ["ncpgambling.org", "gamblersanonymous.org"], "apps": ["Bet Blocker", "Gambling Therapy"]}'),
('Gaming', 'behavioral', 'Video game addiction and excessive gaming', '{"websites": ["olganon.org"], "apps": ["Moment", "Freedom"]}'),
('Social Media', 'behavioral', 'Compulsive social media use', '{"apps": ["Freedom", "Moment", "Digital Wellbeing"], "websites": ["humanetech.com"]}'),
('Shopping', 'behavioral', 'Compulsive buying and shopping addiction', '{"websites": ["debtorsanonymous.org"], "apps": ["Mint", "YNAB"]}'),
('Food/Eating', 'behavioral', 'Food addiction and compulsive eating', '{"helplines": ["1-800-931-2237"], "websites": ["foodaddicts.org", "overeaters.org"], "apps": ["Recovery Record", "Eat Right Now"]}'),
('Sex/Pornography', 'behavioral', 'Sexual addiction and pornography', '{"helplines": ["1-866-424-4775"], "websites": ["saa-recovery.org"], "apps": ["Fortify", "Covenant Eyes"]}'),
('Work', 'behavioral', 'Workaholism and work addiction', '{"websites": ["workaholics-anonymous.org"], "apps": ["RescueTime", "Toggl"]}'),
('Exercise', 'behavioral', 'Compulsive exercise and fitness addiction', '{"websites": ["eatingdisorderhope.com"], "apps": ["MyFitnessPal", "Strava"]}'),

-- Other Addictions
('Technology/Internet', 'other', 'Internet and technology addiction', '{"apps": ["Freedom", "Cold Turkey"], "websites": ["netaddiction.com"]}'),
('Relationships', 'other', 'Love and relationship addiction', '{"websites": ["slaa.org"], "apps": ["Sanvello", "Headspace"]}'),
('Self-Harm', 'other', 'Self-injury and self-harm behaviors', '{"helplines": ["1-800-366-8288"], "websites": ["selfinjury.bctr.cornell.edu"], "apps": ["Calm Harm", "MindShift"]}')

ON CONFLICT (name) DO NOTHING;