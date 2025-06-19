/*
  # Fix Blog Foreign Key Relationships

  1. Changes
    - Add proper foreign key relationship between blog_posts and auth.users
    - Add proper foreign key relationship between blog_comments and auth.users
    - Add proper foreign key relationship between blog_post_likes and auth.users
    - Create stored procedures for incrementing/decrementing post likes and comments
  
  2. Security
    - No changes to RLS policies
*/

-- Fix foreign key relationships for blog tables
ALTER TABLE IF EXISTS public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_user_id_fkey,
  ADD CONSTRAINT blog_posts_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.blog_comments
  DROP CONSTRAINT IF EXISTS blog_comments_user_id_fkey,
  ADD CONSTRAINT blog_comments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.blog_post_likes
  DROP CONSTRAINT IF EXISTS blog_post_likes_user_id_fkey,
  ADD CONSTRAINT blog_post_likes_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create stored procedures for incrementing/decrementing post likes and comments
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET likes = likes + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET likes = GREATEST(0, likes - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;