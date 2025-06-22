-- Create blog followers table
CREATE TABLE IF NOT EXISTS blog_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create direct messages table
CREATE TABLE IF NOT EXISTS blog_direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_followers_follower_id ON blog_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_blog_followers_following_id ON blog_followers(following_id);
CREATE INDEX IF NOT EXISTS idx_blog_direct_messages_sender_id ON blog_direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_blog_direct_messages_recipient_id ON blog_direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_blog_direct_messages_created_at ON blog_direct_messages(created_at);

-- Enable RLS on blog_followers
ALTER TABLE blog_followers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on blog_direct_messages
ALTER TABLE blog_direct_messages ENABLE ROW LEVEL SECURITY;

-- Policies for blog_followers
CREATE POLICY "Users can see their own followers and following" 
  ON blog_followers 
  FOR SELECT 
  TO authenticated 
  USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can follow others" 
  ON blog_followers 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow others" 
  ON blog_followers 
  FOR DELETE 
  TO authenticated 
  USING (follower_id = auth.uid());

-- Policies for blog_direct_messages
CREATE POLICY "Users can see messages they sent or received" 
  ON blog_direct_messages 
  FOR SELECT 
  TO authenticated 
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" 
  ON blog_direct_messages 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they sent" 
  ON blog_direct_messages 
  FOR UPDATE 
  TO authenticated 
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can delete messages they sent" 
  ON blog_direct_messages 
  FOR DELETE 
  TO authenticated 
  USING (sender_id = auth.uid());

-- Add notification types for social interactions
DO $$ 
BEGIN
  -- Check if the constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_notifications_type_check'
  ) THEN
    -- If it doesn't exist, create it
    ALTER TABLE user_notifications 
      ADD CONSTRAINT user_notifications_type_check 
      CHECK (type = ANY (ARRAY['reminder'::text, 'achievement'::text, 'alert'::text, 'info'::text, 'follow'::text, 'like'::text, 'comment'::text, 'message'::text]));
  ELSE
    -- If it exists, alter it
    ALTER TABLE user_notifications 
      DROP CONSTRAINT user_notifications_type_check;
    
    ALTER TABLE user_notifications 
      ADD CONSTRAINT user_notifications_type_check 
      CHECK (type = ANY (ARRAY['reminder'::text, 'achievement'::text, 'alert'::text, 'info'::text, 'follow'::text, 'like'::text, 'comment'::text, 'message'::text]));
  END IF;
END $$;