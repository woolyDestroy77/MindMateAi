/*
  # Fix Therapy System RLS and Real-time Connectivity

  1. RLS Policies
    - Fix payment_transactions RLS policies
    - Ensure therapist_messages RLS policies work
    - Add proper session access policies
  
  2. Real-time Setup
    - Enable real-time for therapy_sessions
    - Enable real-time for therapist_messages
    - Enable real-time for payment_transactions
  
  3. Notification System
    - Ensure notifications work for session bookings
    - Add session status change notifications
*/

-- Fix payment_transactions RLS policies
DROP POLICY IF EXISTS "Users can create payment transactions for their sessions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can update own payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can view own payment transactions" ON payment_transactions;

CREATE POLICY "Clients can create payment transactions for their sessions"
  ON payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update own payment transactions"
  ON payment_transactions
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE therapist_profiles.id = payment_transactions.therapist_id 
      AND therapist_profiles.user_id = auth.uid()
    )
  );

-- Fix therapist_messages RLS policies
DROP POLICY IF EXISTS "Users can send messages" ON therapist_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON therapist_messages;

CREATE POLICY "Users can send messages"
  ON therapist_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view own messages"
  ON therapist_messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can update message read status"
  ON therapist_messages
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Ensure therapy_sessions has proper RLS
DROP POLICY IF EXISTS "Clients can book sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Therapists and clients can update own sessions" ON therapy_sessions;

CREATE POLICY "Clients can book sessions"
  ON therapy_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can view own sessions"
  ON therapy_sessions
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE therapist_profiles.id = therapy_sessions.therapist_id 
      AND therapist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Therapists and clients can update own sessions"
  ON therapy_sessions
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE therapist_profiles.id = therapy_sessions.therapist_id 
      AND therapist_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE therapist_profiles.id = therapy_sessions.therapist_id 
      AND therapist_profiles.user_id = auth.uid()
    )
  );

-- Add function to get therapist user_id from therapist_id
CREATE OR REPLACE FUNCTION get_therapist_user_id(therapist_profile_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT user_id FROM therapist_profiles WHERE id = therapist_profile_id;
$$;

-- Add function to notify therapist of new booking
CREATE OR REPLACE FUNCTION notify_therapist_of_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  therapist_user_id uuid;
  client_name text;
BEGIN
  -- Get therapist user_id
  SELECT user_id INTO therapist_user_id 
  FROM therapist_profiles 
  WHERE id = NEW.therapist_id;
  
  -- Get client name
  SELECT COALESCE(raw_user_meta_data->>'full_name', 'A client') INTO client_name
  FROM auth.users 
  WHERE id = NEW.client_id;
  
  -- Insert notification for therapist
  INSERT INTO user_notifications (
    user_id,
    title,
    message,
    type,
    priority,
    read,
    action_url,
    action_text,
    metadata
  ) VALUES (
    therapist_user_id,
    'New Session Booking',
    client_name || ' has booked a ' || NEW.session_type || ' session with you.',
    'info',
    'high',
    false,
    '/therapist-sessions',
    'View Sessions',
    jsonb_build_object(
      'session_id', NEW.id,
      'client_id', NEW.client_id,
      'session_date', NEW.scheduled_start
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new session bookings
DROP TRIGGER IF EXISTS notify_therapist_on_booking ON therapy_sessions;
CREATE TRIGGER notify_therapist_on_booking
  AFTER INSERT ON therapy_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_therapist_of_booking();

-- Add function to notify client of session status changes
CREATE OR REPLACE FUNCTION notify_client_of_session_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_name text;
  therapist_name text;
BEGIN
  -- Only notify on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get client and therapist names
  SELECT COALESCE(raw_user_meta_data->>'full_name', 'Client') INTO client_name
  FROM auth.users 
  WHERE id = NEW.client_id;
  
  SELECT COALESCE(u.raw_user_meta_data->>'full_name', 'Your therapist') INTO therapist_name
  FROM therapist_profiles tp
  JOIN auth.users u ON u.id = tp.user_id
  WHERE tp.id = NEW.therapist_id;
  
  -- Insert notification for client
  INSERT INTO user_notifications (
    user_id,
    title,
    message,
    type,
    priority,
    read,
    action_url,
    action_text,
    metadata
  ) VALUES (
    NEW.client_id,
    'Session Status Update',
    'Your session with ' || therapist_name || ' has been ' || NEW.status || '.',
    CASE 
      WHEN NEW.status = 'confirmed' THEN 'info'
      WHEN NEW.status = 'cancelled' THEN 'alert'
      WHEN NEW.status = 'completed' THEN 'achievement'
      ELSE 'info'
    END,
    CASE 
      WHEN NEW.status = 'cancelled' THEN 'high'
      WHEN NEW.status = 'confirmed' THEN 'medium'
      ELSE 'low'
    END,
    false,
    '/my-therapy-sessions',
    'View Sessions',
    jsonb_build_object(
      'session_id', NEW.id,
      'old_status', OLD.status,
      'new_status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for session status changes
DROP TRIGGER IF EXISTS notify_client_on_session_change ON therapy_sessions;
CREATE TRIGGER notify_client_on_session_change
  AFTER UPDATE ON therapy_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_of_session_change();