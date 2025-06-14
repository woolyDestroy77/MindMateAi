import React from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
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
  Zap
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
  const { dashboardData, isLoading: dashboardLoading, refreshDashboardData } = useDashboardData();
  
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
    { title: '7-Day Streak', icon: Calendar, description: 'Logged mood daily for a week' },
    { title: 'Mindfulness Master', icon: Brain, description: '10 meditation sessions completed' },
    { title: 'Emotion Explorer', icon: Heart, description: 'Tracked 5 different emotions' },
    { title: 'Progress Pioneer', icon: TrendingUp, description: 'Improved mood trend for 3 days' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Wellness Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Wellness Score</h2>
                  <span className="text-sm text-gray-500">AI-Updated</span>
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
                      <circle
                        className="text-lavender-500"
                        strokeWidth="8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="64"
                        cy="64"
                        strokeDasharray={`${(2 * Math.PI * 58) * (dashboardData.wellnessScore / 100)} ${2 * Math.PI * 58}`}
                        transform="rotate(-90 64 64)"
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <span className="text-3xl font-bold text-gray-900">{dashboardData.wellnessScore}</span>
                      <span className="text-sm text-gray-500 block">/ 100</span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  Updated based on your AI conversations
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Current Mood - AI Updated */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
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
                <div className="text-6xl text-center py-4">{dashboardData.currentMood}</div>
                <p className="text-gray-600">{dashboardData.moodInterpretation}</p>
                <div className="text-xs text-gray-500 text-center">
                  Last updated: {format(new Date(dashboardData.lastUpdated), 'h:mm a')}
                </div>
                <Link to="/chat">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftIcon={<MessageSquare size={16} />}
                  >
                    Chat to Update Mood
                  </Button>
                </Link>
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
                  <span className="text-sm text-gray-500">3/5 completed</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded text-lavender-600" checked readOnly />
                    <span className="ml-3 text-gray-700">15min meditation</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded text-lavender-600" checked readOnly />
                    <span className="ml-3 text-gray-700">Journal entry</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded text-lavender-600" checked readOnly />
                    <span className="ml-3 text-gray-700">AI mood check-in</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded text-lavender-600" />
                    <span className="ml-3 text-gray-700">Evening reflection</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded text-lavender-600" />
                    <span className="ml-3 text-gray-700">Gratitude list</span>
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
                  <h2 className="text-xl font-semibold text-gray-900">Mood Trends</h2>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">Week</Button>
                      <Button variant="ghost" size="sm">Month</Button>
                      <Button variant="ghost" size="sm">Year</Button>
                    </div>
                    <div className="flex items-center text-xs text-lavender-600">
                      <Zap size={12} className="mr-1" />
                      AI-Enhanced
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <Line data={moodData} options={chartOptions} />
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Mood data automatically collected from your AI conversations and manual entries
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
                    <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                      <achievement.icon className="w-6 h-6 mx-auto text-lavender-500 mb-2" />
                      <h3 className="text-sm font-medium text-gray-900">{achievement.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Journal Entries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Journal</h2>
                  <Link to="/journal">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<PenSquare size={16} />}
                    >
                      New Entry
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {journalEntries.map((entry, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-500">{entry.date}</div>
                        <div className="text-xl">{entry.mood}</div>
                      </div>
                      <div className="text-gray-700">{entry.content}</div>
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
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card variant="elevated" className="h-full">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/chat">
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-col h-24 w-full relative"
                      leftIcon={<MessageSquare size={24} />}
                    >
                      AI Mood Chat
                      <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"></span>
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
                <div className="text-xs text-center text-lavender-600 bg-lavender-50 p-2 rounded">
                  💡 Your AI conversations automatically update your mood and wellness data!
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