import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface AnxietySession {
  id: string;
  user_id: string;
  session_type: 'breathing' | 'meditation' | 'journal' | 'cbt' | 'panic_relief';
  technique_used: string;
  duration_minutes: number;
  anxiety_before: number;
  anxiety_after?: number;
  notes?: string;
  created_at: string;
}

export interface AnxietyJournalEntry {
  id: string;
  user_id: string;
  anxiety_level: number;
  triggers: string[];
  physical_symptoms: string[];
  thoughts: string;
  coping_strategies: string[];
  mood_after: number;
  created_at: string;
}

export interface CBTWorksheet {
  id: string;
  user_id: string;
  worksheet_type: 'thought_record' | 'exposure_hierarchy' | 'worry_time' | 'grounding';
  situation: string;
  automatic_thoughts: string;
  emotions: string[];
  evidence_for: string;
  evidence_against: string;
  balanced_thought: string;
  new_emotion_rating: number;
  created_at: string;
}

export interface AnxietyStats {
  averageLevel: number;
  sessionsToday: number;
  sessionsThisWeek: number;
  improvementTrend: number;
  mostEffectiveTechnique: string;
}

export const useAnxietySupport = () => {
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [todaysSessions, setTodaysSessions] = useState<AnxietySession[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<AnxietyStats | null>(null);
  const [journalEntries, setJournalEntries] = useState<AnxietyJournalEntry[]>([]);
  const [cbtWorksheets, setCbtWorksheets] = useState<CBTWorksheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's anxiety data
  const fetchAnxietyData = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // Fetch today's sessions
      const today = new Date().toISOString().split('T')[0];
      const { data: sessions, error: sessionsError } = await supabase
        .from('anxiety_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      setTodaysSessions(sessions || []);

      // Fetch recent journal entries
      const { data: entries, error: entriesError } = await supabase
        .from('anxiety_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (entriesError) throw entriesError;
      setJournalEntries(entries || []);

      // Fetch CBT worksheets
      const { data: worksheets, error: worksheetsError } = await supabase
        .from('cbt_worksheets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (worksheetsError) throw worksheetsError;
      setCbtWorksheets(worksheets || []);

      // Calculate weekly stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weekSessions, error: weekError } = await supabase
        .from('anxiety_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      if (weekError) throw weekError;

      if (weekSessions && weekSessions.length > 0) {
        const avgBefore = weekSessions.reduce((sum, s) => sum + s.anxiety_before, 0) / weekSessions.length;
        const avgAfter = weekSessions
          .filter(s => s.anxiety_after)
          .reduce((sum, s) => sum + (s.anxiety_after || 0), 0) / weekSessions.filter(s => s.anxiety_after).length;

        const techniques = weekSessions.reduce((acc, s) => {
          acc[s.technique_used] = (acc[s.technique_used] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mostEffective = Object.entries(techniques).sort(([,a], [,b]) => b - a)[0]?.[0] || 'breathing';

        setWeeklyProgress({
          averageLevel: avgBefore,
          sessionsToday: sessions?.length || 0,
          sessionsThisWeek: weekSessions.length,
          improvementTrend: avgBefore - avgAfter,
          mostEffectiveTechnique: mostEffective
        });
      }

    } catch (error) {
      console.error('Error fetching anxiety data:', error);
      toast.error('Failed to load anxiety data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update current anxiety level
  const updateAnxietyLevel = useCallback(async (level: number) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      setAnxietyLevel(level);
      
      // Store in user preferences or create a quick log entry
      const { error } = await supabase
        .from('anxiety_journal_entries')
        .insert([{
          user_id: user.id,
          anxiety_level: level,
          triggers: [],
          physical_symptoms: [],
          thoughts: 'Quick anxiety level update',
          coping_strategies: [],
          mood_after: level
        }]);

      if (error) throw error;
      toast.success(`Anxiety level updated: ${level}/10`);
      
    } catch (error) {
      console.error('Error updating anxiety level:', error);
      toast.error('Failed to update anxiety level');
    }
  }, []);

  // Add a new session
  const addSession = useCallback(async (
    type: 'breathing' | 'meditation' | 'journal' | 'cbt' | 'panic_relief',
    technique: string,
    duration: number,
    anxietyBefore?: number,
    anxietyAfter?: number,
    notes?: string
  ) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const sessionData = {
        user_id: user.id,
        session_type: type,
        technique_used: technique,
        duration_minutes: duration,
        anxiety_before: anxietyBefore || anxietyLevel,
        anxiety_after: anxietyAfter,
        notes
      };

      const { data, error } = await supabase
        .from('anxiety_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;

      setTodaysSessions(prev => [data, ...prev]);
      toast.success(`${technique} session completed!`);
      
      return data;
    } catch (error) {
      console.error('Error adding session:', error);
      toast.error('Failed to save session');
    }
  }, [anxietyLevel]);

  // Add journal entry
  const addJournalEntry = useCallback(async (entry: Omit<AnxietyJournalEntry, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('anxiety_journal_entries')
        .insert([{ ...entry, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setJournalEntries(prev => [data, ...prev]);
      toast.success('Journal entry saved');
      
      return data;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      toast.error('Failed to save journal entry');
    }
  }, []);

  // Add CBT worksheet
  const addCBTWorksheet = useCallback(async (worksheet: Omit<CBTWorksheet, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('cbt_worksheets')
        .insert([{ ...worksheet, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setCbtWorksheets(prev => [data, ...prev]);
      toast.success('CBT worksheet saved');
      
      return data;
    } catch (error) {
      console.error('Error adding CBT worksheet:', error);
      toast.error('Failed to save worksheet');
    }
  }, []);

  // Get anxiety insights
  const getAnxietyInsights = useCallback(() => {
    if (!weeklyProgress) return [];

    const insights = [];

    if (weeklyProgress.improvementTrend > 0) {
      insights.push({
        type: 'positive',
        message: `Your anxiety has improved by ${weeklyProgress.improvementTrend.toFixed(1)} points this week!`,
        suggestion: 'Keep up the great work with your current techniques.'
      });
    }

    if (weeklyProgress.sessionsToday === 0) {
      insights.push({
        type: 'suggestion',
        message: 'You haven\'t done any anxiety exercises today.',
        suggestion: 'Try a quick breathing exercise to start your day mindfully.'
      });
    }

    if (weeklyProgress.mostEffectiveTechnique) {
      insights.push({
        type: 'info',
        message: `Your most used technique this week is ${weeklyProgress.mostEffectiveTechnique}.`,
        suggestion: 'Consider exploring other techniques to build a diverse toolkit.'
      });
    }

    return insights;
  }, [weeklyProgress]);

  useEffect(() => {
    fetchAnxietyData();
  }, [fetchAnxietyData]);

  return {
    // State
    anxietyLevel,
    todaysSessions,
    weeklyProgress,
    journalEntries,
    cbtWorksheets,
    isLoading,

    // Actions
    updateAnxietyLevel,
    addSession,
    addJournalEntry,
    addCBTWorksheet,
    
    // Utilities
    getAnxietyInsights,
    refreshData: fetchAnxietyData
  };
};