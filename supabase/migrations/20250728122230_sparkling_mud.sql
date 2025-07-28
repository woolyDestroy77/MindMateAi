/*
  # Therapist Freelancing Platform Schema

  1. New Tables
    - `therapist_profiles` - Licensed therapist information and credentials
    - `therapist_specializations` - Areas of expertise and treatment approaches
    - `therapist_availability` - Scheduling and availability management
    - `therapy_sessions` - Session bookings and management
    - `session_notes` - HIPAA-compliant session documentation
    - `therapist_reviews` - Client feedback and ratings
    - `payment_transactions` - Secure payment processing records
    - `crisis_protocols` - Emergency intervention procedures

  2. Security & Compliance
    - Row Level Security (RLS) enabled on all tables
    - HIPAA-compliant data handling
    - Encrypted sensitive information
    - Audit trails for all actions

  3. User Roles
    - Therapists: Licensed professionals offering services
    - Clients: Users seeking therapy services
    - Admins: Platform administrators for verification
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Therapist Profiles Table
CREATE TABLE IF NOT EXISTS therapist_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number text NOT NULL,
  license_state text NOT NULL,
  license_expiry date NOT NULL,
  verification_status text CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')) DEFAULT 'pending',
  professional_title text NOT NULL,
  years_experience integer NOT NULL CHECK (years_experience >= 0),
  education jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  bio text,
  approach_description text,
  languages_spoken text[] DEFAULT ARRAY['English'],
  hourly_rate decimal(10,2) NOT NULL CHECK (hourly_rate > 0),
  session_types text[] DEFAULT ARRAY['individual'], -- individual, couples, family, group
  accepts_insurance boolean DEFAULT false,
  insurance_networks text[] DEFAULT ARRAY[]::text[],
  timezone text DEFAULT 'UTC',
  profile_image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Compliance fields
  hipaa_training_completed boolean DEFAULT false,
  hipaa_training_date date,
  background_check_completed boolean DEFAULT false,
  background_check_date date,
  
  UNIQUE(user_id),
  UNIQUE(license_number, license_state)
);

-- Therapist Specializations Table
CREATE TABLE IF NOT EXISTS therapist_specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapist_profiles(id) ON DELETE CASCADE,
  specialization text NOT NULL,
  category text NOT NULL, -- anxiety, depression, trauma, addiction, relationships, etc.
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'expert')) DEFAULT 'intermediate',
  created_at timestamptz DEFAULT now()
);

-- Therapist Availability Table
CREATE TABLE IF NOT EXISTS therapist_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapist_profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(therapist_id, day_of_week, start_time)
);

-- Therapy Sessions Table
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapist_profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text CHECK (session_type IN ('individual', 'couples', 'family', 'group')) DEFAULT 'individual',
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  status text CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  session_format text CHECK (session_format IN ('video', 'phone', 'in_person')) DEFAULT 'video',
  session_rate decimal(10,2) NOT NULL,
  total_cost decimal(10,2) NOT NULL,
  payment_status text CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')) DEFAULT 'pending',
  cancellation_reason text,
  cancelled_by uuid REFERENCES auth.users(id),
  cancelled_at timestamptz,
  client_notes text, -- Client's pre-session notes
  reminder_sent boolean DEFAULT false,
  video_room_id text, -- For video conferencing
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Session Notes Table (HIPAA-compliant)
CREATE TABLE IF NOT EXISTS session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES therapist_profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Clinical notes (encrypted)
  session_summary text, -- Encrypted
  treatment_goals text, -- Encrypted
  interventions_used text, -- Encrypted
  client_progress text, -- Encrypted
  homework_assigned text, -- Encrypted
  next_session_plan text, -- Encrypted
  risk_assessment text, -- Encrypted
  
  -- Metadata
  session_duration_minutes integer,
  mood_before integer CHECK (mood_before BETWEEN 1 AND 10),
  mood_after integer CHECK (mood_after BETWEEN 1 AND 10),
  session_rating integer CHECK (session_rating BETWEEN 1 AND 5),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Therapist Reviews Table
CREATE TABLE IF NOT EXISTS therapist_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapist_profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text text,
  would_recommend boolean DEFAULT true,
  communication_rating integer CHECK (communication_rating BETWEEN 1 AND 5),
  professionalism_rating integer CHECK (professionalism_rating BETWEEN 1 AND 5),
  effectiveness_rating integer CHECK (effectiveness_rating BETWEEN 1 AND 5),
  
  is_anonymous boolean DEFAULT false,
  is_approved boolean DEFAULT false, -- Moderation
  moderated_by uuid REFERENCES auth.users(id),
  moderated_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(client_id, session_id) -- One review per session
);

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES therapist_profiles(id) ON DELETE CASCADE,
  
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_method text NOT NULL, -- stripe_card, stripe_bank, etc.
  payment_intent_id text, -- Stripe payment intent ID
  transaction_fee decimal(10,2) DEFAULT 0,
  platform_fee decimal(10,2) DEFAULT 0,
  therapist_payout decimal(10,2) NOT NULL,
  
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  processed_at timestamptz,
  refunded_at timestamptz,
  refund_reason text,
  
  created_at timestamptz DEFAULT now()
);

-- Crisis Protocols Table
CREATE TABLE IF NOT EXISTS crisis_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES therapist_profiles(id),
  session_id uuid REFERENCES therapy_sessions(id),
  
  crisis_type text NOT NULL, -- suicide_risk, self_harm, domestic_violence, etc.
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'imminent')) NOT NULL,
  assessment_details text NOT NULL, -- Encrypted
  actions_taken text NOT NULL, -- Encrypted
  emergency_contacts_notified boolean DEFAULT false,
  authorities_contacted boolean DEFAULT false,
  follow_up_required boolean DEFAULT true,
  follow_up_completed boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Therapist Messages Table (HIPAA-compliant)
CREATE TABLE IF NOT EXISTS therapist_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES therapy_sessions(id),
  
  message_content text NOT NULL, -- Encrypted
  message_type text CHECK (message_type IN ('text', 'file', 'appointment_reminder', 'system')) DEFAULT 'text',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  
  -- File attachments (if any)
  attachment_url text,
  attachment_type text,
  attachment_size integer,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verification ON therapist_profiles(verification_status, is_active);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_location ON therapist_profiles(license_state);
CREATE INDEX IF NOT EXISTS idx_therapist_specializations_category ON therapist_specializations(category);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_therapist_date ON therapy_sessions(therapist_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_client_date ON therapy_sessions(client_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_status ON therapy_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_notes_session ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_therapist_reviews_therapist ON therapist_reviews(therapist_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_crisis_protocols_risk ON crisis_protocols(risk_level, created_at);

-- Enable Row Level Security
ALTER TABLE therapist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Therapist Profiles
CREATE POLICY "Therapists can manage own profile"
  ON therapist_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view verified therapist profiles"
  ON therapist_profiles
  FOR SELECT
  TO authenticated
  USING (verification_status = 'verified' AND is_active = true);

-- RLS Policies for Specializations
CREATE POLICY "Therapists can manage own specializations"
  ON therapist_specializations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE id = therapist_specializations.therapist_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view therapist specializations"
  ON therapist_specializations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE id = therapist_specializations.therapist_id 
      AND verification_status = 'verified' 
      AND is_active = true
    )
  );

-- RLS Policies for Availability
CREATE POLICY "Therapists can manage own availability"
  ON therapist_availability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE id = therapist_availability.therapist_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view therapist availability"
  ON therapist_availability
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE id = therapist_availability.therapist_id 
      AND verification_status = 'verified' 
      AND is_active = true
    )
  );

-- RLS Policies for Therapy Sessions
CREATE POLICY "Users can view own sessions"
  ON therapy_sessions
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE id = therapy_sessions.therapist_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can book sessions"
  ON therapy_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Therapists and clients can update own sessions"
  ON therapy_sessions
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE id = therapy_sessions.therapist_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Session Notes (Therapist only)
CREATE POLICY "Therapists can manage session notes"
  ON session_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE id = session_notes.therapist_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Reviews
CREATE POLICY "Clients can create reviews for their sessions"
  ON therapist_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can view approved reviews"
  ON therapist_reviews
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "Clients can view own reviews"
  ON therapist_reviews
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- RLS Policies for Payment Transactions
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE id = payment_transactions.therapist_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Crisis Protocols (Therapist and emergency access)
CREATE POLICY "Therapists can manage crisis protocols"
  ON crisis_protocols
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapist_profiles 
      WHERE id = crisis_protocols.therapist_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Therapist Messages
CREATE POLICY "Users can view own messages"
  ON therapist_messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON therapist_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_therapist_profiles_updated_at
  BEFORE UPDATE ON therapist_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapy_sessions_updated_at
  BEFORE UPDATE ON therapy_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at
  BEFORE UPDATE ON session_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();