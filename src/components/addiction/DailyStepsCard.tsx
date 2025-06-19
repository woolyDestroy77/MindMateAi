import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Circle, 
  Heart, 
  Brain, 
  Shield, 
  Users, 
  Lightbulb,
  Clock,
  Target,
  Award,
  ChevronRight,
  ChevronDown,
  Bell
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useNotificationContext } from '../notifications/NotificationProvider';

interface DailyStep {
  id: string;
  title: string;
  description: string;
  category: 'morning' | 'afternoon' | 'evening' | 'anytime';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
}

interface DailyStepsCardProps {
  addictionType?: string;
  daysClean: number;
}

const DailyStepsCard: React.FC<DailyStepsCardProps> = ({ addictionType = 'substance', daysClean }) => {
  const today = new Date().toDateString();
  const storageKey = `completedSteps_${today}`;
  
  // Initialize state from localStorage
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.error('Error loading completed steps:', error);
      return new Set();
    }
  });
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>('morning');
  const { createReminder, createAchievement } = useNotificationContext();

  // Save completed steps to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...completedSteps]));
      console.log('Saved completed steps to localStorage:', [...completedSteps]);
    } catch (error) {
      console.error('Error saving completed steps:', error);
    }
  }, [completedSteps, storageKey]);

  // Generate daily steps based on addiction type and recovery stage
  const generateDailySteps = (): DailyStep[] => {
    const baseSteps: DailyStep[] = [
      // Morning Steps
      {
        id: 'morning_affirmation',
        title: 'Morning Affirmation',
        description: 'Start your day with positive self-talk: "I am strong, I am capable, I choose recovery today."',
        category: 'morning',
        icon: Heart,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        estimatedTime: '2 min',
        difficulty: 'easy',
        completed: false
      },
      {
        id: 'hydration_check',
        title: 'Hydration Check',
        description: 'Drink a full glass of water to kickstart your metabolism and support your body\'s healing.',
        category: 'morning',
        icon: Shield,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        estimatedTime: '1 min',
        difficulty: 'easy',
        completed: false
      },
      {
        id: 'intention_setting',
        title: 'Set Daily Intention',
        description: 'Write down one specific goal for staying clean today. Make it concrete and achievable.',
        category: 'morning',
        icon: Target,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        estimatedTime: '3 min',
        difficulty: 'easy',
        completed: false
      },

      // Afternoon Steps
      {
        id: 'mindful_breathing',
        title: 'Mindful Breathing',
        description: 'Practice 4-7-8 breathing: Inhale for 4, hold for 7, exhale for 8. Repeat 4 times.',
        category: 'afternoon',
        icon: Brain,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        estimatedTime: '5 min',
        difficulty: 'medium',
        completed: false
      },
      {
        id: 'trigger_awareness',
        title: 'Trigger Check-in',
        description: 'Identify any triggers you\'ve encountered today and how you\'ve handled them.',
        category: 'afternoon',
        icon: Lightbulb,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        estimatedTime: '3 min',
        difficulty: 'medium',
        completed: false
      },
      {
        id: 'physical_activity',
        title: 'Physical Movement',
        description: 'Take a 10-minute walk, do stretches, or any physical activity to release endorphins.',
        category: 'afternoon',
        icon: Heart,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        estimatedTime: '10 min',
        difficulty: 'medium',
        completed: false
      },

      // Evening Steps
      {
        id: 'gratitude_practice',
        title: 'Gratitude Practice',
        description: 'Write down 3 things you\'re grateful for today, including your progress in recovery.',
        category: 'evening',
        icon: Heart,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        estimatedTime: '5 min',
        difficulty: 'easy',
        completed: false
      },
      {
        id: 'reflection_time',
        title: 'Daily Reflection',
        description: 'Reflect on your day: What went well? What was challenging? How did you grow?',
        category: 'evening',
        icon: Brain,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        estimatedTime: '5 min',
        difficulty: 'medium',
        completed: false
      },
      {
        id: 'tomorrow_prep',
        title: 'Tomorrow Preparation',
        description: 'Plan one healthy activity for tomorrow that supports your recovery journey.',
        category: 'evening',
        icon: Target,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        estimatedTime: '3 min',
        difficulty: 'easy',
        completed: false
      },

      // Anytime Steps
      {
        id: 'support_connection',
        title: 'Connect with Support',
        description: 'Reach out to one person in your support network - a friend, family member, or sponsor.',
        category: 'anytime',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        estimatedTime: '10 min',
        difficulty: 'medium',
        completed: false
      },
      {
        id: 'craving_management',
        title: 'Craving Toolkit',
        description: 'If you experience cravings, use the HALT method: Are you Hungry, Angry, Lonely, or Tired?',
        category: 'anytime',
        icon: Shield,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        estimatedTime: '2 min',
        difficulty: 'hard',
        completed: false
      }
    ];

    // Adjust steps based on recovery stage
    if (daysClean < 7) {
      // Early recovery - focus on basics
      return baseSteps.filter(step => 
        ['morning_affirmation', 'hydration_check', 'mindful_breathing', 'gratitude_practice', 'support_connection'].includes(step.id)
      );
    } else if (daysClean < 30) {
      // Building habits
      return baseSteps.filter(step => 
        !['craving_management'].includes(step.id) // Remove advanced steps
      );
    } else {
      // All steps for established recovery
      return baseSteps;
    }
  };

  // Get the base steps
  const dailySteps = generateDailySteps();

  // Update completed status from localStorage
  const stepsWithCompletedStatus = dailySteps.map(step => ({
    ...step,
    completed: completedSteps.has(step.id)
  }));

  const toggleStepCompletion = (stepId: string) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
        
        // Create achievement notification for completing a step
        const step = dailySteps.find(s => s.id === stepId);
        if (step) {
          createAchievement(
            `${step.title} Completed!`,
            `You've completed your ${step.title.toLowerCase()} task. Keep up the great work!`,
            {
              actionUrl: '/addiction-support',
              actionText: 'View Progress'
            }
          );
        }
        
        // Check if all steps in a category are completed
        const category = dailySteps.find(s => s.id === stepId)?.category;
        if (category) {
          const categorySteps = dailySteps.filter(s => s.category === category);
          const completedCategorySteps = categorySteps.filter(s => newSet.has(s.id));
          
          if (categorySteps.length === completedCategorySteps.length) {
            // All steps in this category are completed
            createAchievement(
              `${category.charAt(0).toUpperCase() + category.slice(1)} Routine Completed!`,
              `You've completed all your ${category} recovery steps. Great discipline!`,
              {
                actionUrl: '/addiction-support',
                actionText: 'View Progress'
              }
            );
          }
        }
        
        // Check if all steps are completed
        if (newSet.size === dailySteps.length) {
          // All steps completed
          createAchievement(
            'All Recovery Steps Completed!',
            'You\'ve completed all your daily recovery steps. This is how lasting change happens!',
            {
              actionUrl: '/addiction-support',
              actionText: 'View Progress'
            }
          );
        }
      }
      return newSet;
    });
  };

  const getStepsByCategory = (category: string) => {
    return stepsWithCompletedStatus.filter(step => step.category === category);
  };

  const getCategoryProgress = (category: string) => {
    const categorySteps = getStepsByCategory(category);
    const completedInCategory = categorySteps.filter(step => step.completed).length;
    return { completed: completedInCategory, total: categorySteps.length };
  };

  const getTotalProgress = () => {
    const completed = stepsWithCompletedStatus.filter(step => step.completed).length;
    return { completed, total: stepsWithCompletedStatus.length };
  };

  const categories = [
    { id: 'morning', name: 'Morning Routine', icon: '🌅', color: 'text-orange-600' },
    { id: 'afternoon', name: 'Afternoon Check-in', icon: '☀️', color: 'text-yellow-600' },
    { id: 'evening', name: 'Evening Reflection', icon: '🌙', color: 'text-indigo-600' },
    { id: 'anytime', name: 'Anytime Tools', icon: '⚡', color: 'text-green-600' }
  ];

  const totalProgress = getTotalProgress();
  const progressPercentage = (totalProgress.completed / totalProgress.total) * 100;

  // Set up reminders for incomplete steps
  useEffect(() => {
    // Check if we've already set reminders today
    const remindersSet = localStorage.getItem(`steps_reminders_set_${today}`);
    if (remindersSet) return;
    
    // Set reminders based on time of day
    const now = new Date();
    const currentHour = now.getHours();
    
    // Morning reminders (if after 9 AM)
    if (currentHour >= 9 && currentHour < 12) {
      const morningSteps = stepsWithCompletedStatus.filter(step => 
        step.category === 'morning' && !step.completed
      );
      
      if (morningSteps.length > 0) {
        createReminder(
          'Morning Recovery Steps',
          `You have ${morningSteps.length} morning recovery steps to complete.`,
          {
            actionUrl: '/addiction-support',
            actionText: 'View Steps',
            priority: 'medium'
          }
        );
      }
    }
    
    // Afternoon reminders (if after 2 PM)
    if (currentHour >= 14 && currentHour < 17) {
      const afternoonSteps = stepsWithCompletedStatus.filter(step => 
        step.category === 'afternoon' && !step.completed
      );
      
      if (afternoonSteps.length > 0) {
        createReminder(
          'Afternoon Recovery Steps',
          `You have ${afternoonSteps.length} afternoon recovery steps to complete.`,
          {
            actionUrl: '/addiction-support',
            actionText: 'View Steps',
            priority: 'medium'
          }
        );
      }
    }
    
    // Evening reminders (if after 7 PM)
    if (currentHour >= 19 && currentHour < 22) {
      const eveningSteps = stepsWithCompletedStatus.filter(step => 
        step.category === 'evening' && !step.completed
      );
      
      if (eveningSteps.length > 0) {
        createReminder(
          'Evening Recovery Steps',
          `You have ${eveningSteps.length} evening recovery steps to complete before bed.`,
          {
            actionUrl: '/addiction-support',
            actionText: 'View Steps',
            priority: 'medium'
          }
        );
      }
    }
    
    // Mark that we've set reminders for today
    localStorage.setItem(`steps_reminders_set_${today}`, 'true');
  }, [stepsWithCompletedStatus, createReminder, today]);

  return (
    <Card variant="elevated" className="h-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Daily Recovery Steps
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Day {daysClean} • {totalProgress.completed}/{totalProgress.total} completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</div>
            <div className="text-xs text-gray-500">Progress</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Categories */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {categories.map(category => {
            const categorySteps = getStepsByCategory(category.id);
            const progress = getCategoryProgress(category.id);
            const isExpanded = expandedCategory === category.id;

            if (categorySteps.length === 0) return null;

            return (
              <div key={category.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{category.icon}</span>
                    <div className="text-left">
                      <h3 className={`font-medium ${category.color}`}>{category.name}</h3>
                      <p className="text-xs text-gray-500">
                        {progress.completed}/{progress.total} completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {categorySteps.map(step => {
                          const isCompleted = step.completed;
                          return (
                            <motion.div
                              key={step.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-3 rounded-lg border transition-all ${
                                isCompleted 
                                  ? 'bg-green-50 border-green-200' 
                                  : `${step.bgColor} border-gray-200 hover:border-gray-300`
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <button
                                  onClick={() => toggleStepCompletion(step.id)}
                                  className="mt-0.5 flex-shrink-0"
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                  )}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <step.icon className={`w-4 h-4 ${step.color}`} />
                                    <h4 className={`font-medium text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                      {step.title}
                                    </h4>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                      {step.estimatedTime}
                                    </span>
                                  </div>
                                  <p className={`text-xs leading-relaxed ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {step.description}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      step.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                      step.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {step.difficulty}
                                    </span>
                                    {!isCompleted && (
                                      <button
                                        onClick={() => {
                                          createReminder(
                                            `Reminder: ${step.title}`,
                                            `Don't forget to complete your ${step.title.toLowerCase()} step today.`,
                                            {
                                              actionUrl: '/addiction-support',
                                              actionText: 'View Steps',
                                              priority: 'medium'
                                            }
                                          );
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                      >
                                        <Bell size={10} />
                                        <span>Remind me</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Completion Celebration */}
        {progressPercentage === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-lg p-4 text-center"
          >
            <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-800 mb-1">All Steps Complete! 🎉</h3>
            <p className="text-sm text-green-700">
              You've completed all your daily recovery steps. You're building strong habits for lasting recovery!
            </p>
          </motion.div>
        )}

        {/* Motivational Footer */}
        <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Remember:</strong> Recovery is a journey, not a destination. Each step you take today builds a stronger tomorrow. 💪
          </p>
        </div>
      </div>
    </Card>
  );
};

export default DailyStepsCard;