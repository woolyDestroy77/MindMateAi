import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Calendar, Heart, Brain, TrendingUp, CheckCircle, Target, MessageSquare, Zap } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
  date?: string;
}

interface AchievementsCardProps {
  moodData: any[];
  journalEntries: any[];
  anxietySessions: any[];
  addictionData: any;
  completedGoals: Set<string>;
}

const AchievementsCard: React.FC<AchievementsCardProps> = ({
  moodData,
  journalEntries,
  anxietySessions,
  addictionData,
  completedGoals
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAll, setShowAll] = useState(false);
  
  // Calculate achievements based on user data
  useEffect(() => {
    const calculateAchievements = () => {
      const allAchievements: Achievement[] = [
        // Streak achievements
        {
          id: 'streak-3',
          title: '3-Day Streak',
          description: 'Logged in for 3 consecutive days',
          icon: Calendar,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          isUnlocked: moodData.length >= 3,
          progress: Math.min(moodData.length, 3),
          maxProgress: 3
        },
        {
          id: 'streak-7',
          title: '7-Day Streak',
          description: 'Logged in for 7 consecutive days',
          icon: Calendar,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          isUnlocked: moodData.length >= 7,
          progress: Math.min(moodData.length, 7),
          maxProgress: 7
        },
        {
          id: 'streak-30',
          title: 'Monthly Dedication',
          description: 'Logged in for 30 consecutive days',
          icon: Calendar,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          isUnlocked: moodData.length >= 30,
          progress: Math.min(moodData.length, 30),
          maxProgress: 30
        },
        
        // Journal achievements
        {
          id: 'journal-1',
          title: 'First Entry',
          description: 'Created your first journal entry',
          icon: Heart,
          color: 'text-pink-600',
          bgColor: 'bg-pink-100',
          isUnlocked: journalEntries.length >= 1,
          progress: Math.min(journalEntries.length, 1),
          maxProgress: 1
        },
        {
          id: 'journal-5',
          title: 'Consistent Journaling',
          description: 'Created 5 journal entries',
          icon: Heart,
          color: 'text-pink-600',
          bgColor: 'bg-pink-100',
          isUnlocked: journalEntries.length >= 5,
          progress: Math.min(journalEntries.length, 5),
          maxProgress: 5
        },
        {
          id: 'journal-20',
          title: 'Journal Master',
          description: 'Created 20 journal entries',
          icon: Heart,
          color: 'text-pink-600',
          bgColor: 'bg-pink-100',
          isUnlocked: journalEntries.length >= 20,
          progress: Math.min(journalEntries.length, 20),
          maxProgress: 20
        },
        
        // Anxiety achievements
        {
          id: 'anxiety-1',
          title: 'Anxiety Manager',
          description: 'Completed your first anxiety session',
          icon: Brain,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          isUnlocked: anxietySessions.length >= 1,
          progress: Math.min(anxietySessions.length, 1),
          maxProgress: 1
        },
        {
          id: 'anxiety-10',
          title: 'Anxiety Expert',
          description: 'Completed 10 anxiety sessions',
          icon: Brain,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          isUnlocked: anxietySessions.length >= 10,
          progress: Math.min(anxietySessions.length, 10),
          maxProgress: 10
        },
        
        // Mood tracking achievements
        {
          id: 'mood-5',
          title: 'Mood Tracker',
          description: 'Tracked 5 different moods',
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          isUnlocked: moodData.length >= 5,
          progress: Math.min(moodData.length, 5),
          maxProgress: 5
        },
        {
          id: 'mood-improvement',
          title: 'Mood Improver',
          description: 'Showed positive mood trend for 3+ days',
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          isUnlocked: moodData.length >= 3 && moodData[moodData.length - 1]?.wellnessScore > moodData[0]?.wellnessScore,
          progress: moodData.length >= 3 ? 1 : 0,
          maxProgress: 1
        },
        
        // Goals achievements
        {
          id: 'goals-1',
          title: 'Goal Setter',
          description: 'Completed your first daily goal',
          icon: Target,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          isUnlocked: completedGoals.size >= 1,
          progress: Math.min(completedGoals.size, 1),
          maxProgress: 1
        },
        {
          id: 'goals-5',
          title: 'Goal Crusher',
          description: 'Completed 5 daily goals',
          icon: Target,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          isUnlocked: completedGoals.size >= 5,
          progress: Math.min(completedGoals.size, 5),
          maxProgress: 5
        },
        {
          id: 'goals-all',
          title: 'Overachiever',
          description: 'Completed all daily goals in one day',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          isUnlocked: completedGoals.size >= 5,
          progress: completedGoals.size,
          maxProgress: 5
        },
        
        // Chat achievements
        {
          id: 'chat-10',
          title: 'Conversation Master',
          description: 'Had 10 meaningful AI chat conversations',
          icon: MessageSquare,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          isUnlocked: moodData.length >= 10,
          progress: Math.min(moodData.length, 10),
          maxProgress: 10
        },
        
        // Addiction recovery achievements
        {
          id: 'recovery-1',
          title: 'First Step',
          description: 'Started tracking your recovery journey',
          icon: Heart,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          isUnlocked: addictionData?.userAddictions?.length > 0,
          progress: addictionData?.userAddictions?.length > 0 ? 1 : 0,
          maxProgress: 1
        },
        {
          id: 'recovery-7',
          title: 'One Week Clean',
          description: 'Maintained 7 days of sobriety',
          icon: Award,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          isUnlocked: addictionData?.userAddictions?.some((a: any) => a.days_clean >= 7),
          progress: addictionData?.userAddictions?.length > 0 ? 
            Math.min(addictionData.userAddictions[0].days_clean, 7) : 0,
          maxProgress: 7
        },
        {
          id: 'recovery-30',
          title: 'One Month Milestone',
          description: 'Maintained 30 days of sobriety',
          icon: Award,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          isUnlocked: addictionData?.userAddictions?.some((a: any) => a.days_clean >= 30),
          progress: addictionData?.userAddictions?.length > 0 ? 
            Math.min(addictionData.userAddictions[0].days_clean, 30) : 0,
          maxProgress: 30
        }
      ];

      // Add dates to unlocked achievements
      const achievementsWithDates = allAchievements.map(achievement => {
        if (achievement.isUnlocked) {
          return {
            ...achievement,
            date: new Date().toISOString()
          };
        }
        return achievement;
      });

      setAchievements(achievementsWithDates);
    };

    calculateAchievements();
  }, [moodData, journalEntries, anxietySessions, addictionData, completedGoals]);

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);
  
  const displayedAchievements = showAll 
    ? achievements 
    : [...unlockedAchievements.slice(0, 4), ...lockedAchievements.slice(0, 4 - Math.min(unlockedAchievements.length, 4))];

  return (
    <Card variant="elevated" className="h-full">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
          <Award className="text-lavender-500" size={20} />
        </div>
        
        {achievements.length === 0 ? (
          <div className="text-center py-6">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Loading achievements...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {displayedAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg text-center ${
                    achievement.isUnlocked 
                      ? achievement.bgColor
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <div className="relative">
                    {achievement.isUnlocked ? (
                      <achievement.icon className={`w-6 h-6 mx-auto ${achievement.color} mb-2`} />
                    ) : (
                      <div className="relative">
                        <achievement.icon className="w-6 h-6 mx-auto text-gray-400 mb-2 opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-gray-300"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <h3 className={`text-sm font-medium ${achievement.isUnlocked ? achievement.color.replace('text-', 'text-') : 'text-gray-500'}`}>
                    {achievement.title}
                  </h3>
                  
                  <p className="text-xs mt-1 opacity-80">
                    {achievement.description}
                  </p>
                  
                  {achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-white/50 rounded-full h-1.5 mb-1">
                        <div 
                          className={`h-1.5 rounded-full ${achievement.isUnlocked ? achievement.color.replace('text-', 'bg-') : 'bg-gray-300'}`}
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs opacity-70">
                        {achievement.progress}/{achievement.maxProgress}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {achievements.length > 8 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Show Less' : `Show All (${achievements.length})`}
                </Button>
              </div>
            )}
            
            <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
              <p>
                {unlockedAchievements.length} of {achievements.length} achievements unlocked
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default AchievementsCard;