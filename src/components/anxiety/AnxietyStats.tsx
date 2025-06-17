import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Target, Award, Brain } from 'lucide-react';
import Card from '../ui/Card';

interface AnxietyStatsProps {
  todaysSessions: any[];
  weeklyProgress: any;
  currentLevel: number;
}

const AnxietyStats: React.FC<AnxietyStatsProps> = ({ 
  todaysSessions, 
  weeklyProgress, 
  currentLevel 
}) => {
  const stats = [
    {
      label: 'Current Level',
      value: currentLevel,
      unit: '/10',
      change: weeklyProgress?.improvementTrend || 0,
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Sessions Today',
      value: todaysSessions?.length || 0,
      unit: '',
      change: 0,
      icon: Clock,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Weekly Sessions',
      value: weeklyProgress?.sessionsThisWeek || 0,
      unit: '',
      change: 0,
      icon: Award,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Most Effective',
      value: weeklyProgress?.mostEffectiveTechnique || 'Breathing',
      unit: '',
      change: 0,
      icon: Brain,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
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
        >
          <Card className="h-full">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              {stat.change !== 0 && (
                <div className={`flex items-center text-xs ${
                  stat.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change > 0 ? (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(stat.change).toFixed(1)}
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-baseline space-x-1">
                {typeof stat.value === 'number' ? (
                  <>
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                    <span className="text-sm text-gray-500">{stat.unit}</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-gray-900 capitalize">{stat.value}</span>
                )}
              </div>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AnxietyStats;