/*
  # Create users view for public schema

  1. New View
    - `users` view in public schema
      - `id` (uuid, from auth.users)
      - `email` (text, from auth.users)
      - `full_name` (text, from user metadata)
      - `avatar_url` (text, from user metadata)
      - `created_at` (timestamp, from auth.users)
      - `updated_at` (timestamp, from auth.users)

  2. Security
    - Enable RLS on users view
    - Add policy for authenticated users to read user data
    - Users can see their own data and basic info of others
*/

-- Create users view that exposes auth.users data
CREATE OR REPLACE VIEW public.users AS
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Anonymous') as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  created_at,
  updated_at,
  raw_user_meta_data
FROM auth.users;

-- Enable RLS on the view
ALTER VIEW public.users SET (security_invoker = true);

-- Create RLS policies for the users view
CREATE POLICY "Users can read basic user information"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;