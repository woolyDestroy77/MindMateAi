import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface TherapySession {
  id: string;
  therapist_id: string;
  session_type: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  session_format: 'video' | 'phone' | 'in_person';
  total_cost: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  client_notes?: string;
  video_room_id?: string;
  created_at: string;
  therapist?: {
    id: string;
    professional_title: string;
    hourly_rate: number;
    user?: {
      full_name: string;
      avatar_url?: string;
    };
  };
}

export const useTherapySessions = () => {
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      console.log('🔍 Fetching therapy sessions for user:', user.id);

      const { data, error } = await supabase
        .from('therapy_sessions')
        .select(`
          *,
          therapist:therapist_profiles(
            id,
            professional_title,
            hourly_rate,
            user:users!therapist_profiles_user_id_fkey(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('client_id', user.id)
        .order('scheduled_start', { ascending: false });

      if (error) throw error;
      
      console.log('✅ Found therapy sessions:', data?.length || 0);
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching therapy sessions:', err);
      setError('Failed to load therapy sessions');
      toast.error('Failed to load your therapy sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up real-time subscription separately to avoid multiple subscriptions
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clean up existing subscription
      if (subscriptionRef.current) {
        console.log('🧹 Cleaning up existing therapy sessions subscription');
        await supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      console.log('🔄 Setting up therapy sessions real-time subscription');
      
      const channelName = `therapy_sessions_${user.id}`;
      const subscription = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'therapy_sessions',
          filter: `client_id=eq.${user.id}`
        }, (payload) => {
          console.log('🔄 Real-time therapy session update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setSessions(prev => [payload.new as TherapySession, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSessions(prev => prev.map(session => 
              session.id === payload.new.id ? payload.new as TherapySession : session
            ));
          } else if (payload.eventType === 'DELETE') {
            setSessions(prev => prev.filter(session => session.id !== payload.old.id));
          }
        })
        .subscribe((status) => {
          console.log('Therapy sessions subscription status:', status);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Therapy sessions subscription error:', status);
            // Clean up failed subscription
            if (subscriptionRef.current) {
              supabase.removeChannel(subscriptionRef.current);
              subscriptionRef.current = null;
            }
          }
        });

      subscriptionRef.current = subscription;
    };

    setupSubscription();

    return () => {
      if (subscriptionRef.current) {
        console.log('🧹 Cleaning up therapy sessions subscription on unmount');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);
  const cancelSession = useCallback(async (sessionId: string, reason: string = '') => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return false;

      console.log('🚫 Cancelling session:', sessionId);

      const { error } = await supabase
        .from('therapy_sessions')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: user.id,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('client_id', user.id);

      if (error) throw error;

      console.log('✅ Session cancelled successfully');
      toast.success('Session cancelled successfully');
      return true;
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
      return false;
    }
  }, []);

  const getUpcomingSessions = useCallback(() => {
    return sessions.filter(session => 
      ['scheduled', 'confirmed'].includes(session.status) && 
      new Date(session.scheduled_start) > new Date()
    );
  }, [sessions]);

  const getNextSession = useCallback(() => {
    const upcoming = getUpcomingSessions();
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [getUpcomingSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    cancelSession,
    getUpcomingSessions,
    getNextSession
  };
};