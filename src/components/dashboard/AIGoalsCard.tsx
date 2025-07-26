import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  CheckCircle, 
  Circle, 
  X, 
  RefreshCw, 
  Lightbulb, 
  Heart, 
  Users, 
  Shield, 
  Activity,
  Clock,
  Star,
  Info,
  Zap
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAIGoals, AIGoal } from '../../hooks/useAIGoals';
import { useNotificationContext } from '../notifications/NotificationProvider';

const AIGoalsCard: React.FC = () => {
  const { 
    aiGoals, 
    userProfile, 
    isGenerating, 
    generateDailyAIGoals, 
    completeAIGoal, 
    removeAIGoal 
  } = useAIGoals();
  
  const { createAchievement } = useNotificationContext();
  const [showReasoningFor, setShowReasoningFor] = useState<string | null>(null);

  const handleCompleteGoal = (goal: AIGoal) => {
    completeAIGoal(goal.id);
    
    // Create achievement notification
    createAchievement(
      `AI Goal Completed: ${goal.text}`,
      `You've completed an AI-recommended goal! This helps improve your ${goal.category.toLowerCase()}.`,
      {
        actionUrl: '/dashboard',
        actionText: 'View Progress'
      }
    );
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'mental_health':
        return <Brain className="w-4 h-4" />;
      case 'physical_wellness':
        return <Activity className="w-4 h-4" />;
      case 'social_connection':
        return <Users className="w-4 h-4" />;
      case 'self_care':
        return <Heart className="w-4 h-4" />;
      case 'recovery':
        return <Shield className="w-4 h-4" />;
      case 'anxiety_management':
        return <Brain className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getGoalColor = (type: string) => {
    switch (type) {
      case 'mental_health':
        return 'text-purple-600 bg-purple-50';
      case 'physical_wellness':
        return 'text-green-600 bg-green-50';
      case 'social_connection':
        return 'text-blue-600 bg-blue-50';
      case 'self_care':
        return 'text-pink-600 bg-pink-50';
      case 'recovery':
        return 'text-red-600 bg-red-50';
      case 'anxiety_management':
        return 'text-indigo-600 bg-indigo-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const completedGoals = aiGoals.filter(goal => goal.completed);
  const pendingGoals = aiGoals.filter(goal => !goal.completed);
  const totalPoints = completedGoals.reduce((sum, goal) => sum + goal.pointsValue, 0);

  return (
    <Card variant="elevated" className="h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI-Recommended Goals</h2>
              <p className="text-sm text-gray-600">Personalized for your mental health journey</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateDailyAIGoals}
            isLoading={isGenerating}
            leftIcon={<RefreshCw size={16} />}
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            {aiGoals.length === 0 ? 'Generate' : 'Refresh'}
          </Button>
        </div>

        {/* Progress Summary */}
        {aiGoals.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-900">
                  {completedGoals.length} of {aiGoals.length} goals completed
                </div>
                <div className="text-xs text-purple-700">
                  {totalPoints} AI points earned today
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-800">
                {Math.round((completedGoals.length / aiGoals.length) * 100)}%
              </div>
            </div>
            <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedGoals.length / aiGoals.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {aiGoals.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Goals Yet</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Let our AI analyze your mental health data and generate personalized daily goals.
              </p>
              <Button
                variant="primary"
                onClick={generateDailyAIGoals}
                isLoading={isGenerating}
                leftIcon={<Zap size={18} />}
                className="bg-gradient-to-r from-purple-500 to-blue-500"
              >
                Generate AI Goals
              </Button>
            </div>
          ) : (
            <>
              {/* Pending Goals */}
              {pendingGoals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => handleCompleteGoal(goal)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      <Circle className="w-5 h-5 text-gray-400 hover:text-purple-600" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${getGoalColor(goal.type)}`}>
                          {getGoalIcon(goal.type)}
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm">{goal.text}</h4>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(goal.priority)}`}>
                          {goal.priority} priority
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(goal.difficulty)}`}>
                          {goal.difficulty}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center">
                          <Clock size={10} className="mr-1" />
                          {goal.estimatedTime}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center">
                          <Star size={10} className="mr-1" />
                          {goal.pointsValue} pts
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        <strong>Category:</strong> {goal.category}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setShowReasoningFor(
                            showReasoningFor === goal.id ? null : goal.id
                          )}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center"
                        >
                          <Info size={12} className="mr-1" />
                          {showReasoningFor === goal.id ? 'Hide' : 'Why this goal?'}
                        </button>
                        
                        <button
                          onClick={() => removeAIGoal(goal.id)}
                          className="text-xs text-gray-400 hover:text-red-600 p-1"
                          title="Remove goal"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      
                      <AnimatePresence>
                        {showReasoningFor === goal.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-2"
                          >
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                              <div className="flex items-start space-x-2">
                                <Lightbulb className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-purple-800 leading-relaxed">
                                  {goal.reasoning}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Completed Goals */}
              {completedGoals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-green-200 rounded-lg p-4 bg-green-50"
                >
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${getGoalColor(goal.type)}`}>
                          {getGoalIcon(goal.type)}
                        </div>
                        <h4 className="font-medium text-gray-700 text-sm line-through">{goal.text}</h4>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          ✓ Completed
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center">
                          <Star size={10} className="mr-1" />
                          +{goal.pointsValue} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>

        {/* User Profile Summary (if available) */}
        {userProfile && aiGoals.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                AI Analysis Summary
              </h4>
              <div className="text-xs text-blue-800 space-y-1">
                <div>Current mood: {userProfile.moodName} {userProfile.currentMood}</div>
                <div>Wellness score: {userProfile.wellnessScore}/100</div>
                {userProfile.hasAddictions && (
                  <div>Recovery: Day {userProfile.daysClean} clean</div>
                )}
                {userProfile.recentAnxietyLevel && (
                  <div>Recent anxiety: {userProfile.recentAnxietyLevel.toFixed(1)}/10</div>
                )}
                <div className="pt-1 text-blue-700">
                  Goals personalized based on your current mental health data
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIGoalsCard;