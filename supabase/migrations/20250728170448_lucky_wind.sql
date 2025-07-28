/*
  # Fix admin_users RLS policy infinite recursion

  1. Problem
    - The existing RLS policy creates infinite recursion by querying the same table it's protecting
    - Policy tries to check if user is super_admin by looking in admin_users table

  2. Solution
    - Drop the problematic policy that causes recursion
    - Create simpler policies that don't reference the same table
    - Allow users to manage their own admin data
    - Remove the recursive super_admin check
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admin users can manage own data" ON admin_users;
DROP POLICY IF EXISTS "Super admins can view all admin data" ON admin_users;

-- Create new non-recursive policies
CREATE POLICY "Users can manage own admin data"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow reading admin data for authenticated users (needed for admin checks)
CREATE POLICY "Authenticated users can read admin data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);