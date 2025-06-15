import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
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
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useDashboardData } from '../hooks/useDashboardData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const moodData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Mood Level',
      data: [7, 6, 8, 5, 7, 8, 9],
      borderColor: 'rgb(157, 138, 199)',
      backgroundColor: 'rgba(157, 138, 199, 0.1)',
      fill: true,
      tension: 0.4,
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    y: {
      min: 0,
      max: 10,
      ticks: {
        stepSize: 2,
      },
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
};

const Dashboard = () => {
  const { dashboardData, isLoading: dashboardLoading, refreshDashboardData, updateTrigger } = useDashboardData();
  
  // Force re-render when dashboard data changes
  useEffect(() => {
    console.log('Dashboard data updated:', dashboardData);
    console.log('Update trigger:', updateTrigger);
  }, [dashboardData, updateTrigger]);
  
  const journalEntries = [
    {
      date: format(new Date(), 'yyyy-MM-dd'),
      content: 'Today was productive. Made progress on my goals and practiced mindfulness for 15 minutes.',
      sentiment: 'positive',
      mood: '😊'
    },
    {
      date: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'),
      content: 'Felt some anxiety about upcoming deadlines but managed it well with breathing exercises.',
      sentiment: 'neutral',
      mood: '😐'
    },
    {
      date: format(new Date(Date.now() - 172800000), 'yyyy-MM-dd'),
      content: 'Great meditation session this morning. Feeling centered and focused.',
      sentiment: 'positive',
      mood: '😌'
    }
  ];

  const achievements = [
    { title: '7-Day Streak', icon: Calendar, description: 'Daily wellness check-ins for a week' },
    { title: 'Mindfulness Master', icon: Brain, description: '10 meditation sessions completed' },
    { title: 'Emotion Explorer', icon: Heart, description: 'Tracked 5 different emotions' },
    { title: 'Progress Pioneer', icon: TrendingUp, description: 'Improved mood trend for 3 days' }
  ];

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

  // Check if user has shared their mood yet (not default state)
  const hasSharedMood = dashboardData.lastMessage && 
    dashboardData.lastMessage.trim() !== '' &&
    !dashboardData.moodInterpretation.includes('Welcome to PureMind AI');

  if (dashboardLoading) {
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
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-lavender-600 to-sage-600 bg-clip-text text-transparent mb-2">
            Your Wellness Dashboard
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track your daily emotional wellness journey with AI-powered insights from your continuous chat conversations.
          </p>
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

          {/* Current Mood - AI Updated or Prompt to Share */}
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
                    {hasSharedMood ? (
                      <>
                        <Zap size={16} className="text-lavender-500" />
                        <span className="text-xs text-lavender-600 font-medium">AI-Tracked</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-orange-500" />
                        <span className="text-xs text-orange-600 font-medium">Not Set</span>
                      </>
                    )}
                  </div>
                </div>

                {hasSharedMood ? (
                  // Show actual mood data
                  <>
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
                  </>
                ) : (
                  // Show prompt to share mood
                  <>
                    <motion.div 
                      className="text-center py-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="text-4xl mb-4">🤔</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Share Your Mood
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Start a conversation in the daily chat to automatically track your mood and get personalized wellness insights.
                      </p>
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-center text-orange-700 text-sm">
                          <MessageSquare size={16} className="mr-2" />
                          <span>Tell us how you're feeling today!</span>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}

                <Link to="/chat">
                  <Button
                    variant={hasSharedMood ? "outline" : "primary"}
                    size="sm"
                    fullWidth
                    leftIcon={<MessageSquare size={16} />}
                    rightIcon={!hasSharedMood ? <ArrowRight size={16} /> : undefined}
                    className={hasSharedMood 
                      ? "bg-gradient-to-r from-lavender-50 to-sage-50 hover:from-lavender-100 hover:to-sage-100" 
                      : "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white animate-pulse"
                    }
                  >
                    {hasSharedMood ? "Continue Daily Chat" : "Start Daily Chat to Check Mood"}
                  </Button>
                </Link>
                
                {hasSharedMood && (
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={refreshDashboardData}
                    leftIcon={<RefreshCcw size={16} />}
                  >
                    Refresh Data
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Daily Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Daily Goals</h2>
                  <span className="text-sm text-gray-500">{hasSharedMood ? '3/5' : '2/5'} completed</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded text-lavender-600" checked readOnly />
                    <span className="ml-3 text-gray-700">Daily wellness chat</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded text-lavender-600" checked={hasSharedMood} readOnly />
                    <span className={`ml-3 ${hasSharedMood ? 'text-gray-700' : 'text-gray-400'}`}>Mood tracking</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded text-lavender-600" checked={hasSharedMood} readOnly />
                    <span className={`ml-3 ${hasSharedMood ? 'text-gray-700' : 'text-gray-400'}`}>Emotional check-in</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded text-lavender-600" />
                    <span className="ml-3 text-gray-700">Evening reflection</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded text-lavender-600" />
                    <span className="ml-3 text-gray-700">Gratitude practice</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Mood Tracker Graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2"
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Weekly Mood Trends</h2>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">Week</Button>
                      <Button variant="ghost" size="sm">Month</Button>
                      <Button variant="ghost" size="sm">Year</Button>
                    </div>
                    <div className="flex items-center text-xs text-lavender-600">
                      <BarChart3 size={12} className="mr-1" />
                      Daily Chat Data
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <Line data={moodData} options={chartOptions} />
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Mood trends automatically generated from your daily wellness conversations
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
                  <Award className="text-lavender-500" size={20} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="p-3 bg-gradient-to-br from-lavender-50 to-sage-50 rounded-lg text-center">
                      <achievement.icon className="w-6 h-6 mx-auto text-lavender-500 mb-2" />
                      <h3 className="text-sm font-medium text-gray-900">{achievement.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/chat">
                    <Button
                      variant="primary"
                      size="lg"
                      className={`flex-col h-24 w-full relative ${
                        hasSharedMood 
                          ? "bg-gradient-to-br from-lavender-500 to-sage-500 hover:from-lavender-600 hover:to-sage-600"
                          : "bg-gradient-to-br from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 animate-pulse"
                      }`}
                      leftIcon={<MessageSquare size={24} />}
                    >
                      {hasSharedMood ? "Daily Chat" : "Share Mood"}
                      {!hasSharedMood && (
                        <span className="absolute top-1 right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></span>
                      )}
                      {hasSharedMood && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      )}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-col h-24"
                    leftIcon={<Target size={24} />}
                  >
                    Set Goals
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
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-col h-24"
                    leftIcon={<Brain size={24} />}
                  >
                    Meditate
                  </Button>
                </div>
                <div className={`text-xs text-center p-3 rounded-lg ${
                  hasSharedMood 
                    ? "text-lavender-600 bg-gradient-to-r from-lavender-50 to-sage-50"
                    : "text-orange-600 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200"
                }`}>
                  {hasSharedMood ? (
                    <>💬 <strong>Daily Chat Active:</strong> Your conversations automatically update all wellness metrics and provide continuous emotional support!</>
                  ) : (
                    <>🎯 <strong>Get Started:</strong> Share your mood in the daily chat to unlock personalized wellness tracking and AI insights!</>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;