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
  const [needsDailyChat, setNeedsDailyChat] = useState(false);

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
        .gte('created_at', new Date().toISOString().split('T')[0]) // Today's chats only
        .order('created_at', { ascending: false });

      // Check if user has chatted today
      const hasChatToday = chatData && chatData.length > 0;
      
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
        lastChatDate: hasChatToday ? chatData[0].created_at : '',
        stressLevel: moodData?.sentiment === 'negative' ? 7 : moodData?.sentiment === 'positive' ? 3 : 5,
        sleepQuality: 7, // Default - could be enhanced with sleep tracking
        socialConnections: 5, // Default - could be enhanced with social tracking
        exerciseFrequency: 3, // Default - could be enhanced with activity tracking
        predominantChallenges: extractChallenges(moodData, anxietyData, addictionData),
        strengths: extractStrengths(moodData, addictionData, journalData),
        goals: [], // Could be extracted from journal entries
        triggers: addictionData?.[0]?.personal_triggers || []
      };

      // Set if user needs to chat today
      setNeedsDailyChat(!hasChatToday);
      
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error generating user profile:', error);
      return null;
    }
  }, []);

  // AI goal generation based on user profile
  const generateAIGoals = useCallback(async (profile: UserMentalHealthProfile): Promise<AIGoal[]> => {
    // If user hasn't chatted today, return a single goal to start daily chat
    if (!profile.lastChatDate) {
      return [{
        id: `ai_daily_chat_${Date.now()}`,
        text: 'Start your daily wellness chat to unlock personalized goals',
        type: 'mental_health',
        priority: 'high',
        pointsValue: 10,
        reasoning: 'I need to analyze your current mood and feelings through our daily conversation to generate personalized goals that match your emotional state today.',
        category: 'Mood Assessment',
        estimatedTime: '5-10 min',
        difficulty: 'easy',
        completed: false
      }];
    }

    const goals: AIGoal[] = [];

    // Generate goals based on current mood and sentiment from today's chat
    const currentMood = profile.moodName.toLowerCase();
    const sentiment = profile.sentiment.toLowerCase();
    const wellnessScore = profile.wellnessScore;

    // Mood-specific goal generation
    if (currentMood === 'sad' || currentMood === 'depressed' || sentiment === 'negative') {
      goals.push({
        id: `ai_mood_lift_${Date.now()}`,
        text: 'Practice gratitude - write 3 things you\'re thankful for',
        type: 'mental_health',
        priority: 'high',
        pointsValue: 8,
        reasoning: `Your current mood is ${currentMood} with ${sentiment} sentiment. Gratitude practice can help shift your perspective and improve mood naturally.`,
        category: 'Mood Enhancement',
        estimatedTime: '5 min',
        difficulty: 'easy',
        completed: false
      });

      goals.push({
        id: `ai_gentle_activity_${Date.now()}`,
        text: 'Do something gentle and nurturing for yourself',
        type: 'self_care',
        priority: 'medium',
        pointsValue: 6,
        reasoning: 'When feeling down, gentle self-care activities can provide comfort and help you feel more grounded.',
        category: 'Self-Compassion',
        estimatedTime: '15 min',
        difficulty: 'easy',
        completed: false
      });
    }

    if (currentMood === 'anxious' || currentMood === 'worried' || currentMood === 'stressed') {
      goals.push({
        id: `ai_anxiety_relief_${Date.now()}`,
        text: 'Practice 4-7-8 breathing exercise',
        type: 'anxiety_management',
        priority: 'high',
        pointsValue: 8,
        reasoning: `You're feeling ${currentMood} today. The 4-7-8 breathing technique activates your parasympathetic nervous system to reduce anxiety naturally.`,
        category: 'Anxiety Relief',
        estimatedTime: '5 min',
        difficulty: 'easy',
        completed: false
      });

      goals.push({
        id: `ai_grounding_${Date.now()}`,
        text: 'Use the 5-4-3-2-1 grounding technique',
        type: 'anxiety_management',
        priority: 'medium',
        pointsValue: 7,
        reasoning: 'Grounding techniques help bring your attention to the present moment and reduce anxious thoughts.',
        category: 'Mindfulness',
        estimatedTime: '3 min',
        difficulty: 'easy',
        completed: false
      });
    }

    if (currentMood === 'angry' || currentMood === 'frustrated' || currentMood === 'irritated') {
      goals.push({
        id: `ai_anger_management_${Date.now()}`,
        text: 'Take a 10-minute walk to cool down',
        type: 'physical_wellness',
        priority: 'high',
        pointsValue: 8,
        reasoning: `You're feeling ${currentMood}. Physical movement helps process anger and releases tension naturally.`,
        category: 'Emotional Regulation',
        estimatedTime: '10 min',
        difficulty: 'easy',
        completed: false
      });

      goals.push({
        id: `ai_anger_journal_${Date.now()}`,
        text: 'Write about what\'s bothering you',
        type: 'mental_health',
        priority: 'medium',
        pointsValue: 7,
        reasoning: 'Journaling helps process angry feelings and can provide clarity about what\'s really bothering you.',
        category: 'Emotional Processing',
        estimatedTime: '8 min',
        difficulty: 'medium',
        completed: false
      });
    }

    if (currentMood === 'happy' || currentMood === 'excited' || sentiment === 'positive') {
      goals.push({
        id: `ai_positive_momentum_${Date.now()}`,
        text: 'Share your positive energy with someone',
        type: 'social_connection',
        priority: 'medium',
        pointsValue: 8,
        reasoning: `You're feeling ${currentMood} today! Sharing positive emotions strengthens relationships and amplifies good feelings.`,
        category: 'Social Connection',
        estimatedTime: '10 min',
        difficulty: 'easy',
        completed: false
      });

      goals.push({
        id: `ai_gratitude_positive_${Date.now()}`,
        text: 'Reflect on what made you feel good today',
        type: 'mental_health',
        priority: 'low',
        pointsValue: 5,
        reasoning: 'When feeling good, reflecting on positive experiences helps reinforce what brings you joy.',
        category: 'Positive Psychology',
        estimatedTime: '5 min',
        difficulty: 'easy',
        completed: false
      });
    }

    if (currentMood === 'tired' || currentMood === 'exhausted') {
      goals.push({
        id: `ai_rest_recovery_${Date.now()}`,
        text: 'Take a 15-minute power nap or rest',
        type: 'self_care',
        priority: 'high',
        pointsValue: 6,
        reasoning: `You're feeling ${currentMood}. Rest is essential for mental health - your body is telling you what it needs.`,
        category: 'Self-Care',
        estimatedTime: '15 min',
        difficulty: 'easy',
        completed: false
      });

      goals.push({
        id: `ai_gentle_stretch_${Date.now()}`,
        text: 'Do gentle stretches or light movement',
        type: 'physical_wellness',
        priority: 'medium',
        pointsValue: 5,
        reasoning: 'Gentle movement can help boost energy levels without overwhelming your tired body.',
        category: 'Physical Wellness',
        estimatedTime: '5 min',
        difficulty: 'easy',
        completed: false
      });
    }

    if (currentMood === 'calm' || currentMood === 'peaceful') {
      goals.push({
        id: `ai_maintain_calm_${Date.now()}`,
        text: 'Practice mindful meditation to maintain inner peace',
        type: 'mental_health',
        priority: 'medium',
        pointsValue: 7,
        reasoning: `You're feeling ${currentMood} - this is a perfect state for deepening mindfulness and maintaining emotional balance.`,
        category: 'Mindfulness',
        estimatedTime: '10 min',
        difficulty: 'medium',
        completed: false
      });
    }

    // Always add wellness score-based goals
    if (profile.wellnessScore < 60) {
      goals.push({
        id: `ai_wellness_boost_${Date.now()}`,
        text: 'Do one small thing that usually makes you feel better',
        type: 'mental_health',
        priority: 'medium',
        pointsValue: 6,
        reasoning: `Your wellness score is ${profile.wellnessScore}/100. Small positive actions can help improve your overall wellbeing.`,
        category: 'Wellness Boost',
        estimatedTime: '10 min',
        difficulty: 'easy',
        completed: false
      });
    }

    // Recovery-specific goals (if applicable)
    if (profile.hasAddictions && profile.daysClean >= 0) {
      goals.push({
        id: `ai_recovery_check_${Date.now()}`,
        text: 'Check in with your recovery support network',
        type: 'recovery',
        priority: 'medium',
        pointsValue: 10,
        reasoning: `You're on day ${profile.daysClean} of recovery. Regular support contact strengthens your recovery foundation.`,
        category: 'Recovery Support',
        estimatedTime: '10 min',
        difficulty: 'medium',
        completed: false
      });
    }

    // Limit to 3-4 goals to avoid overwhelming
    return goals.slice(0, 4);
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
      
      if (newGoals.length === 1 && newGoals[0].text.includes('daily wellness chat')) {
        // Don't show success message for chat prompt
        return;
      }
      
      toast.success(`🤖 AI generated ${newGoals.length} personalized goals based on your mood!`, {
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

  // Auto-generate goals when component mounts or when mood data changes
  useEffect(() => {
    const today = new Date().toDateString();
    const savedGoals = localStorage.getItem(`ai_goals_${today}`);
    
    if (savedGoals) {
      try {
        setAiGoals(JSON.parse(savedGoals));
      } catch (error) {
        console.error('Error loading saved AI goals:', error);
      }
    } else {
      // Auto-generate if no goals exist for today
      generateDailyAIGoals();
    }
  }, [generateDailyAIGoals]);

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
    needsDailyChat,
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