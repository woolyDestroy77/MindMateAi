-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'achievement', 'alert', 'info')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  action_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);

-- Create index on read status for better filtering
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);

-- Create index on type for better filtering
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);

-- Create index on created_at for better sorting
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

-- Create scheduled_notifications table for future notifications
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'achievement', 'alert', 'info')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  action_url TEXT,
  action_text TEXT,
  expires_in_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);

-- Create index on scheduled_time for better querying
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_time ON scheduled_notifications(scheduled_time);

-- Create index on processed status for better filtering
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_processed ON scheduled_notifications(processed);

-- Enable RLS on user_notifications
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for user_notifications
CREATE POLICY "Users can only see their own notifications"
  ON user_notifications
  FOR ALL
  USING (auth.uid() = user_id);

-- Enable RLS on scheduled_notifications
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for scheduled_notifications
CREATE POLICY "Users can only see their own scheduled notifications"
  ON scheduled_notifications
  FOR ALL
  USING (auth.uid() = user_id);