/*
  # Fix user_notifications RLS policy for cross-user notifications

  1. Policy Changes
    - Update INSERT policy to allow authenticated users to create notifications for any user
    - This is needed for features like:
      - Therapists sending notifications to clients
      - Admin sending notifications to therapists
      - System notifications for bookings, messages, etc.

  2. Security
    - Still requires authentication
    - Maintains existing SELECT/UPDATE/DELETE policies for user's own notifications
    - Only allows INSERT for cross-user notifications (which is needed for the app functionality)
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can only see their own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Enable insert for own profile" ON user_notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON user_notifications;

-- Create new policies that allow cross-user notifications
CREATE POLICY "Users can read their own notifications"
  ON user_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON user_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON user_notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to create notifications for any user
-- This is needed for therapist-client messaging, admin notifications, etc.
CREATE POLICY "Authenticated users can create notifications"
  ON user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);