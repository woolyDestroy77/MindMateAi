import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Heart, Shield, Brain, Zap } from 'lucide-react';
import Card from '../ui/Card';
import { DailyTip } from '../../hooks/useAddictionSupport';

interface DailyTipCardProps {
  tip: DailyTip;
  daysClean: number;
}

const DailyTipCard: React.FC<DailyTipCardProps> = ({ tip, daysClean }) => {
  // Store the current tip in localStorage to persist across page reloads and navigation
  useEffect(() => {
    if (tip) {
      localStorage.setItem('currentDailyTip', JSON.stringify(tip));
    }
  }, [tip]);

  // Get the stored tip from localStorage if available
  const [displayTip, setDisplayTip] = useState<DailyTip | null>(null);

  useEffect(() => {
    // If we have a prop tip, use it
    if (tip) {
      setDisplayTip(tip);
      return;
    }
    
    // Otherwise try to load from localStorage
    try {
      const savedTip = localStorage.getItem('currentDailyTip');
      if (savedTip) {
        setDisplayTip(JSON.parse(savedTip));
      }
    } catch (error) {
      console.error('Error loading saved daily tip:', error);
    }
  }, [tip]);

  // If no tip is available, don't render anything
  if (!displayTip) return null;

  const getIconForTipType = (tipType: string) => {
    switch (tipType) {
      case 'motivation':
        return <Heart className="w-5 h-5" />;
      case 'coping':
        return <Brain className="w-5 h-5" />;
      case 'prevention':
        return <Shield className="w-5 h-5" />;
      case 'health':
        return <Zap className="w-5 h-5" />;
      case 'mindfulness':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getColorForTipType = (tipType: string) => {
    switch (tipType) {
      case 'motivation':
        return 'from-red-100 to-pink-100 border-red-200 text-red-700';
      case 'coping':
        return 'from-blue-100 to-indigo-100 border-blue-200 text-blue-700';
      case 'prevention':
        return 'from-green-100 to-emerald-100 border-green-200 text-green-700';
      case 'health':
        return 'from-yellow-100 to-orange-100 border-yellow-200 text-yellow-700';
      case 'mindfulness':
        return 'from-purple-100 to-violet-100 border-purple-200 text-purple-700';
      default:
        return 'from-gray-100 to-slate-100 border-gray-200 text-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`bg-gradient-to-br ${getColorForTipType(displayTip.tip_type)} border`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-white/50 ${getColorForTipType(displayTip.tip_type)}`}>
                {getIconForTipType(displayTip.tip_type)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{displayTip.title}</h3>
                <p className="text-sm opacity-80 capitalize">
                  {displayTip.tip_type} • Day {daysClean} of Recovery
                </p>
              </div>
            </div>
            <div className="text-2xl">💡</div>
          </div>
          
          <div className="bg-white/30 rounded-lg p-4">
            <p className="text-sm leading-relaxed">{displayTip.content}</p>
          </div>
          
          <div className="flex items-center justify-between text-xs opacity-75">
            <span>Daily Recovery Tip</span>
            <span>Keep going strong! 💪</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default DailyTipCard;