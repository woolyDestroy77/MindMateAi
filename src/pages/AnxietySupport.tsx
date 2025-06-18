import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Heart,
  Wind,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  BookOpen,
  Headphones,
  AlertTriangle,
  Clock,
  Target,
  TrendingUp,
  Volume2,
  VolumeX,
  Settings,
  Plus,
  CheckCircle,
  Activity,
  Zap,
  Shield,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import BreathingExercise from '../components/anxiety/BreathingExercise';
import MeditationPlayer from '../components/anxiety/MeditationPlayer';
import PanicButton from '../components/anxiety/PanicButton';
import AnxietyJournal from '../components/anxiety/AnxietyJournal';
import CBTWorksheet from '../components/anxiety/CBTWorksheet';
import AnxietyChat from '../components/anxiety/AnxietyChat';
import AnxietyCalendar from '../components/anxiety/AnxietyCalendar';
import AnxietyStats from '../components/anxiety/AnxietyStats';
import UpcomingEventsCard from '../components/anxiety/UpcomingEventsCard';
import { useAnxietySupport } from '../hooks/useAnxietySupport';

// Local storage key for saving active tab
const ANXIETY_TAB_KEY = 'puremind_anxiety_active_tab';

const AnxietySupport = () => {
  const {
    anxietyLevel,
    todaysSessions,
    weeklyProgress,
    isLoading,
    updateAnxietyLevel,
    addSession,
    getAnxietyInsights
  } = useAnxietySupport();

  // Load saved active tab from localStorage
  const loadSavedTab = () => {
    try {
      const savedTab = localStorage.getItem(ANXIETY_TAB_KEY);
      if (savedTab) {
        return savedTab as 'breathing' | 'meditation' | 'journal' | 'cbt' | 'chat' | 'calendar';
      }
    } catch (error) {
      console.error('Error loading anxiety tab:', error);
    }
    return 'breathing'; // Default tab
  };

  const [activeTab, setActiveTab] = useState<'breathing' | 'meditation' | 'journal' | 'cbt' | 'chat' | 'calendar'>(loadSavedTab);
  const [showPanicMode, setShowPanicMode] = useState(false);
  const [currentAnxietyLevel, setCurrentAnxietyLevel] = useState(anxietyLevel || 5);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(ANXIETY_TAB_KEY, activeTab);
      console.log('Anxiety tab saved:', activeTab);
    } catch (error) {
      console.error('Error saving anxiety tab:', error);
    }
  }, [activeTab]);

  // Update anxiety level when it changes from the hook
  useEffect(() => {
    if (anxietyLevel) {
      setCurrentAnxietyLevel(anxietyLevel);
    }
  }, [anxietyLevel]);

  const tabs = [
    { id: 'breathing', name: 'Breathing', icon: Wind, color: 'text-blue-600' },
    { id: 'meditation', name: 'Meditation', icon: Brain, color: 'text-purple-600' },
    { id: 'journal', name: 'Journal', icon: BookOpen, color: 'text-green-600' },
    { id: 'cbt', name: 'CBT Tools', icon: Target, color: 'text-orange-600' },
    { id: 'chat', name: 'AI Support', icon: MessageSquare, color: 'text-pink-600' },
    { id: 'calendar', name: 'Schedule', icon: Calendar, color: 'text-indigo-600' }
  ];

  const quickActions = [
    {
      title: '4-7-8 Breathing',
      description: 'Quick calming technique',
      icon: Wind,
      color: 'bg-blue-100 text-blue-700',
      action: () => setActiveTab('breathing')
    },
    {
      title: '5-Minute Meditation',
      description: 'Guided mindfulness',
      icon: Brain,
      color: 'bg-purple-100 text-purple-700',
      action: () => setActiveTab('meditation')
    },
    {
      title: 'Thought Record',
      description: 'Challenge negative thoughts',
      icon: Target,
      color: 'bg-orange-100 text-orange-700',
      action: () => setActiveTab('cbt')
    },
    {
      title: 'AI Chat Support',
      description: 'Talk through your anxiety',
      icon: MessageSquare,
      color: 'bg-pink-100 text-pink-700',
      action: () => setActiveTab('chat')
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading anxiety support tools...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      {/* Panic Button - Always Visible */}
      <PanicButton 
        isActive={showPanicMode}
        onActivate={() => setShowPanicMode(true)}
        onDeactivate={() => setShowPanicMode(false)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Anxiety Support Center
            </h1>
          </motion.div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive tools for managing anxiety with breathing exercises, meditation, 
            CBT techniques, and AI-powered support available 24/7.
          </p>
        </div>

        {/* Current Anxiety Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Current Anxiety Level</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-700">Low</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentAnxietyLevel}
                      onChange={(e) => setCurrentAnxietyLevel(parseInt(e.target.value))}
                      className="w-32 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-blue-700">High</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-800">{currentAnxietyLevel}/10</div>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => updateAnxietyLevel(currentAnxietyLevel)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Update Level
              </Button>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Relief Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={action.action}
                  className={`p-4 rounded-lg border-2 border-transparent hover:border-current transition-all ${action.color} hover:shadow-md`}
                >
                  <action.icon className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs opacity-80 mt-1">{action.description}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Events Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <UpcomingEventsCard />
          </motion.div>
        </div>

        {/* Stats Overview */}
        <AnxietyStats 
          todaysSessions={todaysSessions}
          weeklyProgress={weeklyProgress}
          currentLevel={anxietyLevel}
        />

        {/* Main Content Tabs */}
        <div className="mt-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? `border-current ${tab.color}`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={18} />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'breathing' && (
                <BreathingExercise onComplete={(type, duration) => addSession('breathing', type, duration)} />
              )}
              
              {activeTab === 'meditation' && (
                <MeditationPlayer onComplete={(type, duration) => addSession('meditation', type, duration)} />
              )}
              
              {activeTab === 'journal' && (
                <AnxietyJournal />
              )}
              
              {activeTab === 'cbt' && (
                <CBTWorksheet />
              )}
              
              {activeTab === 'chat' && (
                <AnxietyChat />
              )}
              
              {activeTab === 'calendar' && (
                <AnxietyCalendar />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Emergency Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Crisis Support</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="tel:988"
                className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg hover:bg-white transition-colors"
              >
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-red-900">Crisis Lifeline</div>
                  <div className="text-sm text-red-700">Call 988</div>
                </div>
              </a>
              
              <a
                href="sms:741741?body=HOME"
                className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg hover:bg-white transition-colors"
              >
                <div className="p-2 bg-red-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-red-900">Crisis Text Line</div>
                  <div className="text-sm text-red-700">Text HOME to 741741</div>
                </div>
              </a>
              
              <Link
                to="/chat"
                className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg hover:bg-white transition-colors"
              >
                <div className="p-2 bg-red-100 rounded-lg">
                  <Brain className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-red-900">AI Wellness Chat</div>
                  <div className="text-sm text-red-700">24/7 Support</div>
                </div>
              </Link>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default AnxietySupport;