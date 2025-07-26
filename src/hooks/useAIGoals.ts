import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface AIGoal {
  id: string;
  text: string;
  type: 'mental_health' | 'physical_wellness' | 'social_connection' | 'self_care' | 'recovery' | 'anxiety_management';
  priority: 'high' | 'medium' | 'low';
  pointsValue: number;
  reasoning: string;
  category: string;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
}

export interface UserMentalHealthProfile {
  currentMood: string;
  moodName: string;
  wellnessScore: number;
  sentiment: string;
  recentAnxietyLevel?: number;
  hasAddictions: boolean;
  addictionTypes: string[];
  daysClean: number;
  recentJournalEntries: number;
  lastChatDate: string;
  stressLevel: number;
  sleepQuality: number;
  socialConnections: number;
  exerciseFrequency: number;
  predominantChallenges: string[];
  strengths: string[];
  goals: string[];
  triggers: string[];
}

export const useAIGoals = () => {
  const [aiGoals, setAiGoals] = useState<AIGoal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userProfile, setUserProfile] = useState<UserMentalHealthProfile | null>(null);

  // Generate user mental health profile
  const generateUserProfile = useCallback(async (): Promise<UserMentalHealthProfile | null> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return null;

      // Get mood data
      const { data: moodData } = await supabase
        .from('user_mood_data')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      // Get addiction data
      const { data: addictionData } = await supabase
        .from('user_addictions')
        .select(`
          *,
          addiction_type:addiction_types(name, category)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Get recent journal entries
      const { data: journalData } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Get recent anxiety data
      const { data: anxietyData } = await supabase
        .from('anxiety_journal_entries')
        .select('anxiety_level')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent chat activity
      const { data: chatData } = await supabase
        .from('dappier_chat_history')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Build profile
      const profile: UserMentalHealthProfile = {
        currentMood: moodData?.current_mood || '😐',
        moodName: moodData?.mood_name || 'neutral',
        wellnessScore: moodData?.wellness_score || 50,
        sentiment: moodData?.sentiment || 'neutral',
        recentAnxietyLevel: anxietyData && anxietyData.length > 0 
          ? anxietyData.reduce((sum, entry) => sum + entry.anxiety_level, 0) / anxietyData.length 
          : undefined,
        hasAddictions: (addictionData?.length || 0) > 0,
        addictionTypes: addictionData?.map(a => a.addiction_type?.name || 'Unknown') || [],
        daysClean: addictionData?.[0]?.days_clean || 0,
        recentJournalEntries: journalData?.length || 0,
        lastChatDate: chatData?.[0]?.created_at || '',
        stressLevel: moodData?.sentiment === 'negative' ? 7 : moodData?.sentiment === 'positive' ? 3 : 5,
        sleepQuality: 7, // Default - could be enhanced with sleep tracking
        socialConnections: 5, // Default - could be enhanced with social tracking
        exerciseFrequency: 3, // Default - could be enhanced with activity tracking
        predominantChallenges: extractChallenges(moodData, anxietyData, addictionData),
        strengths: extractStrengths(moodData, addictionData, journalData),
        goals: [], // Could be extracted from journal entries
        triggers: addictionData?.[0]?.personal_triggers || []
      };

      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error generating user profile:', error);
      return null;
    }
  }, []);

  // AI goal generation based on user profile
  const generateAIGoals = useCallback(async (profile: UserMentalHealthProfile): Promise<AIGoal[]> => {
    const goals: AIGoal[] = [];
    const today = new Date().toDateString();

    // Mental Health Goals
    if (profile.wellnessScore < 60) {
      goals.push({
        id: `ai_mood_boost_${Date.now()}`,
        text: 'Practice 5 minutes of mindful breathing',
        type: 'mental_health',
        priority: 'high',
        pointsValue: 8,
        reasoning: `Your wellness score is ${profile.wellnessScore}. Mindful breathing can help improve mood and reduce stress.`,
        category: 'Mood Enhancement',
        estimatedTime: '5 min',
        difficulty: 'easy',
        completed: false
      });
    }

    if (profile.sentiment === 'negative') {
      goals.push({
        id: `ai_gratitude_${Date.now()}`,
        text: 'Write down 3 things you\'re grateful for today',
        type: 'mental_health',
        priority: 'medium',
        pointsValue: 6,
        reasoning: 'Recent sentiment analysis shows negative patterns. Gratitude practice can help shift perspective.',
        category: 'Positive Psychology',
        estimatedTime: '3 min',
        difficulty: 'easy',
        completed: false
      });
    }

    // Anxiety Management Goals
    if (profile.recentAnxietyLevel && profile.recentAnxietyLevel > 6) {
      goals.push({
        id: `ai_anxiety_relief_${Date.now()}`,
        text: 'Complete a 10-minute guided meditation',
        type: 'anxiety_management',
        priority: 'high',
        pointsValue: 10,
        reasoning: `Your recent anxiety level is ${profile.recentAnxietyLevel.toFixed(1)}/10. Meditation can help reduce anxiety symptoms.`,
        category: 'Anxiety Relief',
        estimatedTime: '10 min',
        difficulty: 'medium',
        completed: false
      });

      goals.push({
        id: `ai_grounding_${Date.now()}`,
        text: 'Practice the 5-4-3-2-1 grounding technique',
        type: 'anxiety_management',
        priority: 'medium',
        pointsValue: 7,
        reasoning: 'Grounding techniques are effective for managing high anxiety levels.',
        category: 'Coping Skills',
        estimatedTime: '5 min',
        difficulty: 'easy',
        completed: false
      });
    }

    // Recovery Goals
    if (profile.hasAddictions) {
      goals.push({
        id: `ai_recovery_check_${Date.now()}`,
        text: 'Check in with your support network',
        type: 'recovery',
        priority: 'high',
        pointsValue: 12,
        reasoning: `You're on day ${profile.daysClean} of recovery. Regular support contact is crucial for maintaining sobriety.`,
        category: 'Recovery Support',
        estimatedTime: '10 min',
        difficulty: 'medium',
        completed: false
      });

      if (profile.triggers.length > 0) {
        goals.push({
          id: `ai_trigger_plan_${Date.now()}`,
          text: 'Review and update your trigger management plan',
          type: 'recovery',
          priority: 'medium',
          pointsValue: 8,
          reasoning: 'You have identified triggers. Regular review helps maintain awareness and coping strategies.',
          category: 'Trigger Management',
          estimatedTime: '8 min',
          difficulty: 'medium',
          completed: false
        });
      }
    }

    // Physical Wellness Goals
    if (profile.wellnessScore < 70) {
      goals.push({
        id: `ai_physical_activity_${Date.now()}`,
        text: 'Take a 15-minute walk outdoors',
        type: 'physical_wellness',
        priority: 'medium',
        pointsValue: 7,
        reasoning: 'Physical activity releases endorphins and can significantly improve mood and wellness scores.',
        category: 'Physical Health',
        estimatedTime: '15 min',
        difficulty: 'easy',
        completed: false
      });
    }

    // Social Connection Goals
    if (profile.sentiment === 'negative' || profile.wellnessScore < 60) {
      goals.push({
        id: `ai_social_connection_${Date.now()}`,
        text: 'Reach out to a friend or family member',
        type: 'social_connection',
        priority: 'medium',
        pointsValue: 9,
        reasoning: 'Social connections are vital for mental health, especially during challenging times.',
        category: 'Social Support',
        estimatedTime: '10 min',
        difficulty: 'medium',
        completed: false
      });
    }

    // Self-Care Goals
    if (profile.stressLevel > 6) {
      goals.push({
        id: `ai_selfcare_${Date.now()}`,
        text: 'Do something kind for yourself today',
        type: 'self_care',
        priority: 'medium',
        pointsValue: 6,
        reasoning: 'High stress levels indicate a need for self-compassion and self-care activities.',
        category: 'Self-Compassion',
        estimatedTime: '20 min',
        difficulty: 'easy',
        completed: false
      });
    }

    // Journaling Goals
    if (profile.recentJournalEntries < 3) {
      goals.push({
        id: `ai_journaling_${Date.now()}`,
        text: 'Write a brief journal entry about your day',
        type: 'mental_health',
        priority: 'medium',
        pointsValue: 8,
        reasoning: 'Regular journaling helps process emotions and track mental health patterns.',
        category: 'Emotional Processing',
        estimatedTime: '10 min',
        difficulty: 'easy',
        completed: false
      });
    }

    // Mood-specific goals
    if (profile.moodName === 'anxious' || profile.moodName === 'worried') {
      goals.push({
        id: `ai_worry_time_${Date.now()}`,
        text: 'Set aside 10 minutes of "worry time" to process concerns',
        type: 'anxiety_management',
        priority: 'medium',
        pointsValue: 7,
        reasoning: 'Scheduled worry time can help contain anxious thoughts and prevent rumination.',
        category: 'Anxiety Management',
        estimatedTime: '10 min',
        difficulty: 'medium',
        completed: false
      });
    }

    if (profile.moodName === 'sad' || profile.moodName === 'depressed') {
      goals.push({
        id: `ai_mood_lift_${Date.now()}`,
        text: 'Listen to uplifting music or watch something funny',
        type: 'mental_health',
        priority: 'medium',
        pointsValue: 5,
        reasoning: 'Engaging with positive media can help lift mood and provide emotional relief.',
        category: 'Mood Enhancement',
        estimatedTime: '15 min',
        difficulty: 'easy',
        completed: false
      });
    }

    // Limit to 5-7 goals to avoid overwhelming the user
    return goals.slice(0, 6);
  }, []);

  // Generate daily AI goals
  const generateDailyAIGoals = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      // Check if we've already generated goals today
      const today = new Date().toDateString();
      const lastGenerationDate = localStorage.getItem('ai_goals_last_generated');
      
      if (lastGenerationDate === today) {
        // Load existing goals from localStorage
        const savedGoals = localStorage.getItem(`ai_goals_${today}`);
        if (savedGoals) {
          setAiGoals(JSON.parse(savedGoals));
          return;
        }
      }

      // Generate user profile
      const profile = await generateUserProfile();
      if (!profile) {
        console.error('Could not generate user profile');
        return;
      }

      // Generate AI goals based on profile
      const newGoals = await generateAIGoals(profile);
      
      // Save goals to localStorage
      localStorage.setItem(`ai_goals_${today}`, JSON.stringify(newGoals));
      localStorage.setItem('ai_goals_last_generated', today);
      
      setAiGoals(newGoals);
      
      toast.success(`🤖 AI generated ${newGoals.length} personalized goals for you today!`, {
        duration: 4000,
        icon: '🎯'
      });

    } catch (error) {
      console.error('Error generating AI goals:', error);
      toast.error('Failed to generate AI goals');
    } finally {
      setIsGenerating(false);
    }
  }, [generateUserProfile, generateAIGoals]);

  // Load existing goals on mount
  useEffect(() => {
    const today = new Date().toDateString();
    const savedGoals = localStorage.getItem(`ai_goals_${today}`);
    if (savedGoals) {
      try {
        setAiGoals(JSON.parse(savedGoals));
      } catch (error) {
        console.error('Error loading saved AI goals:', error);
      }
    }
  }, []);

  // Mark goal as completed
  const completeAIGoal = useCallback((goalId: string) => {
    setAiGoals(prev => {
      const updated = prev.map(goal => 
        goal.id === goalId ? { ...goal, completed: true } : goal
      );
      
      // Save to localStorage
      const today = new Date().toDateString();
      localStorage.setItem(`ai_goals_${today}`, JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  // Remove AI goal
  const removeAIGoal = useCallback((goalId: string) => {
    setAiGoals(prev => {
      const updated = prev.filter(goal => goal.id !== goalId);
      
      // Save to localStorage
      const today = new Date().toDateString();
      localStorage.setItem(`ai_goals_${today}`, JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  return {
    aiGoals,
    userProfile,
    isGenerating,
    generateDailyAIGoals,
    completeAIGoal,
    removeAIGoal,
    generateUserProfile
  };
};

// Helper functions
function extractChallenges(moodData: any, anxietyData: any[], addictionData: any[]): string[] {
  const challenges: string[] = [];
  
  if (moodData?.sentiment === 'negative') challenges.push('Negative mood patterns');
  if (moodData?.wellness_score < 50) challenges.push('Low wellness score');
  if (anxietyData && anxietyData.length > 0) {
    const avgAnxiety = anxietyData.reduce((sum, entry) => sum + entry.anxiety_level, 0) / anxietyData.length;
    if (avgAnxiety > 6) challenges.push('High anxiety levels');
  }
  if (addictionData && addictionData.length > 0) challenges.push('Addiction recovery');
  
  return challenges;
}

function extractStrengths(moodData: any, addictionData: any[], journalData: any[]): string[] {
  const strengths: string[] = [];
  
  if (moodData?.wellness_score > 70) strengths.push('Good emotional regulation');
  if (moodData?.sentiment === 'positive') strengths.push('Positive outlook');
  if (addictionData && addictionData.length > 0 && addictionData[0].days_clean > 7) {
    strengths.push('Strong recovery commitment');
  }
  if (journalData && journalData.length > 3) strengths.push('Consistent self-reflection');
  
  return strengths;
}