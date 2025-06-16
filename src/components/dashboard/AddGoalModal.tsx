import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Target, Lightbulb, Star } from 'lucide-react';
import Button from '../ui/Button';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (goalText: string, pointsValue: number) => Promise<void>;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onAddGoal }) => {
  const [goalText, setGoalText] = useState('');
  const [pointsValue, setPointsValue] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestedGoals = [
    { text: 'Take a 10-minute walk outside', points: 6 },
    { text: 'Practice deep breathing for 5 minutes', points: 4 },
    { text: 'Write down 3 positive affirmations', points: 5 },
    { text: 'Drink 8 glasses of water today', points: 3 },
    { text: 'Call a friend or family member', points: 7 },
    { text: 'Read for 15 minutes', points: 4 },
    { text: 'Do 10 minutes of stretching', points: 5 },
    { text: 'Listen to calming music', points: 3 },
    { text: 'Organize one small area of your space', points: 4 },
    { text: 'Practice mindfulness meditation', points: 8 }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddGoal(goalText.trim(), pointsValue);
      setGoalText('');
      setPointsValue(5);
      onClose();
    } catch (error) {
      console.error('Error adding goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestedGoalClick = (goal: { text: string; points: number }) => {
    setGoalText(goal.text);
    setPointsValue(goal.points);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setGoalText('');
      setPointsValue(5);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-lavender-100 to-sage-100 rounded-lg">
                    <Target className="w-6 h-6 text-lavender-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add Daily Goal</h2>
                    <p className="text-sm text-gray-600">Create a custom wellness goal for today</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Custom Goal Input */}
                <div>
                  <label htmlFor="goalText" className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Description
                  </label>
                  <textarea
                    id="goalText"
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder="Enter your wellness goal for today..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={200}
                    required
                  />
                  <div className="mt-1 text-xs text-gray-500 text-right">
                    {goalText.length}/200 characters
                  </div>
                </div>

                {/* Points Value */}
                <div>
                  <label htmlFor="pointsValue" className="block text-sm font-medium text-gray-700 mb-2">
                    Wellness Points Value
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      id="pointsValue"
                      min="1"
                      max="10"
                      value={pointsValue}
                      onChange={(e) => setPointsValue(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center space-x-2 min-w-[80px]">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900">{pointsValue} pts</span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Higher points for more challenging or important goals
                  </div>
                </div>

                {/* Suggested Goals */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Suggested Goals</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {suggestedGoals.map((goal, index) => (
                      <motion.button
                        key={index}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSuggestedGoalClick(goal)}
                        className="text-left p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-lavender-50 hover:to-sage-50 border border-gray-200 hover:border-lavender-300 rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1 pr-2">
                            {goal.text}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <span>{goal.points}</span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={!goalText.trim() || isSubmitting}
                    isLoading={isSubmitting}
                    leftIcon={<Plus size={18} />}
                    className="bg-gradient-to-r from-lavender-500 to-sage-500 hover:from-lavender-600 hover:to-sage-600"
                  >
                    {isSubmitting ? 'Adding Goal...' : 'Add Goal'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddGoalModal;