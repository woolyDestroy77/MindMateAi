import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface DailyGoal {
  id: string;
  text: string;
  completed: boolean;
  type: 'base' | 'ai' | 'general' | 'custom';
  priority?: 'high' | 'medium' | 'low';
  pointsValue: number;
  isCustom?: boolean;
  createdAt?: string;
}

export const useDailyReset = () => {
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);
  const [customGoals, setCustomGoals] = useState<DailyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if we need to reset daily data
  const checkForDailyReset = useCallback(async () => {
    try {
      const today = new Date().toDateString();
      const savedResetDate = localStorage.getItem('lastResetDate');
      
      console.log('🔄 Checking for daily reset:', { today, savedResetDate });
      
      if (savedResetDate !== today) {
        console.log('🆕 Performing daily reset...');
        await performDailyReset();
        localStorage.setItem('lastResetDate', today);
        setLastResetDate(today);
      } else {
        setLastResetDate(savedResetDate);
      }
    } catch (error) {
      console.error('Error checking for daily reset:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Perform the actual daily reset
  const performDailyReset = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      console.log('🔄 Performing comprehensive daily reset for user:', user.id);

      // 1. Reset mood to default state
      const { error: moodResetError } = await supabase
        .from('user_mood_data')
        .upsert([{
          user_id: user.id,
          current_mood: '😌',
          mood_name: 'calm',
          mood_interpretation: 'Welcome to a new day! Share your current mood to start tracking your wellness journey.',
          wellness_score: 75, // Reset to default
          sentiment: 'neutral',
          last_message: null,
          ai_response: null,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'user_id'
        });

      if (moodResetError) {
        console.error('Error resetting mood data:', moodResetError);
      } else {
        console.log('✅ Mood data reset to default state');
      }

      // 2. Reset chat history for new day
      const { error: chatResetError } = await supabase
        .from("dappier_chat_history")
        .delete()
        .eq("user_id", user.id);

      if (chatResetError) {
        console.error('Error resetting chat history:', chatResetError);
      } else {
        console.log('✅ Chat history cleared for new day');
      }

      // 3. Clear daily goal completion state
      const today = new Date().toDateString();
      localStorage.removeItem(`completedGoals_${today}`);
      localStorage.removeItem(`goalPointsMap_${today}`);
      localStorage.removeItem(`hasShownFeelBetterToday_${today}`);
      localStorage.removeItem(`allGoalsFinished_${today}`);
      
      // Also clear yesterday's data to prevent conflicts
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      localStorage.removeItem(`completedGoals_${yesterdayStr}`);
      localStorage.removeItem(`goalPointsMap_${yesterdayStr}`);
      localStorage.removeItem(`hasShownFeelBetterToday_${yesterdayStr}`);
      localStorage.removeItem(`allGoalsFinished_${yesterdayStr}`);

      console.log('✅ Daily goal states cleared');

      // 4. Update chat date tracker
      localStorage.setItem('lastChatDate', today);
      console.log('✅ Chat date tracker updated');

      // 5. Load custom goals that should persist
      await loadCustomGoals();

      console.log('✅ Comprehensive daily reset completed successfully');
      toast.success('🌅 New day, fresh start! Your mood, chat, and daily goals have been reset.', {
        duration: 5000,
        icon: '🆕'
      });

    } catch (error) {
      console.error('Error performing daily reset:', error);
      toast.error('Failed to perform daily reset');
    }
  }, []);

  // Load custom goals from database
  const loadCustomGoals = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // For now, we'll store custom goals in localStorage
      // In a production app, you'd want to store these in the database
      const savedCustomGoals = localStorage.getItem(`customGoals_${user.id}`);
      if (savedCustomGoals) {
        try {
          const goals = JSON.parse(savedCustomGoals);
          setCustomGoals(goals);
        } catch (error) {
          console.error('Error parsing custom goals:', error);
          setCustomGoals([]);
        }
      }
    } catch (error) {
      console.error('Error loading custom goals:', error);
    }
  }, []);

  // Add a new custom goal
  const addCustomGoal = useCallback(async (goalText: string, pointsValue: number = 5) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const newGoal: DailyGoal = {
        id: `custom-${Date.now()}`,
        text: goalText,
        completed: false,
        type: 'custom',
        priority: 'medium',
        pointsValue,
        isCustom: true,
        createdAt: new Date().toISOString()
      };

      const updatedGoals = [...customGoals, newGoal];
      setCustomGoals(updatedGoals);
      
      // Save to localStorage
      localStorage.setItem(`customGoals_${user.id}`, JSON.stringify(updatedGoals));
      
      toast.success(`✅ Custom goal added: "${goalText}"`, {
        duration: 3000,
        icon: '🎯'
      });

      return newGoal;
    } catch (error) {
      console.error('Error adding custom goal:', error);
      toast.error('Failed to add custom goal');
      throw error;
    }
  }, [customGoals]);

  // Remove a custom goal
  const removeCustomGoal = useCallback(async (goalId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const updatedGoals = customGoals.filter(goal => goal.id !== goalId);
      setCustomGoals(updatedGoals);
      
      // Save to localStorage
      localStorage.setItem(`customGoals_${user.id}`, JSON.stringify(updatedGoals));
      
      toast.success('Custom goal removed', {
        duration: 2000,
        icon: '🗑️'
      });
    } catch (error) {
      console.error('Error removing custom goal:', error);
      toast.error('Failed to remove custom goal');
    }
  }, [customGoals]);

  // Manual reset function for testing
  const triggerManualReset = useCallback(async () => {
    try {
      console.log('🔄 Manual reset triggered');
      await performDailyReset();
      
      // Update the reset date to today
      const today = new Date().toDateString();
      localStorage.setItem('lastResetDate', today);
      setLastResetDate(today);
      
      toast.success('🔄 Manual reset complete! Everything has been refreshed.', {
        duration: 4000,
        icon: '🆕'
      });
    } catch (error) {
      console.error('Error in manual reset:', error);
      toast.error('Failed to perform manual reset');
    }
  }, [performDailyReset]);

  // Initialize on mount
  useEffect(() => {
    checkForDailyReset();
    loadCustomGoals();
  }, [checkForDailyReset, loadCustomGoals]);

  return {
    lastResetDate,
    customGoals,
    isLoading,
    addCustomGoal,
    removeCustomGoal,
    checkForDailyReset,
    performDailyReset,
    triggerManualReset
  };
};