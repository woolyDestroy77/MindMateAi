import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  RefreshCcw,
  PenSquare,
  Calendar,
  Target,
  Award,
  TrendingUp,
  Brain,
  Heart,
  MessageSquare,
  Zap,
  Activity,
  Clock,
  BarChart3,
  Plus,
  X,
  CheckCircle,
  RotateCcw,
  Settings,
  LineChart,
  Users,
  Lightbulb,
  Shield,
  Image
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import AddGoalModal from '../components/dashboard/AddGoalModal';
import MoodTrendsChart from '../components/dashboard/MoodTrendsChart';
import InsightsPanel from '../components/dashboard/InsightsPanel';
import WeeklyStatsGrid from '../components/dashboard/WeeklyStatsGrid';
import DailyStepsCard from '../components/dashboard/DailyStepsCard';
import SuicidePreventionCard from '../components/dashboard/SuicidePreventionCard';
import AchievementsCard from '../components/dashboard/AchievementsCard';
import PhotoMemoriesCard from '../components/dashboard/PhotoMemoriesCard';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDailyReset } from '../hooks/useDailyReset';
import { useMoodTrends } from '../hooks/useMoodTrends';
import { useAddictionSupport } from '../hooks/useAddictionSupport';
import { useJournal } from '../hooks/useJournal';
import { useAnxietySupport } from '../hooks/useAnxietySupport';

const Dashboard = () => {
  const { dashboardData, isLoading: dashboardLoading, refreshDashboardData, updateTrigger } = useDashboardData();
  const { 
    customGoals, 
    addCustomGoal, 
    removeCustomGoal, 
    triggerManualReset,
    generateAddictionGoals,
    isLoading: resetLoading 
  } = useDailyReset();
  
  const {
    moodData,
    weeklyTrends,
    insights,
    isLoading: trendsLoading,
    selectedTimeRange,
    setSelectedTimeRange,
    refreshTrends
  } = useMoodTrends();

  // Get addiction support data for daily steps
  const { userAddictions, isLoading: addictionLoading } = useAddictionSupport();
  
  // Get journal entries for achievements and photos
  const { entries: journalEntries, isLoading: journalLoading } = useJournal();
  
  // Get anxiety sessions for achievements
  const { todaysSessions: anxietySessions, isLoading: anxietyLoading } = useAnxietySupport();
  
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPhotoMemories, setShowPhotoMemories] = useState(true);
  
  // Base daily goals that reset each day
  const baseGoals = [
    { id: 'daily-chat', text: 'Daily wellness chat', completed: false, type: 'ai' as const, pointsValue: 8 },
    { id: 'mood-tracking', text: 'Mood tracking', completed: false, type: 'ai' as const, pointsValue: 6 },
    { id: 'emotional-checkin', text: 'Emotional check-in', completed: false, type: 'ai' as const, pointsValue: 7 },
  ];

  // General goals that can be completed
  const generalGoals = [
    { id: 'evening-reflection', text: 'Evening reflection', completed: false, type: 'general' as const, pointsValue: 5 },
    { id: 'gratitude-practice', text: 'Gratitude practice', completed: false, type: 'general' as const, pointsValue: 4 },
  ];

  // Generate addiction-specific goals
  const addictionGoals = generateAddictionGoals(userAddictions);

  // Combine all goals
  const allGoals = [...baseGoals, ...generalGoals, ...addictionGoals, ...customGoals];

  // Goal completion state management
  const today = new Date().toDateString();
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`completedGoals_${today}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [goalPointsMap, setGoalPointsMap] = useState<Map<string, number>>(() => {
    const saved = localStorage.getItem(`goalPointsMap_${today}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if parsed data is a plain object (not an array)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Convert plain object to array of [key, value] pairs for Map constructor
          return new Map(Object.entries(parsed));
        } else {
          // Assume it's already in the correct format (array of [key, value] pairs)
          return new Map(parsed);
        }
      } catch (error) {
        console.error('Error parsing goalPointsMap from localStorage:', error);
        return new Map();
      }
    }
    return new Map();
  });

  const [hasShownFeelBetterToday, setHasShownFeelBetterToday] = useState(() => {
    return localStorage.getItem(`hasShownFeelBetterToday_${today}`) === 'true';
  });

  const [allGoalsFinished, setAllGoalsFinished] = useState(() => {
    return localStorage.getItem(`allGoalsFinished_${today}`) === 'true';
  });

  // Extract photos from journal entries
  const getAllPhotos = () => {
    const photos: any[] = [];
    
    journalEntries.forEach(entry => {
      if (entry.metadata?.photos && Array.isArray(entry.metadata.photos)) {
        entry.metadata.photos.forEach((photo: any) => {
          photos.push({
            ...photo,
            entryId: entry.id,
            entryDate: entry.created_at
          });
        });
      }
    });
    
    return photos;
  };
  
  const allPhotos = getAllPhotos();

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`completedGoals_${today}`, JSON.stringify([...completedGoals]));
  }, [completedGoals, today]);

  useEffect(() => {
    localStorage.setItem(`goalPointsMap_${today}`, JSON.stringify([...goalPointsMap]));
  }, [goalPointsMap, today]);

  useEffect(() => {
    localStorage.setItem(`hasShownFeelBetterToday_${today}`, hasShownFeelBetterToday.toString());
  }, [hasShownFeelBetterToday, today]);

  useEffect(() => {
    localStorage.setItem(`allGoalsFinished_${today}`, allGoalsFinished.toString());
  }, [allGoalsFinished, today]);

  // Auto-complete AI goals based on dashboard data
  useEffect(() => {
    if (dashboardData.lastMessage && !completedGoals.has('daily-chat')) {
      setCompletedGoals(prev => new Set([...prev, 'daily-chat']));
      setGoalPointsMap(prev => new Map([...prev, ['daily-chat', 8]]));
    }
    if (dashboardData.currentMood !== '😌' && !completedGoals.has('mood-tracking')) {
      setCompletedGoals(prev => new Set([...prev, 'mood-tracking']));
      setGoalPointsMap(prev => new Map([...prev, ['mood-tracking', 6]]));
    }
    if (dashboardData.sentiment !== 'neutral' && !completedGoals.has('emotional-checkin')) {
      setCompletedGoals(prev => new Set([...prev, 'emotional-checkin']));
      setGoalPointsMap(prev => new Map([...prev, ['emotional-checkin', 7]]));
    }
  }, [dashboardData, completedGoals]);

  // Check if all goals are completed
  useEffect(() => {
    const totalGoals = allGoals.length;
    const completedCount = completedGoals.size;
    
    if (totalGoals > 0 && completedCount === totalGoals && !allGoalsFinished) {
      setAllGoalsFinished(true);
      
      // Calculate total points earned
      const totalPoints = Array.from(goalPointsMap.values()).reduce((sum, points) => sum + points, 0);
      
      // Show completion message
      setTimeout(() => {
        if (!hasShownFeelBetterToday) {
          setHasShownFeelBetterToday(true);
        }
      }, 500);
    }
  }, [completedGoals, allGoals.length, goalPointsMap, allGoalsFinished, hasShownFeelBetterToday]);

  const toggleGoalCompletion = (goalId: string, pointsValue: number) => {
    setCompletedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
        setGoalPointsMap(prevMap => {
          const newMap = new Map(prevMap);
          newMap.delete(goalId);
          return newMap;
        });
      } else {
        newSet.add(goalId);
        setGoalPointsMap(prevMap => new Map([...prevMap, [goalId, pointsValue]]));
      }
      return newSet;
    });
  };

  const getTotalPointsEarned = () => {
    return Array.from(goalPointsMap.values()).reduce((sum, points) => sum + points, 0);
  };

  const handleAddGoal = async (goalText: string, pointsValue: number) => {
    await addCustomGoal(goalText, pointsValue);
    setShowAddGoalModal(false);
  };

  const handleManualReset = async () => {
    await triggerManualReset();
    
    // Clear local state
    setCompletedGoals(new Set());
    setGoalPointsMap(new Map());
    setHasShownFeelBetterToday(false);
    setAllGoalsFinished(false);
    
    setShowResetConfirm(false);
  };

  // Force re-render when dashboard data changes
  useEffect(() => {
    console.log('Dashboard data updated:', dashboardData);
    console.log('Update trigger:', updateTrigger);
  }, [dashboardData, updateTrigger]);
  
  // Get primary addiction for daily steps
  const primaryAddiction = userAddictions.length > 0 ? userAddictions[0] : null;

  // Helper function to get addiction tag info
  const getAddictionTagInfo = (goal: any) => {
    if (goal.type !== 'addiction') return null;
    
    const colors = {
      substance: 'bg-red-100 text-red-700 border-red-300',
      behavioral: 'bg-blue-100 text-blue-700 border-blue-300',
      other: 'bg-purple-100 text-purple-700 border-purple-300'
    };

    const icons = {
      substance: Shield,
      behavioral: Brain,
      other: Heart
    };

    const category = goal.addictionCategory || 'other';
    const IconComponent = icons[category as keyof typeof icons];

    return {
      name: goal.addictionName,
      category,
      color: colors[category as keyof typeof colors],
      icon: IconComponent
    };
  };

  // Helper function to format the last updated time
  const formatLastUpdated = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
      } else {
        return formatDistanceToNow(date, { addSuffix: true });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Recently';
    }
  };

  if (dashboardLoading || resetLoading || addictionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-sage-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your wellness dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-sage-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-lavender-600 to-sage-600 bg-clip-text text-transparent">
              Your Wellness Dashboard
            </h1>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 text-gray-500 hover:text-lavender-600 hover:bg-lavender-50 rounded-lg transition-colors"
              title="Manual Reset (for testing)"
            >
              <Settings size={20} />
            </button>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track your daily emotional wellness journey with AI-powered insights from your continuous chat conversations.
          </p>
        </div>

        {/* Weekly Stats Grid */}
        <div className="mb-8">
          <WeeklyStatsGrid 
            weeklyTrends={weeklyTrends} 
            moodData={moodData} 
            isLoading={trendsLoading} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Wellness Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            key={`wellness-${dashboardData.wellnessScore}-${dashboardData.lastUpdated}-${updateTrigger}`}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Wellness Score</h2>
                  <div className="flex items-center space-x-1">
                    <Activity size={14} className="text-lavender-500" />
                    <span className="text-xs text-lavender-600 font-medium">AI-Updated</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <svg className="w-32 h-32">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="64"
                        cy="64"
                      />
                      <motion.circle
                        className="text-lavender-500"
                        strokeWidth="8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="64"
                        cy="64"
                        initial={{ strokeDasharray: "0 364" }}
                        animate={{ 
                          strokeDasharray: `${(2 * Math.PI * 58) * (dashboardData.wellnessScore / 100)} ${2 * Math.PI * 58}` 
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        transform="rotate(-90 64 64)"
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <motion.span 
                        className="text-3xl font-bold text-gray-900"
                        key={`score-${dashboardData.wellnessScore}-${updateTrigger}`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {dashboardData.wellnessScore}
                      </motion.span>
                      <span className="text-sm text-gray-500 block">/ 100</span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  Updated from your daily chat conversations
                </div>
                <div className="flex items-center justify-center text-xs text-gray-500 space-x-1">
                  <Clock size={12} />
                  <span>Last updated: {formatLastUpdated(dashboardData.lastUpdated)}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Current Mood - AI Updated */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            key={`mood-${dashboardData.currentMood}-${dashboardData.moodName}-${dashboardData.lastUpdated}-${updateTrigger}`}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Current Mood</h2>
                  <div className="flex items-center space-x-2">
                    <Zap size={16} className="text-lavender-500" />
                    <span className="text-xs text-lavender-600 font-medium">AI-Tracked</span>
                  </div>
                </div>
                <motion.div 
                  className="text-6xl text-center py-4"
                  key={`emoji-${dashboardData.currentMood}-${dashboardData.moodName}-${dashboardData.lastUpdated}-${updateTrigger}`}
                  initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                >
                  {dashboardData.currentMood}
                </motion.div>
                <motion.p 
                  className="text-gray-600 text-center text-sm"
                  key={`interpretation-${dashboardData.moodInterpretation}-${dashboardData.lastUpdated}-${updateTrigger}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {dashboardData.moodInterpretation}
                </motion.p>
                <div className="text-xs text-gray-500 text-center">
                  Mood: {dashboardData.moodName} • Sentiment: {dashboardData.sentiment}
                </div>
                <div className="flex items-center justify-center text-xs text-gray-500 space-x-1">
                  <Clock size={12} />
                  <span>Updated: {formatLastUpdated(dashboardData.lastUpdated)}</span>
                </div>
                {dashboardData.lastMessage && (
                  <motion.div 
                    className="bg-gray-50 rounded-lg p-3 mt-3"
                    key={`message-${dashboardData.lastMessage}-${updateTrigger}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-xs text-gray-500 mb-1">Last message analyzed:</div>
                    <div className="text-sm text-gray-700 italic">
                      "{dashboardData.lastMessage.length > 100 
                        ? dashboardData.lastMessage.substring(0, 100) + '...' 
                        : dashboardData.lastMessage}"
                    </div>
                  </motion.div>
                )}
                <Link to="/chat">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftIcon={<MessageSquare size={16} />}
                    className="bg-gradient-to-r from-lavender-50 to-sage-50 hover:from-lavender-100 hover:to-sage-100"
                  >
                    Continue Daily Chat
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={refreshDashboardData}
                  leftIcon={<RefreshCcw size={16} />}
                >
                  Refresh Data
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Photo Memories Card */}
          {allPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <PhotoMemoriesCard photos={allPhotos} />
            </motion.div>
          )}

          {/* Suicide Prevention Card (show if no photos) */}
          {allPhotos.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <SuicidePreventionCard />
            </motion.div>
          )}

          {/* Enhanced Daily Goals with Addiction Integration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Daily Goals</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {completedGoals.size}/{allGoals.length} completed
                    </span>
                    <button
                      onClick={() => setShowAddGoalModal(true)}
                      className="p-1 text-lavender-600 hover:text-lavender-700 hover:bg-lavender-50 rounded transition-colors"
                      title="Add custom goal"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Goals completion status */}
                {allGoalsFinished && hasShownFeelBetterToday ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 text-center"
                  >
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-800 mb-1">All Goals Complete! 🎉</h3>
                    <p className="text-sm text-green-700 mb-2">
                      You've earned {getTotalPointsEarned()} wellness points today!
                    </p>
                    <p className="text-xs text-green-600">
                      Goals will reset tomorrow for a fresh start
                    </p>
                  </motion.div>
                ) : allGoals.length === 0 ? (
                  <div className="text-center py-6">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm mb-3">No goals set for today</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowAddGoalModal(true)}
                      leftIcon={<Plus size={16} />}
                    >
                      Add Your First Goal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {allGoals.map((goal) => {
                      const addictionInfo = getAddictionTagInfo(goal);
                      
                      return (
                        <motion.div
                          key={goal.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="relative p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <input
                                type="checkbox"
                                checked={completedGoals.has(goal.id)}
                                onChange={() => toggleGoalCompletion(goal.id, goal.pointsValue)}
                                className="rounded text-lavender-600 mr-3"
                                disabled={goal.type === 'ai' && !completedGoals.has(goal.id)}
                              />
                              <div className="flex-1">
                                <span className={`text-sm ${completedGoals.has(goal.id) ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                  {goal.text}
                                </span>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-500">
                                    {goal.pointsValue} pts
                                  </span>
                                  {goal.type === 'ai' && (
                                    <span className="text-xs bg-lavender-100 text-lavender-700 px-1.5 py-0.5 rounded-full">
                                      Auto
                                    </span>
                                  )}
                                  {goal.type === 'custom' && (
                                    <span className="text-xs bg-sage-100 text-sage-700 px-1.5 py-0.5 rounded-full">
                                      Custom
                                    </span>
                                  )}
                                  {goal.type === 'addiction' && addictionInfo && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full border flex items-center space-x-1 ${addictionInfo.color}`}>
                                      <addictionInfo.icon size={10} />
                                      <span>{addictionInfo.name}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {(goal.type === 'custom' || goal.type === 'addiction') && (
                              <button
                                onClick={() => goal.type === 'custom' ? removeCustomGoal(goal.id) : null}
                                className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title={goal.type === 'custom' ? "Remove custom goal" : "Addiction goal"}
                                disabled={goal.type === 'addiction'}
                              >
                                {goal.type === 'custom' ? <X size={14} /> : <Shield size={14} />}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Points summary */}
                {completedGoals.size > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Points earned today:</span>
                      <span className="font-semibold text-lavender-600">
                        {getTotalPointsEarned()} pts
                      </span>
                    </div>
                  </div>
                )}

                {/* Add goal button */}
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setShowAddGoalModal(true)}
                  leftIcon={<Plus size={16} />}
                  className="mt-3"
                >
                  Add More Goals
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Daily Recovery Steps - Show if user has addiction tracking */}
          {primaryAddiction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="md:col-span-2 lg:col-span-3"
            >
              <DailyStepsCard 
                addictionType={primaryAddiction.addiction_type?.category}
                daysClean={primaryAddiction.days_clean}
              />
            </motion.div>
          )}

          {/* Enhanced Mood Tracker Graph with Real Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={primaryAddiction ? "md:col-span-2 lg:col-span-3" : "md:col-span-2"}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <LineChart size={20} className="text-lavender-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Mood Trends & Progress</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {(['week', 'month', 'quarter'] as const).map((range) => (
                        <button
                          key={range}
                          onClick={() => setSelectedTimeRange(range)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            selectedTimeRange === range
                              ? 'bg-lavender-100 text-lavender-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {range === 'week' ? 'Past Week' : range === 'month' ? 'Past Month' : 'Past 6 Months'}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={refreshTrends}
                      className="p-1 text-gray-500 hover:text-lavender-600 transition-colors"
                      title="Refresh trends"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  </div>
                </div>

                {trendsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading mood trends...</p>
                    </div>
                  </div>
                ) : moodData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 size={48} className="mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Mood Data Yet</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Start chatting with our AI to see your mood trends and progress here.
                      </p>
                      <Link to="/chat">
                        <Button variant="primary" leftIcon={<MessageSquare size={16} />}>
                          Start Tracking
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <MoodTrendsChart 
                    data={moodData} 
                    weeklyTrends={weeklyTrends} 
                    timeRange={selectedTimeRange} 
                  />
                )}

                <div className="text-xs text-gray-500 text-center border-t pt-3">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-lavender-500 rounded-full"></div>
                      <span>Wellness Score</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-sage-500 rounded-full"></div>
                      <span>Message Activity</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Positive</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Negative</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Insights Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Lightbulb size={20} className="text-yellow-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Wellness Insights</h2>
                </div>
                <InsightsPanel insights={insights} isLoading={trendsLoading} />
              </div>
            </Card>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <AchievementsCard 
              moodData={moodData}
              journalEntries={journalEntries}
              anxietySessions={anxietySessions || []}
              addictionData={{ userAddictions }}
              completedGoals={completedGoals}
            />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/chat">
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-col h-24 w-full relative bg-gradient-to-br from-lavender-500 to-sage-500 hover:from-lavender-600 hover:to-sage-600"
                      leftIcon={<MessageSquare size={24} />}
                    >
                      Daily Chat
                      <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-col h-24"
                    leftIcon={<Target size={24} />}
                    onClick={() => setShowAddGoalModal(true)}
                  >
                    Add Goals
                  </Button>
                  <Link to="/journal">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-col h-24 w-full"
                      leftIcon={<PenSquare size={24} />}
                    >
                      Write Journal
                    </Button>
                  </Link>
                  <Link to="/addiction-support">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-col h-24 w-full"
                      leftIcon={<Heart size={24} />}
                    >
                      Recovery Support
                    </Button>
                  </Link>
                </div>
                <div className="text-xs text-center text-lavender-600 bg-gradient-to-r from-lavender-50 to-sage-50 p-3 rounded-lg">
                  💬 <strong>Daily Reset Active:</strong> Your mood, chat, and goals automatically reset every 24 hours for a fresh start!
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
        onAddGoal={handleAddGoal}
      />

      {/* Manual Reset Confirmation Modal */}
      {showResetConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowResetConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full">
                <RotateCcw className="w-6 h-6 text-orange-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Manual Reset
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                This will reset your mood, clear chat history, and reset daily goals. 
                This is primarily for testing purposes. Are you sure?
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleManualReset}
                  leftIcon={<RotateCcw size={16} />}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Reset Now
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;