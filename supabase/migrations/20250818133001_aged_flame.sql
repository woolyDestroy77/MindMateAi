/*
  # Fix User Roles and Account Status System

  1. New Tables
    - `user_profiles` - Centralized user profile management with roles
    - Enhanced `therapist_profiles` with proper status tracking
    
  2. User Role System
    - Add user_type enum (patient, therapist, admin)
    - Add account_status enum (pending, active, suspended, rejected)
    - Proper role-based access control
    
  3. Security Updates
    - Enhanced RLS policies for role-based access
    - Proper therapist verification workflow
    - Admin management capabilities
    
  4. Triggers and Functions
    - Auto-create user profiles on signup
    - Status change notifications
    - Proper user role management
*/

-- Create user_type enum
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('patient', 'therapist', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create account_status enum
DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table for centralized user management
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL DEFAULT 'patient',
  account_status account_status NOT NULL DEFAULT 'active',
  full_name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  phone text,
  date_of_birth date,
  location text,
  bio text,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.user_type = 'admin'
    )
  );

-- Update therapist_profiles to use proper status tracking
DO $$
BEGIN
  -- Add account_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'therapist_profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE therapist_profiles ADD COLUMN account_status account_status DEFAULT 'pending';
  END IF;
END $$;

-- Update existing therapist profiles to have proper account status
UPDATE therapist_profiles 
SET account_status = CASE 
  WHEN verification_status = 'verified' THEN 'active'::account_status
  WHEN verification_status = 'rejected' THEN 'rejected'::account_status
  WHEN verification_status = 'suspended' THEN 'suspended'::account_status
  ELSE 'pending'::account_status
END
WHERE account_status IS NULL;

-- Enhanced RLS policies for therapist_profiles
DROP POLICY IF EXISTS "Public can view verified therapist profiles" ON therapist_profiles;
DROP POLICY IF EXISTS "Therapists can manage own profile" ON therapist_profiles;

CREATE POLICY "Public can view active therapist profiles"
  ON therapist_profiles
  FOR SELECT
  TO authenticated
  USING (
    verification_status = 'verified' 
    AND is_active = true 
    AND account_status = 'active'
  );

CREATE POLICY "Therapists can manage own profile"
  ON therapist_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all therapist profiles
CREATE POLICY "Admins can manage all therapist profiles"
  ON therapist_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.user_type = 'admin'
    )
  );

-- Enhanced RLS policies for therapy_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Therapists and clients can update own sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Clients can book sessions" ON therapy_sessions;

-- Clients can view and book their own sessions
CREATE POLICY "Clients can manage own sessions"
  ON therapy_sessions
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Therapists can view and manage sessions for their profile
CREATE POLICY "Therapists can manage their sessions"
  ON therapy_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_profiles tp 
      WHERE tp.id = therapy_sessions.therapist_id 
      AND tp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM therapist_profiles tp 
      WHERE tp.id = therapy_sessions.therapist_id 
      AND tp.user_id = auth.uid()
    )
  );

-- Enhanced RLS policies for payment_transactions
DROP POLICY IF EXISTS "Users can view own payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can update own payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Clients can create payment transactions for their sessions" ON payment_transactions;

-- Clients can manage payment transactions for their sessions
CREATE POLICY "Clients can manage own payment transactions"
  ON payment_transactions
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Therapists can view payment transactions for their sessions
CREATE POLICY "Therapists can view their payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_profiles tp 
      WHERE tp.id = payment_transactions.therapist_id 
      AND tp.user_id = auth.uid()
    )
  );

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    user_id,
    user_type,
    account_status,
    full_name,
    email,
    avatar_url
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'patient')::user_type,
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'user_type', 'patient') = 'therapist' THEN 'pending'::account_status
      ELSE 'active'::account_status
    END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to sync therapist status with user profile
CREATE OR REPLACE FUNCTION sync_therapist_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles account_status when therapist verification changes
  UPDATE user_profiles 
  SET 
    account_status = CASE 
      WHEN NEW.verification_status = 'verified' THEN 'active'::account_status
      WHEN NEW.verification_status = 'rejected' THEN 'rejected'::account_status
      WHEN NEW.verification_status = 'suspended' THEN 'suspended'::account_status
      ELSE 'pending'::account_status
    END,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync therapist status
DROP TRIGGER IF EXISTS sync_therapist_status_trigger ON therapist_profiles;
CREATE TRIGGER sync_therapist_status_trigger
  AFTER UPDATE ON therapist_profiles
  FOR EACH ROW
  WHEN (OLD.verification_status IS DISTINCT FROM NEW.verification_status)
  EXECUTE FUNCTION sync_therapist_status();

-- Enhanced notification function for session bookings
CREATE OR REPLACE FUNCTION notify_therapist_of_booking()
RETURNS TRIGGER AS $$
DECLARE
  therapist_user_id uuid;
  client_name text;
BEGIN
  -- Get therapist user_id
  SELECT user_id INTO therapist_user_id
  FROM therapist_profiles 
  WHERE id = NEW.therapist_id;
  
  -- Get client name
  SELECT raw_user_meta_data->>'full_name' INTO client_name
  FROM auth.users 
  WHERE id = NEW.client_id;
  
  -- Create notification for therapist
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
    'New Session Booking Request',
    COALESCE(client_name, 'A client') || ' has requested a ' || NEW.session_type || ' session for ' || 
    to_char(NEW.scheduled_start, 'Mon DD, YYYY at HH12:MI AM') || '.',
    'info',
    'high',
    false,
    '/therapist-sessions',
    'Review Request',
    jsonb_build_object(
      'session_id', NEW.id,
      'client_id', NEW.client_id,
      'client_name', COALESCE(client_name, 'Anonymous'),
      'session_type', NEW.session_type,
      'session_format', NEW.session_format,
      'scheduled_start', NEW.scheduled_start,
      'total_cost', NEW.total_cost
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced notification function for session status changes
CREATE OR REPLACE FUNCTION notify_client_of_session_change()
RETURNS TRIGGER AS $$
DECLARE
  client_name text;
  therapist_name text;
BEGIN
  -- Only notify on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get client and therapist names
    SELECT raw_user_meta_data->>'full_name' INTO client_name
    FROM auth.users WHERE id = NEW.client_id;
    
    SELECT u.raw_user_meta_data->>'full_name' INTO therapist_name
    FROM auth.users u
    JOIN therapist_profiles tp ON tp.user_id = u.id
    WHERE tp.id = NEW.therapist_id;
    
    -- Create notification for client
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
      'Session Status Updated',
      'Your session with ' || COALESCE(therapist_name, 'your therapist') || ' has been ' || NEW.status || '.',
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'achievement'
        WHEN NEW.status = 'cancelled' THEN 'alert'
        ELSE 'info'
      END,
      CASE 
        WHEN NEW.status IN ('confirmed', 'cancelled') THEN 'high'
        ELSE 'medium'
      END,
      false,
      '/my-therapy-sessions',
      'View Sessions',
      jsonb_build_object(
        'session_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'therapist_name', COALESCE(therapist_name, 'Unknown')
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status ON user_profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Try to find admin user by email
  SELECT id INTO admin_user_id
  FROM auth.users 
  WHERE email = 'youssef.arafat09@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Create or update admin profile
    INSERT INTO user_profiles (
      user_id,
      user_type,
      account_status,
      full_name,
      email
    ) VALUES (
      admin_user_id,
      'admin',
      'active',
      'Admin User',
      'youssef.arafat09@gmail.com'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      user_type = 'admin',
      account_status = 'active',
      updated_at = now();
      
    -- Also update admin_users table
    INSERT INTO admin_users (
      user_id,
      email,
      role,
      last_login
    ) VALUES (
      admin_user_id,
      'youssef.arafat09@gmail.com',
      'admin',
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      last_login = now();
  END IF;
END $$;

-- Update existing users to have proper profiles
INSERT INTO user_profiles (user_id, user_type, account_status, full_name, email, avatar_url)
SELECT 
  u.id,
  CASE 
    WHEN u.raw_user_meta_data->>'user_type' = 'therapist' THEN 'therapist'::user_type
    WHEN u.email = 'youssef.arafat09@gmail.com' THEN 'admin'::user_type
    ELSE 'patient'::user_type
  END,
  CASE 
    WHEN u.raw_user_meta_data->>'user_type' = 'therapist' THEN 'pending'::account_status
    ELSE 'active'::account_status
  END,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  u.email,
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);

-- Update therapist account status based on verification
UPDATE user_profiles 
SET account_status = CASE 
  WHEN EXISTS (
    SELECT 1 FROM therapist_profiles tp 
    WHERE tp.user_id = user_profiles.user_id 
    AND tp.verification_status = 'verified'
  ) THEN 'active'::account_status
  WHEN EXISTS (
    SELECT 1 FROM therapist_profiles tp 
    WHERE tp.user_id = user_profiles.user_id 
    AND tp.verification_status = 'rejected'
  ) THEN 'rejected'::account_status
  WHEN EXISTS (
    SELECT 1 FROM therapist_profiles tp 
    WHERE tp.user_id = user_profiles.user_id 
    AND tp.verification_status = 'suspended'
  ) THEN 'suspended'::account_status
  ELSE 'pending'::account_status
END
WHERE user_type = 'therapist';

-- Create view for easy user management
CREATE OR REPLACE VIEW user_management AS
SELECT 
  up.id,
  up.user_id,
  up.user_type,
  up.account_status,
  up.full_name,
  up.email,
  up.avatar_url,
  up.created_at,
  up.last_login,
  tp.id as therapist_profile_id,
  tp.verification_status,
  tp.professional_title,
  tp.license_state,
  tp.hourly_rate
FROM user_profiles up
LEFT JOIN therapist_profiles tp ON tp.user_id = up.user_id
ORDER BY up.created_at DESC;

-- Grant access to the view
GRANT SELECT ON user_management TO authenticated;

-- Function to update user profile updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();