import { useState, useEffect } from 'react';
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
}

export const useJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch journal entries';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (content: string, mood: string, tags: string[] = []) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([
          {
            content,
            mood,
            tags,
            user_id: user.id,
            sentiment: 'neutral', // You can implement sentiment analysis later
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [data, ...prev]);
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
      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => prev.map(entry => entry.id === id ? data : entry));
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

      setEntries(prev => prev.filter(entry => entry.id !== id));
      toast.success('Journal entry deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete journal entry';
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return {
    entries,
    isLoading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshEntries: fetchEntries,
  };
};