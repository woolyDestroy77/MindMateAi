import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, MessageSquare, Heart, Calendar, Target } from 'lucide-react';
import { WeeklyTrend, MoodDataPoint } from '../../hooks/useMoodTrends';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

interface WeeklyStatsGridProps {
  weeklyTrends: WeeklyTrend[];
  moodData: MoodDataPoint[];
  isLoading: boolean;
}

const WeeklyStatsGrid: React.FC<WeeklyStatsGridProps> = ({ weeklyTrends, moodData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  const currentWeek = weeklyTrends[weeklyTrends.length - 1];
  const previousWeek = weeklyTrends[weeklyTrends.length - 2];
  
  // Calculate overall statistics
  const totalDays = moodData.length;
  const averageWellness = moodData.length > 0 
    ? Math.round(moodData.reduce((sum, point) => sum + point.wellnessScore, 0) / moodData.length)
    : 0;
  const totalMessages = moodData.reduce((sum, point) => sum + point.messageCount, 0);
  const streakDays = calculateCurrentStreak(moodData);

  const stats = [
    {
      label: 'Current Wellness',
      value: currentWeek?.averageWellness || averageWellness,
      unit: '/100',
      change: currentWeek?.improvement || 0,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Weekly Messages',
      value: currentWeek?.totalMessages || totalMessages,
      unit: '',
      change: currentWeek && previousWeek ? currentWeek.totalMessages - previousWeek.totalMessages : 0,
      icon: MessageSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Tracking Streak',
      value: streakDays,
      unit: streakDays === 1 ? ' day' : ' days',
      change: 0, // Streaks don't have meaningful change indicators
      icon: Calendar,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Positive Ratio',
      value: Math.round((currentWeek?.positiveRatio || 0) * 100),
      unit: '%',
      change: currentWeek && previousWeek 
        ? Math.round((currentWeek.positiveRatio - previousWeek.positiveRatio) * 100)
        : 0,
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            {stat.change !== 0 && (
              <div className={`flex items-center text-xs ${
                stat.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {Math.abs(stat.change)}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              <span className="text-sm text-gray-500">{stat.unit}</span>
            </div>
            <p className="text-xs text-gray-600">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Helper function to calculate current tracking streak
function calculateCurrentStreak(moodData: MoodDataPoint[]): number {
  if (moodData.length === 0) return 0;
  
  // Sort by date descending
  const sortedData = [...moodData].sort((a, b) => b.date.localeCompare(a.date));
  
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < sortedData.length; i++) {
    const dataDate = parseISO(sortedData[i].date);
    const daysDiff = Math.floor((today.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === i) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export default WeeklyStatsGrid;