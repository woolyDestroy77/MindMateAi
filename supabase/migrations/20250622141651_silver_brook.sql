/*
  # Fix Blog Social Foreign Keys

  1. Changes
     - Update foreign key references in blog_direct_messages and blog_followers tables
     - Change references from users to auth.users for proper relationship
     - Add explicit foreign key constraints with ON DELETE CASCADE
  
  2. Security
     - Maintains existing RLS policies
*/

-- Fix blog_direct_messages foreign keys
ALTER TABLE IF EXISTS public.blog_direct_messages 
DROP CONSTRAINT IF EXISTS blog_direct_messages_sender_id_fkey,
DROP CONSTRAINT IF EXISTS blog_direct_messages_recipient_id_fkey;

ALTER TABLE public.blog_direct_messages
ADD CONSTRAINT blog_direct_messages_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.blog_direct_messages
ADD CONSTRAINT blog_direct_messages_recipient_id_fkey
FOREIGN KEY (recipient_id)
REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix blog_followers foreign keys
ALTER TABLE IF EXISTS public.blog_followers
DROP CONSTRAINT IF EXISTS blog_followers_follower_id_fkey,
DROP CONSTRAINT IF EXISTS blog_followers_following_id_fkey;

ALTER TABLE public.blog_followers
ADD CONSTRAINT blog_followers_follower_id_fkey
FOREIGN KEY (follower_id)
REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.blog_followers
ADD CONSTRAINT blog_followers_following_id_fkey
FOREIGN KEY (following_id)
REFERENCES auth.users(id) ON DELETE CASCADE;