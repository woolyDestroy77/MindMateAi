/*
  # Create users view for auth data access

  1. New Views
    - `users` - Exposes necessary user data from auth.users
  2. Security
    - Grants appropriate SELECT permissions
*/

-- Create users view that exposes auth.users data
CREATE OR REPLACE VIEW public.users AS
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Anonymous') as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  created_at,
  last_sign_in_at as updated_at,
  raw_user_meta_data
FROM auth.users;

-- Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;