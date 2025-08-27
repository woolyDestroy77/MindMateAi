import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  TherapistProfile, 
  TherapySession, 
  TherapistSearchFilters, 
  BookingRequest,
  TherapistReview,
  SessionNotes
} from '../types/therapist';

export const useTherapistPlatform = () => {
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [userSessions, setUserSessions] = useState<TherapySession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-approve therapist for testing
  const autoApproveTherapist = useCallback(async (therapistId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('therapist_profiles')
        .update({ 
          verification_status: 'verified',
          hipaa_training_completed: true,
          hipaa_training_date: new Date().toISOString().split('T')[0],
          background_check_completed: true,
          background_check_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', therapistId);

      if (error) throw error;

      toast.success('Therapist auto-approved for testing!');
      return true;
    } catch (err) {
      console.error('Error auto-approving therapist:', err);
      toast.error('Failed to auto-approve therapist');
      return false;
    }
  }, []);

  // Search and filter therapists
  const searchTherapists = useCallback(async (filters: TherapistSearchFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 SEARCHING FOR THERAPISTS - ENHANCED DEBUG');
      console.log('Applied filters:', filters);
      
      let query = supabase
        .from('therapist_profiles')
        .select(`
          *,
          user:users!therapist_profiles_user_id_fkey(
            full_name,
            avatar_url
          ),
          specializations:therapist_specializations(*),
          availability:therapist_availability(*)
        `)
        .eq('verification_status', 'verified') // ONLY show verified therapists
        .eq('is_active', true);

      console.log('🔍 Base query: verified therapists only, is_active = true');

      // Apply filters
      if (filters.min_rate) {
        query = query.gte('hourly_rate', filters.min_rate);
      }
      if (filters.max_rate) {
        query = query.lte('hourly_rate', filters.max_rate);
      }
      if (filters.location_state) {
        query = query.eq('license_state', filters.location_state);
      }
      if (filters.accepts_insurance !== undefined) {
        query = query.eq('accepts_insurance', filters.accepts_insurance);
      }
      if (filters.session_types && filters.session_types.length > 0) {
        query = query.overlaps('session_types', filters.session_types);
      }
      if (filters.languages && filters.languages.length > 0) {
        query = query.overlaps('languages_spoken', filters.languages);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('✅ RAW THERAPIST QUERY RESULTS:', data?.length || 0);
      data?.forEach((therapist, index) => {
        console.log(`🏥 Therapist ${index + 1}:`, {
          id: therapist.id,
          name: therapist.user?.full_name,
          title: therapist.professional_title,
          rate: therapist.hourly_rate,
          state: therapist.license_state,
          active: therapist.is_active,
          status: therapist.verification_status,
          user_id: therapist.user_id,
          created_at: therapist.created_at
        });
      });
      
      // CRITICAL: Check if we have any verified therapists at all
      if (!data || data.length === 0) {
        console.log('❌ NO VERIFIED THERAPISTS FOUND IN DATABASE');
        console.log('🔍 Let me check what therapists exist...');
        
        // Debug query to see ALL therapists regardless of status
        const { data: allTherapists, error: debugError } = await supabase
          .from('therapist_profiles')
          .select(`
            id,
            verification_status,
            is_active,
            professional_title,
            user:users!therapist_profiles_user_id_fkey(full_name)
          `)
          .order('created_at', { ascending: false });
          
        if (!debugError && allTherapists) {
          console.log('🔍 ALL THERAPISTS IN DATABASE:', allTherapists.length);
          allTherapists.forEach((t, i) => {
            console.log(`Debug ${i + 1}:`, {
              id: t.id,
              name: t.user?.full_name,
              status: t.verification_status,
              active: t.is_active,
              title: t.professional_title
            });
          });
          
          const verifiedCount = allTherapists.filter(t => t.verification_status === 'verified').length;
          const activeCount = allTherapists.filter(t => t.is_active === true).length;
          const verifiedAndActiveCount = allTherapists.filter(t => 
            t.verification_status === 'verified' && t.is_active === true
          ).length;
          
          console.log('📊 THERAPIST STATUS BREAKDOWN:');
          console.log(`Total therapists: ${allTherapists.length}`);
          console.log(`Verified: ${verifiedCount}`);
          console.log(`Active: ${activeCount}`);
          console.log(`Verified AND Active: ${verifiedAndActiveCount}`);
          
          if (verifiedAndActiveCount === 0) {
            console.log('🚨 PROBLEM IDENTIFIED: No therapists are both verified AND active');
            console.log('💡 SOLUTION: Admin needs to approve therapists or therapists need to be activated');
          }
        }
      }

      // Filter by specializations if specified
      let filteredData = data || [];
      if (filters.specializations && filters.specializations.length > 0) {
        filteredData = filteredData.filter(therapist =>
          therapist.specializations?.some((spec: any) =>
            filters.specializations!.includes(spec.category)
          )
        );
      }

      // Calculate average ratings
      const therapistsWithRatings = await Promise.all(
        filteredData.map(async (therapist) => {
          const { data: reviews } = await supabase
            .from('therapist_reviews')
            .select('rating')
            .eq('therapist_id', therapist.id)
            .eq('is_approved', true);

          const average_rating = reviews && reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

          return {
            ...therapist,
            average_rating: Math.round(average_rating * 10) / 10,
            total_reviews: reviews?.length || 0
          };
        })
      );

      // Apply rating filter
      if (filters.min_rating) {
        filteredData = therapistsWithRatings.filter(
          therapist => (therapist.average_rating || 0) >= filters.min_rating!
        );
      } else {
        filteredData = therapistsWithRatings;
      }

      setTherapists(filteredData);
    } catch (err) {
      console.error('Error searching therapists:', err);
      setError(`Failed to search therapists: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error('Failed to load therapists');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get therapist by ID
  const getTherapistById = useCallback(async (therapistId: string): Promise<TherapistProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select(`
          *,
          user:users!therapist_profiles_user_id_fkey(
            full_name,
            avatar_url
          ),
          specializations:therapist_specializations(*),
          availability:therapist_availability(*)
        `)
        .eq('id', therapistId)
        .in('verification_status', ['verified', 'pending']) // Allow both for testing
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        return null;
      }

      // Get average rating
      const { data: reviews } = await supabase
        .from('therapist_reviews')
        .select('rating')
        .eq('therapist_id', therapistId)
        .eq('is_approved', true);

      const average_rating = reviews && reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      return {
        ...data,
        average_rating: Math.round(average_rating * 10) / 10,
        total_reviews: reviews?.length || 0
      };
    } catch (err) {
      console.error('Error fetching therapist:', err);
      return null;
    }
  }, []);

  // Book a therapy session
  const bookSession = useCallback(async (bookingRequest: BookingRequest): Promise<TherapySession | null> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Get therapist details for pricing
      const therapist = await getTherapistById(bookingRequest.therapist_id);
      if (!therapist) throw new Error('Therapist not found');

      // Calculate session cost
      const duration_hours = bookingRequest.duration_minutes / 60;
      const total_cost = therapist.hourly_rate * duration_hours;

      // Create session
      const sessionData = {
        therapist_id: bookingRequest.therapist_id,
        client_id: user.id,
        session_type: bookingRequest.session_type,
        scheduled_start: new Date(`${bookingRequest.preferred_date}T${bookingRequest.preferred_time}`).toISOString(),
        scheduled_end: new Date(
          new Date(`${bookingRequest.preferred_date}T${bookingRequest.preferred_time}`).getTime() + 
          (bookingRequest.duration_minutes * 60 * 1000)
        ).toISOString(),
        session_format: bookingRequest.session_format,
        session_rate: therapist.hourly_rate,
        total_cost,
        client_notes: bookingRequest.client_notes,
        video_room_id: bookingRequest.session_format === 'video' ? `room_${Date.now()}` : null
      };

      const { data, error } = await supabase
        .from('therapy_sessions')
        .insert([sessionData])
        .select(`
          *,
          therapist:therapist_profiles(*),
          client:users!therapy_sessions_client_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      toast.success('Session booked successfully! You will receive a confirmation email.');
      return data;
    } catch (err) {
      console.error('Error booking session:', err);
      toast.error('Failed to book session');
      return null;
    }
  }, [getTherapistById]);

  // Get user's therapy sessions
  const getUserSessions = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('therapy_sessions')
        .select(`
          *,
          therapist:therapist_profiles(
            *,
            user:users!therapist_profiles_user_id_fkey(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('client_id', user.id)
        .order('scheduled_start', { ascending: false });

      if (error) throw error;

      setUserSessions(data || []);
    } catch (err) {
      console.error('Error fetching user sessions:', err);
      toast.error('Failed to load your sessions');
    }
  }, []);

  // Cancel a session
  const cancelSession = useCallback(async (sessionId: string, reason: string): Promise<boolean> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('therapy_sessions')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: user.id,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('client_id', user.id); // Ensure user can only cancel their own sessions

      if (error) throw error;

      toast.success('Session cancelled successfully');
      await getUserSessions(); // Refresh sessions
      return true;
    } catch (err) {
      console.error('Error cancelling session:', err);
      toast.error('Failed to cancel session');
      return false;
    }
  }, [getUserSessions]);

  // Submit a review
  const submitReview = useCallback(async (
    sessionId: string,
    rating: number,
    reviewText: string,
    ratings: {
      communication: number;
      professionalism: number;
      effectiveness: number;
    },
    wouldRecommend: boolean = true,
    isAnonymous: boolean = false
  ): Promise<boolean> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Get session details to get therapist_id
      const { data: session, error: sessionError } = await supabase
        .from('therapy_sessions')
        .select('therapist_id')
        .eq('id', sessionId)
        .eq('client_id', user.id)
        .single();

      if (sessionError) throw sessionError;

      const reviewData = {
        therapist_id: session.therapist_id,
        client_id: user.id,
        session_id: sessionId,
        rating,
        review_text: reviewText,
        would_recommend: wouldRecommend,
        communication_rating: ratings.communication,
        professionalism_rating: ratings.professionalism,
        effectiveness_rating: ratings.effectiveness,
        is_anonymous: isAnonymous
      };

      const { error } = await supabase
        .from('therapist_reviews')
        .insert([reviewData]);

      if (error) throw error;

      toast.success('Review submitted successfully! It will be reviewed before publication.');
      return true;
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review');
      return false;
    }
  }, []);

  // Get therapist reviews
  const getTherapistReviews = useCallback(async (therapistId: string): Promise<TherapistReview[]> => {
    try {
      const { data, error } = await supabase
        .from('therapist_reviews')
        .select(`
          *,
          client:users!therapist_reviews_client_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('therapist_id', therapistId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching reviews:', err);
      return [];
    }
  }, []);

  // Initialize
  useEffect(() => {
    searchTherapists();
    getUserSessions();
  }, [searchTherapists, getUserSessions]);

  return {
    // Data
    therapists,
    userSessions,
    isLoading,
    error,

    // Actions
    searchTherapists,
    getTherapistById,
    bookSession,
    cancelSession,
    submitReview,
    getTherapistReviews,
    getUserSessions,
    autoApproveTherapist
  };
};