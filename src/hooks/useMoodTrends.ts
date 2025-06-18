import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, subDays, isToday, parseISO, addDays } from 'date-fns';

export interface MoodDataPoint {
  date: string;
  mood: string;
  moodName: string;
  sentiment: string;
  wellnessScore: number | null;
  messageCount: number;
  timestamp: string;
}

export interface WeeklyTrend {
  week: string;
  averageWellness: number;
  dominantMood: string;
  totalMessages: number;
  positiveRatio: number;
  improvement: number;
}

export interface MoodInsight {
  type: 'improvement' | 'concern' | 'achievement' | 'pattern';
  title: string;
  description: string;
  icon: string;
  color: string;
  actionable?: string;
}

export const useMoodTrends = () => {
  const [moodData, setMoodData] = useState<MoodDataPoint[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  const [insights, setInsights] = useState<MoodInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  const fetchMoodTrends = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      console.log('📊 Fetching mood trends for user:', user.id);

      // Calculate date range based on selection
      const now = new Date();
      let startDate: Date;
      
      switch (selectedTimeRange) {
        case 'week':
          startDate = subDays(now, 7); // Past week
          break;
        case 'month':
          startDate = subDays(now, 30); // Past month
          break;
        case 'quarter':
          startDate = subDays(now, 180); // Past 6 months
          break;
        default:
          startDate = subDays(now, 7);
      }

      // Fetch mood data from user_mood_data table
      const { data: moodHistory, error: moodError } = await supabase
        .from('user_mood_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', startDate.toISOString())
        .order('updated_at', { ascending: true });

      if (moodError) throw moodError;

      // Fetch chat history for message counts and additional sentiment analysis
      const { data: chatHistory, error: chatError } = await supabase
        .from('dappier_chat_history')
        .select('created_at, user_message')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (chatError) throw chatError;

      console.log('📈 Raw data fetched:', { moodHistory: moodHistory?.length, chatHistory: chatHistory?.length });

      // Process the data
      const processedData = processMoodData(moodHistory || [], chatHistory || [], startDate, now);
      const weeklyData = calculateWeeklyTrends(processedData);
      const generatedInsights = generateInsights(processedData, weeklyData);

      setMoodData(processedData);
      setWeeklyTrends(weeklyData);
      setInsights(generatedInsights);

      console.log('✅ Mood trends processed successfully');

    } catch (error) {
      console.error('Error fetching mood trends:', error);
      toast.error('Failed to load mood trends');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange]);

  // Process raw data into daily mood points with continuous dates
  const processMoodData = (
    moodHistory: any[], 
    chatHistory: any[],
    startDate: Date,
    endDate: Date
  ): MoodDataPoint[] => {
    // Create a map for all dates in the range
    const dateMap = new Map<string, MoodDataPoint>();
    
    // Generate all dates in the range
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    allDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      dateMap.set(dateStr, {
        date: dateStr,
        mood: '😐',
        moodName: 'neutral',
        sentiment: 'neutral',
        wellnessScore: null, // Use null for days without data
        messageCount: 0,
        timestamp: date.toISOString()
      });
    });

    // Process mood data
    moodHistory.forEach(mood => {
      const date = format(parseISO(mood.updated_at), 'yyyy-MM-dd');
      
      if (dateMap.has(date)) {
        const existing = dateMap.get(date)!;
        // Only update if this mood entry is newer than what we have
        if (!existing.wellnessScore || parseISO(mood.updated_at) > parseISO(existing.timestamp)) {
          dateMap.set(date, {
            ...existing,
            mood: mood.current_mood,
            moodName: mood.mood_name,
            sentiment: mood.sentiment,
            wellnessScore: mood.wellness_score,
            timestamp: mood.updated_at
          });
        }
      }
    });

    // Add message counts
    chatHistory.forEach(chat => {
      const date = format(parseISO(chat.created_at), 'yyyy-MM-dd');
      
      if (dateMap.has(date)) {
        const existing = dateMap.get(date)!;
        dateMap.set(date, {
          ...existing,
          messageCount: existing.messageCount + 1
        });
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Calculate weekly trends and patterns
  const calculateWeeklyTrends = (data: MoodDataPoint[]): WeeklyTrend[] => {
    if (data.length === 0) return [];

    const weekMap = new Map<string, MoodDataPoint[]>();

    // Group data by week
    data.forEach(point => {
      if (point.wellnessScore === null) return; // Skip days without data
      
      const date = parseISO(point.date);
      const weekStart = startOfWeek(date);
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push(point);
    });

    // Calculate weekly statistics
    const trends: WeeklyTrend[] = [];
    const sortedWeeks = Array.from(weekMap.keys()).sort();

    sortedWeeks.forEach((weekKey, index) => {
      const weekData = weekMap.get(weekKey)!;
      if (weekData.length === 0) return;
      
      const validScores = weekData.filter(point => point.wellnessScore !== null);
      if (validScores.length === 0) return;
      
      const averageWellness = validScores.reduce((sum, point) => sum + (point.wellnessScore || 0), 0) / validScores.length;
      
      // Find dominant mood
      const moodCounts = new Map<string, number>();
      weekData.forEach(point => {
        moodCounts.set(point.moodName, (moodCounts.get(point.moodName) || 0) + 1);
      });
      const dominantMood = Array.from(moodCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      
      const totalMessages = weekData.reduce((sum, point) => sum + point.messageCount, 0);
      const positiveCount = weekData.filter(point => point.sentiment === 'positive').length;
      const positiveRatio = weekData.length > 0 ? positiveCount / weekData.length : 0;
      
      // Calculate improvement from previous week
      let improvement = 0;
      if (index > 0) {
        const prevWeekData = weekMap.get(sortedWeeks[index - 1])!;
        if (prevWeekData && prevWeekData.length > 0) {
          const prevValidScores = prevWeekData.filter(point => point.wellnessScore !== null);
          if (prevValidScores.length > 0) {
            const prevAverage = prevValidScores.reduce((sum, point) => sum + (point.wellnessScore || 0), 0) / prevValidScores.length;
            improvement = averageWellness - prevAverage;
          }
        }
      }

      trends.push({
        week: weekKey,
        averageWellness: Math.round(averageWellness),
        dominantMood,
        totalMessages,
        positiveRatio,
        improvement
      });
    });

    return trends;
  };

  // Generate actionable insights
  const generateInsights = (data: MoodDataPoint[], trends: WeeklyTrend[]): MoodInsight[] => {
    const insights: MoodInsight[] = [];

    if (data.length === 0) {
      insights.push({
        type: 'pattern',
        title: 'Start Your Journey',
        description: 'Begin tracking your mood by chatting with our AI to see personalized insights here.',
        icon: '🌟',
        color: 'bg-blue-50 text-blue-800',
        actionable: 'Start a conversation in the chat to begin mood tracking'
      });
      return insights;
    }

    // Recent trend analysis
    if (trends.length >= 2) {
      const latestTrend = trends[trends.length - 1];
      const previousTrend = trends[trends.length - 2];
      
      if (latestTrend.improvement > 5) {
        insights.push({
          type: 'improvement',
          title: 'Significant Progress! 📈',
          description: `Your wellness score improved by ${Math.round(latestTrend.improvement)} points this week. You're on a positive trajectory!`,
          icon: '🎉',
          color: 'bg-green-50 text-green-800',
          actionable: 'Keep up the great work with your current wellness practices'
        });
      } else if (latestTrend.improvement < -5) {
        insights.push({
          type: 'concern',
          title: 'Wellness Dip Detected',
          description: `Your wellness score decreased by ${Math.abs(Math.round(latestTrend.improvement))} points. This is normal - let's focus on self-care.`,
          icon: '💙',
          color: 'bg-blue-50 text-blue-800',
          actionable: 'Consider practicing mindfulness or reaching out to someone you trust'
        });
      }

      // Positive ratio insights
      if (latestTrend.positiveRatio > 0.7) {
        insights.push({
          type: 'achievement',
          title: 'Positivity Champion! ✨',
          description: `${Math.round(latestTrend.positiveRatio * 100)}% of your recent interactions were positive. Your mindset is thriving!`,
          icon: '🌈',
          color: 'bg-yellow-50 text-yellow-800'
        });
      }
    }

    // Consistency insights
    const dataWithScores = data.filter(point => point.wellnessScore !== null);
    if (dataWithScores.length >= 5) {
      insights.push({
        type: 'achievement',
        title: 'Consistency Streak! 🔥',
        description: `You've been actively tracking your mood for ${dataWithScores.length} days. Consistency is key to wellness!`,
        icon: '⭐',
        color: 'bg-purple-50 text-purple-800',
        actionable: 'Keep your daily check-ins going to maintain momentum'
      });
    }

    // Mood pattern insights
    const moodCounts = new Map<string, number>();
    dataWithScores.forEach(point => {
      moodCounts.set(point.moodName, (moodCounts.get(point.moodName) || 0) + 1);
    });

    if (moodCounts.size > 0) {
      const dominantMood = Array.from(moodCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b);
      
      if (dominantMood[0] === 'happy' || dominantMood[0] === 'excited') {
        insights.push({
          type: 'pattern',
          title: 'Joyful Spirit Detected! 😊',
          description: `Your most common mood is "${dominantMood[0]}". You're radiating positive energy!`,
          icon: '☀️',
          color: 'bg-orange-50 text-orange-800'
        });
      } else if (dominantMood[0] === 'calm') {
        insights.push({
          type: 'pattern',
          title: 'Zen Master Mode 🧘',
          description: `You frequently experience calmness. This balanced state is excellent for mental clarity and decision-making.`,
          icon: '🕊️',
          color: 'bg-green-50 text-green-800'
        });
      }
    }

    // Engagement insights
    const totalMessages = data.reduce((sum, point) => sum + point.messageCount, 0);
    const avgMessagesPerDay = totalMessages / data.length;
    
    if (avgMessagesPerDay >= 3) {
      insights.push({
        type: 'achievement',
        title: 'Highly Engaged! 💬',
        description: `You average ${Math.round(avgMessagesPerDay)} messages per day. Your commitment to wellness is inspiring!`,
        icon: '🎯',
        color: 'bg-indigo-50 text-indigo-800'
      });
    }

    // Wellness score insights
    const latestDataPoint = dataWithScores[dataWithScores.length - 1];
    if (latestDataPoint && latestDataPoint.wellnessScore !== null) {
      const currentScore = latestDataPoint.wellnessScore;
      if (currentScore >= 80) {
        insights.push({
          type: 'achievement',
          title: 'Wellness Superstar! 🌟',
          description: `Your current wellness score of ${currentScore} indicates excellent mental health. You're thriving!`,
          icon: '🏆',
          color: 'bg-emerald-50 text-emerald-800'
        });
      } else if (currentScore >= 60) {
        insights.push({
          type: 'improvement',
          title: 'Steady Progress 📊',
          description: `Your wellness score of ${currentScore} shows you're on a good path. Small improvements compound over time.`,
          icon: '📈',
          color: 'bg-blue-50 text-blue-800',
          actionable: 'Focus on one small wellness habit to boost your score further'
        });
      }
    }

    return insights.slice(0, 4); // Limit to 4 most relevant insights
  };

  useEffect(() => {
    fetchMoodTrends();
  }, [fetchMoodTrends]);

  return {
    moodData,
    weeklyTrends,
    insights,
    isLoading,
    selectedTimeRange,
    setSelectedTimeRange,
    refreshTrends: fetchMoodTrends
  };
};