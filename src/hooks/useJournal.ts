import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  sentiment: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  metadata?: {
    location?: string;
    weather?: string;
    energy_level?: number;
    sleep_hours?: number;
    activities?: string[];
    [key: string]: any;
  };
}

export interface JournalStats {
  totalEntries: number;
  wordCount: number;
  averageWordsPerEntry: number;
  mostUsedTags: {tag: string, count: number}[];
  moodDistribution: {mood: string, count: number}[];
  streakDays: number;
  longestStreak: number;
}

export const useJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<JournalStats>({
    totalEntries: 0,
    wordCount: 0,
    averageWordsPerEntry: 0,
    mostUsedTags: [],
    moodDistribution: [],
    streakDays: 0,
    longestStreak: 0
  });

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
      calculateStats(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch journal entries';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateStats = (journalEntries: JournalEntry[]) => {
    if (journalEntries.length === 0) {
      setStats({
        totalEntries: 0,
        wordCount: 0,
        averageWordsPerEntry: 0,
        mostUsedTags: [],
        moodDistribution: [],
        streakDays: 0,
        longestStreak: 0
      });
      return;
    }

    // Calculate total word count
    const totalWords = journalEntries.reduce((sum, entry) => {
      const words = entry.content.trim() === '' ? 0 : entry.content.trim().split(/\s+/).length;
      return sum + words;
    }, 0);

    // Calculate mood distribution
    const moodCounts: Record<string, number> = {};
    journalEntries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    const moodDistribution = Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate most used tags
    const tagCounts: Record<string, number> = {};
    journalEntries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const mostUsedTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate streak
    const dateEntries = new Set<string>();
    journalEntries.forEach(entry => {
      const date = new Date(entry.created_at).toISOString().split('T')[0];
      dateEntries.add(date);
    });

    let currentStreak = 0;
    let longestStreak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    // Check for current streak
    while (dateEntries.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Find longest streak
    const dates = Array.from(dateEntries).sort();
    let streak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i-1]);
      const currDate = new Date(dates[i]);
      
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, streak);

    setStats({
      totalEntries: journalEntries.length,
      wordCount: totalWords,
      averageWordsPerEntry: Math.round(totalWords / journalEntries.length),
      mostUsedTags,
      moodDistribution,
      streakDays: currentStreak,
      longestStreak
    });
  };

  const addEntry = async (content: string, mood: string, tags: string[] = [], metadata: any = {}) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Analyze sentiment using a simple approach
      // In a real app, you might use an AI service for this
      const sentiment = analyzeSentiment(content, mood);

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([
          {
            content,
            mood,
            tags,
            metadata,
            user_id: user.id,
            sentiment,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [data, ...prev]);
      calculateStats([data, ...entries]);
      toast.success('Journal entry added successfully');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add journal entry';
      toast.error(message);
      throw err;
    }
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    try {
      // If content is updated, recalculate sentiment
      if (updates.content) {
        updates.sentiment = analyzeSentiment(updates.content, updates.mood || '');
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => prev.map(entry => entry.id === id ? data : entry));
      calculateStats(entries.map(entry => entry.id === id ? data : entry));
      toast.success('Journal entry updated successfully');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update journal entry';
      toast.error(message);
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedEntries = entries.filter(entry => entry.id !== id);
      setEntries(updatedEntries);
      calculateStats(updatedEntries);
      toast.success('Journal entry deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete journal entry';
      toast.error(message);
      throw err;
    }
  };

  // Simple sentiment analysis function
  const analyzeSentiment = (content: string, mood: string): string => {
    const text = content.toLowerCase();
    
    // Happy moods
    const happyMoods = ['😊', '🥰', '🤩', '😎', '🥳'];
    // Sad/negative moods
    const sadMoods = ['😕', '😢', '😠', '😤', '😰', '😓'];
    
    // Positive words
    const positiveWords = [
      'happy', 'joy', 'excited', 'great', 'good', 'wonderful', 'amazing', 'love',
      'grateful', 'thankful', 'appreciate', 'blessed', 'success', 'accomplished',
      'proud', 'peaceful', 'calm', 'relaxed', 'hope', 'positive'
    ];
    
    // Negative words
    const negativeWords = [
      'sad', 'angry', 'upset', 'frustrated', 'anxious', 'worried', 'stress',
      'depressed', 'unhappy', 'hate', 'terrible', 'awful', 'horrible', 'bad',
      'disappointed', 'hurt', 'pain', 'fear', 'tired', 'exhausted', 'sick'
    ];
    
    // Count occurrences
    let positiveCount = 0;
    let negativeCount = 0;
    
    // Check for positive words
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) positiveCount += matches.length;
    });
    
    // Check for negative words
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) negativeCount += matches.length;
    });
    
    // Add mood bias
    if (happyMoods.includes(mood)) positiveCount += 2;
    if (sadMoods.includes(mood)) negativeCount += 2;
    
    // Determine sentiment
    if (positiveCount > negativeCount) {
      return 'POSITIVE';
    } else if (negativeCount > positiveCount) {
      return 'NEGATIVE';
    } else {
      return 'NEUTRAL';
    }
  };

  const getJournalInsights = useCallback(() => {
    if (entries.length === 0) return [];

    const insights = [];
    
    // Most common mood
    if (stats.moodDistribution.length > 0) {
      const topMood = stats.moodDistribution[0];
      insights.push({
        type: 'mood',
        title: `Your most common mood is ${topMood.mood}`,
        description: `You've recorded this mood ${topMood.count} times in your journal.`,
        icon: topMood.mood
      });
    }
    
    // Writing consistency
    if (stats.streakDays > 1) {
      insights.push({
        type: 'streak',
        title: `${stats.streakDays}-day writing streak!`,
        description: 'Consistent journaling helps build self-awareness and emotional regulation.',
        icon: '🔥'
      });
    }
    
    // Word count achievement
    if (stats.wordCount > 1000) {
      insights.push({
        type: 'achievement',
        title: `You've written ${stats.wordCount} words!`,
        description: 'That\'s approximately ' + Math.round(stats.wordCount / 250) + ' pages of self-reflection.',
        icon: '📝'
      });
    }
    
    // Common themes
    if (stats.mostUsedTags.length > 0) {
      insights.push({
        type: 'themes',
        title: 'Common themes in your journal',
        description: `Your most used tags are: ${stats.mostUsedTags.slice(0, 3).map(t => t.tag).join(', ')}`,
        icon: '🏷️'
      });
    }
    
    // Emotional patterns
    const positiveEntries = entries.filter(e => e.sentiment === 'POSITIVE').length;
    const negativeEntries = entries.filter(e => e.sentiment === 'NEGATIVE').length;
    const neutralEntries = entries.filter(e => e.sentiment === 'NEUTRAL').length;
    
    const total = entries.length;
    const positivePercentage = Math.round((positiveEntries / total) * 100);
    const negativePercentage = Math.round((negativeEntries / total) * 100);
    
    if (positivePercentage > 60) {
      insights.push({
        type: 'sentiment',
        title: `${positivePercentage}% positive entries`,
        description: 'Your journal reflects an overall positive outlook on life.',
        icon: '😊'
      });
    } else if (negativePercentage > 60) {
      insights.push({
        type: 'sentiment',
        title: `${negativePercentage}% negative entries`,
        description: 'Your journal shows you may be going through some challenges.',
        icon: '💙'
      });
    } else {
      insights.push({
        type: 'sentiment',
        title: 'Balanced emotional expression',
        description: 'Your journal contains a mix of positive, negative, and neutral entries.',
        icon: '⚖️'
      });
    }
    
    return insights;
  }, [entries, stats]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    stats,
    isLoading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshEntries: fetchEntries,
    getJournalInsights
  };
};