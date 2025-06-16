import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Target, X, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface ProgressReminderProps {
  daysClean: number;
  addictionName: string;
  canMarkToday: boolean;
  onMarkCleanDay: () => void;
  lastMarkedDate?: string;
}

const ProgressReminder: React.FC<ProgressReminderProps> = ({
  daysClean,
  addictionName,
  canMarkToday,
  onMarkCleanDay,
  lastMarkedDate
}) => {
  const [showReminder, setShowReminder] = useState(false);
  const [timeUntilNextDay, setTimeUntilNextDay] = useState('');

  // Calculate time until next day
  useEffect(() => {
    const updateTimeUntilNextDay = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilNextDay(`${hours}h ${minutes}m`);
    };

    updateTimeUntilNextDay();
    const interval = setInterval(updateTimeUntilNextDay, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Show reminder if user can mark today and hasn't been reminded recently
  useEffect(() => {
    if (canMarkToday) {
      const reminderShown = localStorage.getItem(`reminder_shown_${new Date().toDateString()}`);
      if (!reminderShown) {
        setShowReminder(true);
      }
    }
  }, [canMarkToday]);

  const handleMarkCleanDay = () => {
    onMarkCleanDay();
    setShowReminder(false);
    localStorage.setItem(`reminder_shown_${new Date().toDateString()}`, 'true');
  };

  const handleDismissReminder = () => {
    setShowReminder(false);
    localStorage.setItem(`reminder_shown_${new Date().toDateString()}`, 'true');
  };

  const getMotivationalMessage = () => {
    if (daysClean === 0) {
      return "Today is Day 1 of your recovery journey. Every journey begins with a single step! 🌟";
    } else if (daysClean < 7) {
      return `Day ${daysClean + 1} awaits! You're building momentum one day at a time. 💪`;
    } else if (daysClean < 30) {
      return `${daysClean + 1} days strong! You're proving to yourself that recovery is possible. 🔥`;
    } else if (daysClean < 90) {
      return `Over a month clean! Day ${daysClean + 1} is another step toward lasting freedom. 🚀`;
    } else {
      return `${daysClean + 1} days of strength and courage! You're an inspiration. ✨`;
    }
  };

  return (
    <>
      {/* Daily Progress Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Daily Progress</h3>
                <p className="text-sm text-blue-700">{addictionName} Recovery</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{daysClean}</div>
              <div className="text-xs text-blue-600">days clean</div>
            </div>
          </div>

          {canMarkToday ? (
            <div className="space-y-3">
              <div className="bg-white/50 rounded-lg p-3">
                <p className="text-sm text-blue-800 mb-2">
                  {getMotivationalMessage()}
                </p>
                <p className="text-xs text-blue-600">
                  Mark today as another clean day to continue your streak!
                </p>
              </div>
              <Button
                variant="primary"
                fullWidth
                onClick={handleMarkCleanDay}
                leftIcon={<CheckCircle size={18} />}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                Mark Day {daysClean + 1} Complete
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-100 rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Day {daysClean} Completed! 🎉
                  </span>
                </div>
                <p className="text-xs text-green-700">
                  You've already marked today as clean. Come back tomorrow for Day {daysClean + 1}!
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-blue-600">
                <Clock className="w-3 h-3" />
                <span>Next check-in available in {timeUntilNextDay}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Floating Reminder Modal */}
      <AnimatePresence>
        {showReminder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            <Card className="bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Daily Check-in</span>
                  </div>
                  <button
                    onClick={handleDismissReminder}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div>
                  <p className="text-sm text-green-800 mb-2">
                    Ready to mark another clean day? 
                  </p>
                  <p className="text-xs text-green-700">
                    You're on day {daysClean} - keep the momentum going!
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDismissReminder}
                    className="flex-1 text-xs"
                  >
                    Later
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleMarkCleanDay}
                    leftIcon={<CheckCircle size={14} />}
                    className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                  >
                    Mark Clean
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProgressReminder;