export interface TherapistProfile {
  id: string;
  user_id: string;
  license_number: string;
  license_state: string;
  license_expiry: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  professional_title: string;
  years_experience: number;
  education: Education[];
  certifications: Certification[];
  bio: string;
  approach_description: string;
  languages_spoken: string[];
  hourly_rate: number;
  session_types: SessionType[];
  accepts_insurance: boolean;
  insurance_networks: string[];
  timezone: string;
  profile_image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hipaa_training_completed: boolean;
  hipaa_training_date?: string;
  background_check_completed: boolean;
  background_check_date?: string;
  
  // Computed fields
  average_rating?: number;
  total_reviews?: number;
  specializations?: TherapistSpecialization[];
  availability?: TherapistAvailability[];
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
  field_of_study: string;
}

export interface Certification {
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
}

export interface TherapistSpecialization {
  id: string;
  therapist_id: string;
  specialization: string;
  category: string;
  experience_level: 'beginner' | 'intermediate' | 'expert';
  created_at: string;
}

export interface TherapistAvailability {
  id: string;
  therapist_id: string;
  day_of_week: number; // 0 = Sunday
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface TherapySession {
  id: string;
  therapist_id: string;
  client_id: string;
  session_type: SessionType;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: SessionStatus;
  session_format: 'video' | 'phone' | 'in_person';
  session_rate: number;
  total_cost: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  client_notes?: string;
  reminder_sent: boolean;
  video_room_id?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  therapist?: TherapistProfile;
  client?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface SessionNotes {
  id: string;
  session_id: string;
  therapist_id: string;
  client_id: string;
  session_summary: string;
  treatment_goals: string;
  interventions_used: string;
  client_progress: string;
  homework_assigned: string;
  next_session_plan: string;
  risk_assessment: string;
  session_duration_minutes: number;
  mood_before: number;
  mood_after: number;
  session_rating: number;
  created_at: string;
  updated_at: string;
}

export interface TherapistReview {
  id: string;
  therapist_id: string;
  client_id: string;
  session_id: string;
  rating: number;
  review_text: string;
  would_recommend: boolean;
  communication_rating: number;
  professionalism_rating: number;
  effectiveness_rating: number;
  is_anonymous: boolean;
  is_approved: boolean;
  created_at: string;
  
  // Related data
  client?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface PaymentTransaction {
  id: string;
  session_id: string;
  client_id: string;
  therapist_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_intent_id?: string;
  transaction_fee: number;
  platform_fee: number;
  therapist_payout: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  processed_at?: string;
  refunded_at?: string;
  refund_reason?: string;
  created_at: string;
}

export interface CrisisProtocol {
  id: string;
  client_id: string;
  therapist_id: string;
  session_id?: string;
  crisis_type: string;
  risk_level: 'low' | 'medium' | 'high' | 'imminent';
  assessment_details: string;
  actions_taken: string;
  emergency_contacts_notified: boolean;
  authorities_contacted: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  created_at: string;
  resolved_at?: string;
}

export type SessionType = 'individual' | 'couples' | 'family' | 'group';
export type SessionStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface TherapistSearchFilters {
  specializations?: string[];
  session_types?: SessionType[];
  languages?: string[];
  min_rate?: number;
  max_rate?: number;
  min_rating?: number;
  accepts_insurance?: boolean;
  insurance_networks?: string[];
  availability_day?: number;
  availability_time?: string;
  location_state?: string;
}

export interface BookingRequest {
  therapist_id: string;
  session_type: SessionType;
  session_format: 'video' | 'phone' | 'in_person';
  preferred_date: string;
  preferred_time: string;
  duration_minutes: number;
  client_notes?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}