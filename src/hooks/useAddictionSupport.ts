// Enhanced addiction support with AI-generated daily tips and recovery steps
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface AddictionType {
  id: string;
  name: string;
  category: 'substance' | 'behavioral' | 'other';
  description: string;
  resources: {
    helplines?: string[];
    websites?: string[];
    apps?: string[];
  };
}

export interface UserAddiction {
  id: string;
  user_id: string;
  addiction_type_id: string;
  addiction_type?: AddictionType;
  severity_level: number;
  start_date: string;
  quit_attempts: number;
  current_status: 'active' | 'recovery' | 'relapse' | 'clean';
  days_clean: number;
  personal_triggers: string[];
  support_contacts: {
    emergency?: string;
    sponsor?: string;
    therapist?: string;
    family?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_clean_day_marked?: string; // Track when last clean day was marked
}

export interface AddictionTracking {
  id: string;
  user_id: string;
  user_addiction_id: string;
  entry_type: 'craving' | 'relapse' | 'milestone' | 'support' | 'trigger' | 'success';
  intensity_level?: number;
  trigger_identified?: string;
  coping_strategy_used?: string;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
  location?: string;
  support_used: boolean;
  created_at: string;
}

export interface AddictionMilestone {
  id: string;
  user_addiction_id: string;
  milestone_type: 'days_clean' | 'weeks_clean' | 'months_clean' | 'year_clean' | 'custom';
  milestone_value: number;
  achieved_at: string;
  celebration_notes?: string;
}

export interface DailyTip {
  id: string;
  addiction_category: string;
  tip_type: 'motivation' | 'coping' | 'prevention' | 'health' | 'mindfulness';
  title: string;
  content: string;
  day_number: number; // Day in recovery journey
}

export const useAddictionSupport = () => {
  const [addictionTypes, setAddictionTypes] = useState<AddictionType[]>([]);
  const [userAddictions, setUserAddictions] = useState<UserAddiction[]>([]);
  const [recentTracking, setRecentTracking] = useState<AddictionTracking[]>([]);
  const [milestones, setMilestones] = useState<AddictionMilestone[]>([]);
  const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch addiction types (available addictions to track)
  const fetchAddictionTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('addiction_types')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setAddictionTypes(data || []);
    } catch (err) {
      console.error('Error fetching addiction types:', err);
      setError('Failed to load addiction types');
    }
  }, []);

  // Fetch user's tracked addictions
  const fetchUserAddictions = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('user_addictions')
        .select(`
          *,
          addiction_type:addiction_types(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserAddictions(data || []);
    } catch (err) {
      console.error('Error fetching user addictions:', err);
      setError('Failed to load your addictions');
    }
  }, []);

  // Fetch recent tracking entries
  const fetchRecentTracking = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('addiction_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentTracking(data || []);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
    }
  }, []);

  // Fetch milestones
  const fetchMilestones = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('addiction_milestones')
        .select(`
          *,
          user_addiction:user_addictions!inner(
            user_id,
            addiction_type:addiction_types(name)
          )
        `)
        .eq('user_addiction.user_id', user.id)
        .order('achieved_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMilestones(data || []);
    } catch (err) {
      console.error('Error fetching milestones:', err);
    }
  }, []);

  // Generate daily tip based on user's addiction and progress
  const generateDailyTip = useCallback((userAddictions: UserAddiction[]) => {
    if (userAddictions.length === 0) return null;

    const primaryAddiction = userAddictions[0];
    const daysClean = primaryAddiction.days_clean;
    const category = primaryAddiction.addiction_type?.category || 'substance';

    // AI-generated daily tips database organized by category and recovery stage
    const tipDatabase: { [key: string]: DailyTip[] } = {
      substance: [
        // Early recovery (0-30 days)
        {
          id: 'sub_1',
          addiction_category: 'substance',
          tip_type: 'motivation',
          title: 'One Day at a Time',
          content: 'Focus on staying clean just for today. Tomorrow will take care of itself. Each day you choose recovery is a victory worth celebrating.',
          day_number: 1
        },
        {
          id: 'sub_2',
          addiction_category: 'substance',
          tip_type: 'coping',
          title: 'Identify Your Triggers',
          content: 'Write down 3 situations that make you want to use. Awareness is the first step to developing healthy coping strategies.',
          day_number: 3
        },
        {
          id: 'sub_3',
          addiction_category: 'substance',
          tip_type: 'health',
          title: 'Hydrate and Nourish',
          content: 'Your body is healing. Drink plenty of water and eat nutritious meals to support your recovery process.',
          day_number: 5
        },
        {
          id: 'sub_4',
          addiction_category: 'substance',
          tip_type: 'prevention',
          title: 'Create a Support Network',
          content: 'Reach out to one person today who supports your recovery. Connection is crucial for long-term success.',
          day_number: 7
        },
        {
          id: 'sub_5',
          addiction_category: 'substance',
          tip_type: 'mindfulness',
          title: 'Practice Deep Breathing',
          content: 'When cravings hit, try the 4-7-8 breathing technique: Inhale for 4, hold for 7, exhale for 8. Repeat 3 times.',
          day_number: 10
        },
        // Mid recovery (30-90 days)
        {
          id: 'sub_6',
          addiction_category: 'substance',
          tip_type: 'motivation',
          title: 'Celebrate Your Progress',
          content: 'You\'ve made it this far! Take a moment to acknowledge your strength and the positive changes you\'ve made.',
          day_number: 30
        },
        {
          id: 'sub_7',
          addiction_category: 'substance',
          tip_type: 'coping',
          title: 'Develop New Routines',
          content: 'Replace old habits with healthy ones. Start a morning routine that sets a positive tone for your day.',
          day_number: 45
        },
        {
          id: 'sub_8',
          addiction_category: 'substance',
          tip_type: 'prevention',
          title: 'Plan for Difficult Days',
          content: 'Create an action plan for when you feel vulnerable. Include people to call, activities to do, and reminders of why you quit.',
          day_number: 60
        },
        // Long-term recovery (90+ days)
        {
          id: 'sub_9',
          addiction_category: 'substance',
          tip_type: 'motivation',
          title: 'You Are Stronger Than You Know',
          content: 'Every day clean is proof of your incredible strength. You\'ve overcome challenges that once seemed impossible.',
          day_number: 90
        },
        {
          id: 'sub_10',
          addiction_category: 'substance',
          tip_type: 'health',
          title: 'Focus on Mental Health',
          content: 'Consider therapy or counseling to address underlying issues. Mental health is just as important as physical health in recovery.',
          day_number: 120
        }
      ],
      behavioral: [
        {
          id: 'beh_1',
          addiction_category: 'behavioral',
          tip_type: 'motivation',
          title: 'Break the Cycle',
          content: 'Today is a new opportunity to choose different behaviors. Each healthy choice builds momentum for lasting change.',
          day_number: 1
        },
        {
          id: 'beh_2',
          addiction_category: 'behavioral',
          tip_type: 'coping',
          title: 'Find Alternative Activities',
          content: 'When you feel the urge to engage in addictive behavior, have 3 alternative activities ready: exercise, call a friend, or practice a hobby.',
          day_number: 3
        },
        {
          id: 'beh_3',
          addiction_category: 'behavioral',
          tip_type: 'mindfulness',
          title: 'Mindful Awareness',
          content: 'Practice noticing urges without acting on them. Observe the feeling, acknowledge it, and let it pass like a wave.',
          day_number: 7
        },
        {
          id: 'beh_4',
          addiction_category: 'behavioral',
          tip_type: 'prevention',
          title: 'Modify Your Environment',
          content: 'Remove triggers from your environment. If you can\'t remove them, create barriers that give you time to make better choices.',
          day_number: 14
        },
        {
          id: 'beh_5',
          addiction_category: 'behavioral',
          tip_type: 'motivation',
          title: 'Celebrate Small Wins',
          content: 'Every moment you choose recovery over addiction is worth celebrating. Acknowledge your progress, no matter how small.',
          day_number: 30
        }
      ]
    };

    const categoryTips = tipDatabase[category] || tipDatabase.substance;
    
    // Find appropriate tip based on days clean
    let selectedTip = categoryTips[0]; // Default to first tip
    
    for (const tip of categoryTips) {
      if (daysClean >= tip.day_number) {
        selectedTip = tip;
      } else {
        break;
      }
    }

    return selectedTip;
  }, []);

  // Add a new addiction to track
  const addUserAddiction = useCallback(async (
    addictionTypeId: string,
    severityLevel: number,
    startDate: string,
    quitAttempts: number = 0,
    personalTriggers: string[] = [],
    supportContacts: any = {}
  ) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_addictions')
        .insert([{
          user_id: user.id,
          addiction_type_id: addictionTypeId,
          severity_level: severityLevel,
          start_date: startDate,
          quit_attempts: quitAttempts,
          current_status: 'recovery',
          days_clean: 0,
          personal_triggers: personalTriggers,
          support_contacts: supportContacts,
          is_active: true
        }])
        .select(`
          *,
          addiction_type:addiction_types(*)
        `)
        .single();

      if (error) throw error;

      setUserAddictions(prev => [data, ...prev]);
      toast.success('Addiction tracking started. You\'ve got this! 💪');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add addiction tracking';
      toast.error(message);
      throw err;
    }
  }, []);

  // Update addiction status with daily clean day tracking
  const updateAddictionStatus = useCallback(async (
    addictionId: string,
    status: 'active' | 'recovery' | 'relapse' | 'clean',
    daysClean?: number
  ) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Find the current addiction
      const currentAddiction = userAddictions.find(a => a.id === addictionId);
      if (!currentAddiction) {
        throw new Error('Addiction not found');
      }

      // Check if user is trying to mark clean day
      if (status === 'clean' && daysClean !== undefined) {
        // Check if they already marked a clean day today
        if (currentAddiction.last_clean_day_marked === today) {
          toast.error('You can only mark one clean day per day. Come back tomorrow! 🌅');
          return;
        }
      }

      const updates: any = { 
        current_status: status,
        updated_at: new Date().toISOString()
      };
      
      if (daysClean !== undefined) {
        updates.days_clean = daysClean;
        if (status === 'clean') {
          updates.last_clean_day_marked = today;
        }
      }

      const { data, error } = await supabase
        .from('user_addictions')
        .update(updates)
        .eq('id', addictionId)
        .select(`
          *,
          addiction_type:addiction_types(*)
        `)
        .single();

      if (error) throw error;

      setUserAddictions(prev => 
        prev.map(addiction => 
          addiction.id === addictionId ? data : addiction
        )
      );

      const statusMessages = {
        active: 'Status updated. Remember, seeking help is a sign of strength.',
        recovery: 'Great job on your recovery journey! Keep going! 🌟',
        relapse: 'Relapses are part of recovery. You\'re still strong and capable. 💙',
        clean: `Day ${daysClean} complete! You\'re building an amazing streak! 🎉`
      };

      toast.success(statusMessages[status]);

      // Check for milestones
      if (status === 'clean' && daysClean) {
        await checkAndCreateMilestone(addictionId, daysClean);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(message);
      throw err;
    }
  }, [userAddictions]);

  // Check and create milestone achievements
  const checkAndCreateMilestone = useCallback(async (addictionId: string, daysClean: number) => {
    const milestoneThresholds = [1, 7, 14, 30, 60, 90, 180, 365];
    
    if (milestoneThresholds.includes(daysClean)) {
      try {
        let milestoneType: string;
        let milestoneValue: number;

        if (daysClean === 1) {
          milestoneType = 'days_clean';
          milestoneValue = 1;
        } else if (daysClean < 30) {
          milestoneType = 'days_clean';
          milestoneValue = daysClean;
        } else if (daysClean < 365) {
          milestoneType = daysClean === 30 || daysClean === 60 || daysClean === 90 || daysClean === 180 ? 'days_clean' : 'weeks_clean';
          milestoneValue = milestoneType === 'weeks_clean' ? Math.floor(daysClean / 7) : daysClean;
        } else {
          milestoneType = 'year_clean';
          milestoneValue = Math.floor(daysClean / 365);
        }

        const { error } = await supabase
          .from('addiction_milestones')
          .insert([{
            user_addiction_id: addictionId,
            milestone_type: milestoneType,
            milestone_value: milestoneValue,
            celebration_notes: `Achieved ${daysClean} days clean! 🎉`
          }]);

        if (error) throw error;

        toast.success(`🏆 Milestone achieved: ${daysClean} days clean!`, {
          duration: 5000,
          icon: '🎉'
        });

        // Refresh milestones
        fetchMilestones();
      } catch (err) {
        console.error('Error creating milestone:', err);
      }
    }
  }, [fetchMilestones]);

  // Add tracking entry (craving, relapse, success, etc.)
  const addTrackingEntry = useCallback(async (
    userAddictionId: string,
    entryType: AddictionTracking['entry_type'],
    data: Partial<AddictionTracking>
  ) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { data: newEntry, error } = await supabase
        .from('addiction_tracking')
        .insert([{
          user_id: user.id,
          user_addiction_id: userAddictionId,
          entry_type: entryType,
          ...data
        }])
        .select()
        .single();

      if (error) throw error;

      setRecentTracking(prev => [newEntry, ...prev.slice(0, 19)]);

      const entryMessages = {
        craving: 'Craving logged. You\'re aware and that\'s powerful! 🧠',
        relapse: 'Entry recorded. Tomorrow is a new day to try again. 💙',
        milestone: 'Milestone achieved! You should be proud! 🏆',
        support: 'Great job reaching out for support! 🤝',
        trigger: 'Trigger identified. Knowledge is power in recovery! 🎯',
        success: 'Success story logged! You\'re inspiring! ✨'
      };

      toast.success(entryMessages[entryType]);
      return newEntry;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add tracking entry';
      toast.error(message);
      throw err;
    }
  }, []);

  // Calculate days clean automatically
  const calculateDaysClean = useCallback((lastRelapseDate: string | null, startDate: string): number => {
    const referenceDate = lastRelapseDate ? new Date(lastRelapseDate) : new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - referenceDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Get addiction statistics
  const getAddictionStats = useCallback(() => {
    const totalAddictions = userAddictions.length;
    const activeRecovery = userAddictions.filter(a => a.current_status === 'recovery' || a.current_status === 'clean').length;
    const totalDaysClean = userAddictions.reduce((sum, a) => sum + a.days_clean, 0);
    const longestStreak = Math.max(...userAddictions.map(a => a.days_clean), 0);
    
    return {
      totalAddictions,
      activeRecovery,
      totalDaysClean,
      longestStreak,
      recoveryRate: totalAddictions > 0 ? (activeRecovery / totalAddictions) * 100 : 0
    };
  }, [userAddictions]);

  // Emergency support function
  const getEmergencySupport = useCallback(() => {
    const emergencyResources = {
      crisis: {
        phone: '988', // Suicide & Crisis Lifeline
        text: 'Text HOME to 741741', // Crisis Text Line
        chat: 'suicidepreventionlifeline.org'
      },
      substance: {
        phone: '1-800-662-4357', // SAMHSA National Helpline
        website: 'samhsa.gov'
      },
      gambling: {
        phone: '1-800-522-4700', // National Problem Gambling Helpline
        website: 'ncpgambling.org'
      }
    };

    return emergencyResources;
  }, []);

  // Check if user can mark clean day today
  const canMarkCleanDayToday = useCallback((addictionId: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    const addiction = userAddictions.find(a => a.id === addictionId);
    return addiction ? addiction.last_clean_day_marked !== today : false;
  }, [userAddictions]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchAddictionTypes(),
          fetchUserAddictions(),
          fetchRecentTracking(),
          fetchMilestones()
        ]);
      } catch (err) {
        console.error('Error initializing addiction support data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchAddictionTypes, fetchUserAddictions, fetchRecentTracking, fetchMilestones]);

  // Generate daily tip when user addictions change
  useEffect(() => {
    if (userAddictions.length > 0) {
      const tip = generateDailyTip(userAddictions);
      setDailyTip(tip);
    }
  }, [userAddictions, generateDailyTip]);

  return {
    // Data
    addictionTypes,
    userAddictions,
    recentTracking,
    milestones,
    dailyTip,
    isLoading,
    error,

    // Actions
    addUserAddiction,
    updateAddictionStatus,
    addTrackingEntry,
    
    // Utilities
    calculateDaysClean,
    getAddictionStats,
    getEmergencySupport,
    canMarkCleanDayToday,
    
    // Refresh functions
    refreshUserAddictions: fetchUserAddictions,
    refreshTracking: fetchRecentTracking,
    refreshMilestones: fetchMilestones
  };
};