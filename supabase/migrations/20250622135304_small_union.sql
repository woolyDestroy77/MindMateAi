/*
  # Blog Social Features

  1. New Tables
    - `blog_followers` - Tracks user follow relationships
    - `blog_direct_messages` - Stores private messages between users
  
  2. Indexes
    - Added performance indexes for follower/following relationships
    - Added indexes for message sender/recipient and timestamps
  
  3. Security
    - Enabled RLS on all tables
    - Added policies for proper data access control
    - Users can only see/manage their own social connections
  
  4. Notifications
    - Extended notification types to support social interactions
*/

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

-- Policies for blog_followers - with safety checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_followers' AND policyname = 'Users can see their own followers and following'
  ) THEN
    CREATE POLICY "Users can see their own followers and following" 
      ON blog_followers 
      FOR SELECT 
      TO authenticated 
      USING (follower_id = auth.uid() OR following_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_followers' AND policyname = 'Users can follow others'
  ) THEN
    CREATE POLICY "Users can follow others" 
      ON blog_followers 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (follower_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_followers' AND policyname = 'Users can unfollow others'
  ) THEN
    CREATE POLICY "Users can unfollow others" 
      ON blog_followers 
      FOR DELETE 
      TO authenticated 
      USING (follower_id = auth.uid());
  END IF;
END $$;

-- Policies for blog_direct_messages - with safety checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_direct_messages' AND policyname = 'Users can see messages they sent or received'
  ) THEN
    CREATE POLICY "Users can see messages they sent or received" 
      ON blog_direct_messages 
      FOR SELECT 
      TO authenticated 
      USING (sender_id = auth.uid() OR recipient_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_direct_messages' AND policyname = 'Users can send messages'
  ) THEN
    CREATE POLICY "Users can send messages" 
      ON blog_direct_messages 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (sender_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_direct_messages' AND policyname = 'Users can update messages they sent'
  ) THEN
    CREATE POLICY "Users can update messages they sent" 
      ON blog_direct_messages 
      FOR UPDATE 
      TO authenticated 
      USING (sender_id = auth.uid() OR recipient_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'blog_direct_messages' AND policyname = 'Users can delete messages they sent'
  ) THEN
    CREATE POLICY "Users can delete messages they sent" 
      ON blog_direct_messages 
      FOR DELETE 
      TO authenticated 
      USING (sender_id = auth.uid());
  END IF;
END $$;

-- Add notification types for social interactions
DO $$ 
BEGIN
  -- Check if the constraint exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_notifications_type_check'
  ) THEN
    -- If it exists, drop and recreate it
    ALTER TABLE user_notifications 
      DROP CONSTRAINT user_notifications_type_check;
    
    ALTER TABLE user_notifications 
      ADD CONSTRAINT user_notifications_type_check 
      CHECK (type = ANY (ARRAY['reminder'::text, 'achievement'::text, 'alert'::text, 'info'::text, 'follow'::text, 'like'::text, 'comment'::text, 'message'::text]));
  END IF;
END $$;