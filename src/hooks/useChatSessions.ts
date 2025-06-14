import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface ChatSession {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
      
      // Find active session
      const active = data?.find(session => session.is_active);
      setActiveSession(active || null);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      toast.error('Failed to load chat sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewSession = useCallback(async (): Promise<ChatSession | null> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Deactivate current active session first
      if (activeSession) {
        await supabase
          .from('chat_sessions')
          .update({ is_active: false })
          .eq('id', activeSession.id);
      }

      // Create session name based on current date and time
      const now = new Date();
      const sessionName = `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: user.id,
          name: sessionName,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setActiveSession(data);
      setSessions(prev => [data, ...prev.map(s => ({ ...s, is_active: false }))]);
      toast.success('New chat session created');
      
      return data;
    } catch (error) {
      console.error('Error creating new session:', error);
      toast.error('Failed to create new chat session');
      return null;
    }
  }, [activeSession]);

  const switchToSession = useCallback(async (sessionId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Don't switch if already active
      if (activeSession?.id === sessionId) return;

      // Deactivate all sessions for this user
      await supabase
        .from('chat_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate selected session
      const { data, error } = await supabase
        .from('chat_sessions')
        .update({ is_active: true })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      setActiveSession(data);
      setSessions(prev => prev.map(s => ({ 
        ...s, 
        is_active: s.id === sessionId 
      })));
    } catch (error) {
      console.error('Error switching session:', error);
      toast.error('Failed to switch chat session');
    }
  }, [activeSession]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If deleted session was active, create a new one or set to null
      if (activeSession?.id === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          // Switch to the most recent session
          await switchToSession(remainingSessions[0].id);
        } else {
          // Create a new session if no sessions remain
          await createNewSession();
        }
      }

      toast.success('Chat session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete chat session');
    }
  }, [activeSession, sessions, createNewSession, switchToSession]);

  const renameSession = useCallback(async (sessionId: string, newName: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .update({ name: newName })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => prev.map(s => s.id === sessionId ? data : s));
      if (activeSession?.id === sessionId) {
        setActiveSession(data);
      }

      toast.success('Session renamed');
    } catch (error) {
      console.error('Error renaming session:', error);
      toast.error('Failed to rename session');
    }
  }, [activeSession]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    activeSession,
    isLoading,
    createNewSession,
    switchToSession,
    deleteSession,
    renameSession,
    refreshSessions: fetchSessions
  };
};