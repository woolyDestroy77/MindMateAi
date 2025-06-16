import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, AlertTriangle, Award, Users, Target, Clock } from 'lucide-react';
import Button from '../ui/Button';

interface TrackingEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    entry_type: 'craving' | 'relapse' | 'milestone' | 'support' | 'trigger' | 'success';
    intensity_level?: number;
    trigger_identified?: string;
    coping_strategy_used?: string;
    notes?: string;
    mood_before?: string;
    mood_after?: string;
    location?: string;
    support_used: boolean;
  }) => Promise<void>;
  addictionId: string | null;
}

const TrackingEntryModal: React.FC<TrackingEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  addictionId 
}) => {
  const [entryType, setEntryType] = useState<'craving' | 'relapse' | 'milestone' | 'support' | 'trigger' | 'success'>('craving');
  const [intensityLevel, setIntensityLevel] = useState(5);
  const [triggerIdentified, setTriggerIdentified] = useState('');
  const [copingStrategyUsed, setCopingStrategyUsed] = useState('');
  const [notes, setNotes] = useState('');
  const [moodBefore, setMoodBefore] = useState('');
  const [moodAfter, setMoodAfter] = useState('');
  const [location, setLocation] = useState('');
  const [supportUsed, setSupportUsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entryTypes = [
    { 
      value: 'craving', 
      label: 'Craving', 
      icon: Clock, 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      description: 'Log when you experience urges or cravings'
    },
    { 
      value: 'success', 
      label: 'Success', 
      icon: Award, 
      color: 'bg-green-100 text-green-800 border-green-300',
      description: 'Celebrate victories and positive moments'
    },
    { 
      value: 'trigger', 
      label: 'Trigger', 
      icon: Target, 
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      description: 'Identify situations that trigger urges'
    },
    { 
      value: 'support', 
      label: 'Support', 
      icon: Users, 
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      description: 'Record when you reached out for help'
    },
    { 
      value: 'relapse', 
      label: 'Relapse', 
      icon: AlertTriangle, 
      color: 'bg-red-100 text-red-800 border-red-300',
      description: 'Track setbacks to learn and improve'
    },
    { 
      value: 'milestone', 
      label: 'Milestone', 
      icon: Award, 
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      description: 'Celebrate important achievements'
    }
  ];

  const moodOptions = ['😊 Happy', '😌 Calm', '😐 Neutral', '😕 Sad', '😠 Angry', '😰 Anxious', '😴 Tired'];

  const resetForm = () => {
    setEntryType('craving');
    setIntensityLevel(5);
    setTriggerIdentified('');
    setCopingStrategyUsed('');
    setNotes('');
    setMoodBefore('');
    setMoodAfter('');
    setLocation('');
    setSupportUsed(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addictionId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        entry_type: entryType,
        intensity_level: ['craving', 'trigger'].includes(entryType) ? intensityLevel : undefined,
        trigger_identified: triggerIdentified || undefined,
        coping_strategy_used: copingStrategyUsed || undefined,
        notes: notes || undefined,
        mood_before: moodBefore || undefined,
        mood_after: moodAfter || undefined,
        location: location || undefined,
        support_used: supportUsed
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting tracking entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEntryType = entryTypes.find(type => type.value === entryType);

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
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                    <Heart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Track Your Progress</h2>
                    <p className="text-sm text-gray-600">Every entry helps you understand your journey better</p>
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

            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Entry Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What would you like to track?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {entryTypes.map((type) => (
                      <motion.button
                        key={type.value}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEntryType(type.value as any)}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          entryType === type.value
                            ? type.color
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <type.icon className="w-5 h-5" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <p className="text-xs text-gray-600">{type.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Intensity Level (for cravings and triggers) */}
                {['craving', 'trigger'].includes(entryType) && (
                  <div>
                    <label htmlFor="intensityLevel" className="block text-sm font-medium text-gray-700 mb-2">
                      Intensity Level ({intensityLevel}/10)
                    </label>
                    <input
                      type="range"
                      id="intensityLevel"
                      min="1"
                      max="10"
                      value={intensityLevel}
                      onChange={(e) => setIntensityLevel(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Mild (1)</span>
                      <span>Moderate (5)</span>
                      <span>Intense (10)</span>
                    </div>
                  </div>
                )}

                {/* Trigger Identification */}
                <div>
                  <label htmlFor="trigger" className="block text-sm font-medium text-gray-700 mb-2">
                    What triggered this? (optional)
                  </label>
                  <input
                    type="text"
                    id="trigger"
                    value={triggerIdentified}
                    onChange={(e) => setTriggerIdentified(e.target.value)}
                    placeholder="e.g., stress, social situation, boredom..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Coping Strategy */}
                {entryType !== 'relapse' && (
                  <div>
                    <label htmlFor="coping" className="block text-sm font-medium text-gray-700 mb-2">
                      Coping strategy used (optional)
                    </label>
                    <input
                      type="text"
                      id="coping"
                      value={copingStrategyUsed}
                      onChange={(e) => setCopingStrategyUsed(e.target.value)}
                      placeholder="e.g., deep breathing, called support person, went for a walk..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Mood Before/After */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="moodBefore" className="block text-sm font-medium text-gray-700 mb-2">
                      Mood before (optional)
                    </label>
                    <select
                      id="moodBefore"
                      value={moodBefore}
                      onChange={(e) => setMoodBefore(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select mood...</option>
                      {moodOptions.map((mood) => (
                        <option key={mood} value={mood}>{mood}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="moodAfter" className="block text-sm font-medium text-gray-700 mb-2">
                      Mood after (optional)
                    </label>
                    <select
                      id="moodAfter"
                      value={moodAfter}
                      onChange={(e) => setMoodAfter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select mood...</option>
                      {moodOptions.map((mood) => (
                        <option key={mood} value={mood}>{mood}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., home, work, bar, friend's house..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Support Used */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={supportUsed}
                      onChange={(e) => setSupportUsed(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      I reached out for support during this experience
                    </span>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional thoughts, feelings, or observations..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
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
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    leftIcon={selectedEntryType?.icon ? <selectedEntryType.icon size={18} /> : <Heart size={18} />}
                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    {isSubmitting ? 'Saving...' : `Track ${selectedEntryType?.label}`}
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

export default TrackingEntryModal;