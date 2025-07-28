import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface DailyGoal {
  id: string;
  text: string;
  completed: boolean;
  type: 'base' | 'ai' | 'general' | 'custom' | 'addiction';
  priority?: 'high' | 'medium' | 'low';
  pointsValue: number;
  isCustom?: boolean;
  createdAt?: string;
  addictionId?: string;
  addictionName?: string;
  addictionCategory?: string;
}

export const useDailyReset = () => {
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);
  const [customGoals, setCustomGoals] = useState<DailyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has done video chat today
  const hasVideoChattedToday = useCallback(() => {
    try {
      const today = new Date().toDateString();
      const savedMessages = localStorage.getItem(`video_chat_messages_${today}`);
      if (savedMessages) {
        const messages = JSON.parse(savedMessages);
        return messages.some((msg: any) => msg.role === 'user');
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

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
      localStorage.removeItem(`completedSteps_${today}`);
      
      // Also clear yesterday's data to prevent conflicts
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      localStorage.removeItem(`completedGoals_${yesterdayStr}`);
      localStorage.removeItem(`goalPointsMap_${yesterdayStr}`);
      localStorage.removeItem(`hasShownFeelBetterToday_${yesterdayStr}`);
      localStorage.removeItem(`allGoalsFinished_${yesterdayStr}`);
      localStorage.removeItem(`completedSteps_${yesterdayStr}`);

      console.log('✅ Daily goal states cleared');

      // 4. Update chat date tracker
      localStorage.setItem('lastChatDate', today);
      console.log('✅ Chat date tracker updated');

      // 5. Update login history for streak tracking
      updateLoginHistory(user.id);

      // 6. Load custom goals that should persist
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

  // Update login history for streak tracking
  const updateLoginHistory = (userId: string) => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get stored login history
      let loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
      
      // Add today to login history if not already present
      if (!loginHistory.includes(todayStr)) {
        loginHistory.push(todayStr);
        localStorage.setItem('loginHistory', JSON.stringify(loginHistory));
        console.log('✅ Login history updated with today:', todayStr);
      }
    } catch (error) {
      console.error('Error updating login history:', error);
    }
  };

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

  // Generate addiction-specific daily goals
  const generateAddictionGoals = useCallback((userAddictions: any[]) => {
    if (!userAddictions || userAddictions.length === 0) return [];

    const addictionGoals: DailyGoal[] = [];

    userAddictions.forEach((addiction, index) => {
      const daysClean = addiction.days_clean || 0;
      const addictionName = addiction.addiction_type?.name || 'Addiction';
      const category = addiction.addiction_type?.category || 'substance';

      // Generate goals based on recovery stage and addiction type
      let goals: Omit<DailyGoal, 'addictionId' | 'addictionName' | 'addictionCategory'>[] = [];

      if (daysClean < 7) {
        // Early recovery goals (0-7 days)
        goals = [
          {
            id: `addiction_${addiction.id}_affirmation`,
            text: 'Start day with recovery affirmation',
            completed: false,
            type: 'addiction',
            pointsValue: 8,
            priority: 'high'
          },
          {
            id: `addiction_${addiction.id}_hydration`,
            text: 'Drink water to support healing',
            completed: false,
            type: 'addiction',
            pointsValue: 5,
            priority: 'medium'
          },
          {
            id: `addiction_${addiction.id}_support_check`,
            text: 'Connect with support person',
            completed: false,
            type: 'addiction',
            pointsValue: 10,
            priority: 'high'
          }
        ];
      } else if (daysClean < 30) {
        // Building habits (7-30 days)
        goals = [
          {
            id: `addiction_${addiction.id}_morning_routine`,
            text: 'Complete healthy morning routine',
            completed: false,
            type: 'addiction',
            pointsValue: 7,
            priority: 'high'
          },
          {
            id: `addiction_${addiction.id}_trigger_awareness`,
            text: 'Identify and manage triggers',
            completed: false,
            type: 'addiction',
            pointsValue: 8,
            priority: 'high'
          },
          {
            id: `addiction_${addiction.id}_physical_activity`,
            text: 'Engage in physical exercise',
            completed: false,
            type: 'addiction',
            pointsValue: 6,
            priority: 'medium'
          },
          {
            id: `addiction_${addiction.id}_gratitude`,
            text: 'Practice gratitude for recovery',
            completed: false,
            type: 'addiction',
            pointsValue: 5,
            priority: 'medium'
          }
        ];
      } else {
        // Established recovery (30+ days)
        goals = [
          {
            id: `addiction_${addiction.id}_mindfulness`,
            text: 'Practice mindfulness meditation',
            completed: false,
            type: 'addiction',
            pointsValue: 7,
            priority: 'high'
          },
          {
            id: `addiction_${addiction.id}_help_others`,
            text: 'Support someone else in recovery',
            completed: false,
            type: 'addiction',
            pointsValue: 10,
            priority: 'medium'
          },
          {
            id: `addiction_${addiction.id}_skill_building`,
            text: 'Learn new healthy coping skill',
            completed: false,
            type: 'addiction',
            pointsValue: 8,
            priority: 'medium'
          },
          {
            id: `addiction_${addiction.id}_reflection`,
            text: 'Reflect on recovery progress',
            completed: false,
            type: 'addiction',
            pointsValue: 6,
            priority: 'low'
          }
        ];
      }

      // Add addiction-specific information to each goal
      const enrichedGoals = goals.map(goal => ({
        ...goal,
        addictionId: addiction.id,
        addictionName,
        addictionCategory: category
      }));

      addictionGoals.push(...enrichedGoals);
    });

    return addictionGoals;
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
    triggerManualReset,
    generateAddictionGoals
  };
};