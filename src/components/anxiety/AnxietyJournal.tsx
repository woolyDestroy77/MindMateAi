import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, TrendingUp, BookOpen, X } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAnxietySupport } from '../../hooks/useAnxietySupport';

const AnxietyJournal: React.FC = () => {
  const { journalEntries, addJournalEntry } = useAnxietySupport();
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [formData, setFormData] = useState({
    anxiety_level: 5,
    triggers: [] as string[],
    physical_symptoms: [] as string[],
    thoughts: '',
    coping_strategies: [] as string[],
    mood_after: 5
  });
  const [triggerInput, setTriggerInput] = useState('');
  const [symptomInput, setSymptomInput] = useState('');
  const [strategyInput, setStrategyInput] = useState('');

  const commonTriggers = [
    'Work stress', 'Social situations', 'Health concerns', 'Financial worries',
    'Relationship issues', 'Traffic', 'Deadlines', 'Crowds', 'Public speaking',
    'Uncertainty', 'Conflict', 'Technology issues'
  ];

  const commonSymptoms = [
    'Racing heart', 'Sweating', 'Trembling', 'Shortness of breath',
    'Nausea', 'Dizziness', 'Muscle tension', 'Headache',
    'Fatigue', 'Restlessness', 'Hot flashes', 'Chest tightness'
  ];

  const commonStrategies = [
    'Deep breathing', 'Progressive muscle relaxation', 'Mindfulness',
    'Exercise', 'Talking to someone', 'Journaling', 'Listening to music',
    'Taking a walk', 'Meditation', 'Grounding techniques', 'Positive self-talk'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addJournalEntry(formData);
      setFormData({
        anxiety_level: 5,
        triggers: [],
        physical_symptoms: [],
        thoughts: '',
        coping_strategies: [],
        mood_after: 5
      });
      setShowNewEntry(false);
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  const addToArray = (
    field: 'triggers' | 'physical_symptoms' | 'coping_strategies',
    value: string,
    setValue: (value: string) => void
  ) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setValue('');
    }
  };

  const removeFromArray = (
    field: 'triggers' | 'physical_symptoms' | 'coping_strategies',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  const addCommonItem = (
    field: 'triggers' | 'physical_symptoms' | 'coping_strategies',
    value: string
  ) => {
    if (!formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Anxiety Journal</h2>
          <p className="text-gray-600">Track your anxiety patterns and triggers</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowNewEntry(true)}
          leftIcon={<Plus size={18} />}
          className="bg-gradient-to-r from-green-500 to-blue-500"
        >
          New Entry
        </Button>
      </div>

      {/* New Entry Modal */}
      <AnimatePresence>
        {showNewEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewEntry(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">New Anxiety Journal Entry</h3>
                  <button
                    onClick={() => setShowNewEntry(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Anxiety Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Anxiety Level: {formData.anxiety_level}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.anxiety_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, anxiety_level: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Calm</span>
                    <span>Severe</span>
                  </div>
                </div>

                {/* Triggers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What triggered your anxiety?
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={triggerInput}
                      onChange={(e) => setTriggerInput(e.target.value)}
                      placeholder="Add a trigger..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('triggers', triggerInput, setTriggerInput))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addToArray('triggers', triggerInput, setTriggerInput)}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.triggers.map((trigger) => (
                      <span
                        key={trigger}
                        className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {trigger}
                        <button
                          type="button"
                          onClick={() => removeFromArray('triggers', trigger)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-600 mb-2">Common triggers:</div>
                  <div className="flex flex-wrap gap-2">
                    {commonTriggers.map((trigger) => (
                      <button
                        key={trigger}
                        type="button"
                        onClick={() => addCommonItem('triggers', trigger)}
                        disabled={formData.triggers.includes(trigger)}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {trigger}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Physical Symptoms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Physical symptoms experienced
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      placeholder="Add a symptom..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('physical_symptoms', symptomInput, setSymptomInput))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addToArray('physical_symptoms', symptomInput, setSymptomInput)}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.physical_symptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {symptom}
                        <button
                          type="button"
                          onClick={() => removeFromArray('physical_symptoms', symptom)}
                          className="ml-2 text-orange-600 hover:text-orange-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-600 mb-2">Common symptoms:</div>
                  <div className="flex flex-wrap gap-2">
                    {commonSymptoms.map((symptom) => (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => addCommonItem('physical_symptoms', symptom)}
                        disabled={formData.physical_symptoms.includes(symptom)}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thoughts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What thoughts were going through your mind?
                  </label>
                  <textarea
                    value={formData.thoughts}
                    onChange={(e) => setFormData(prev => ({ ...prev, thoughts: e.target.value }))}
                    placeholder="Describe your thoughts and feelings..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                {/* Coping Strategies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What coping strategies did you use?
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={strategyInput}
                      onChange={(e) => setStrategyInput(e.target.value)}
                      placeholder="Add a coping strategy..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('coping_strategies', strategyInput, setStrategyInput))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addToArray('coping_strategies', strategyInput, setStrategyInput)}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.coping_strategies.map((strategy) => (
                      <span
                        key={strategy}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {strategy}
                        <button
                          type="button"
                          onClick={() => removeFromArray('coping_strategies', strategy)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-600 mb-2">Common strategies:</div>
                  <div className="flex flex-wrap gap-2">
                    {commonStrategies.map((strategy) => (
                      <button
                        key={strategy}
                        type="button"
                        onClick={() => addCommonItem('coping_strategies', strategy)}
                        disabled={formData.coping_strategies.includes(strategy)}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {strategy}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood After */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How do you feel now? {formData.mood_after}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.mood_after}
                    onChange={(e) => setFormData(prev => ({ ...prev, mood_after: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Much worse</span>
                    <span>Much better</span>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => setShowNewEntry(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    className="bg-gradient-to-r from-green-500 to-blue-500"
                  >
                    Save Entry
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journal Entries */}
      <div className="space-y-4">
        {journalEntries.length === 0 ? (
          <Card className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries yet</h3>
            <p className="text-gray-600 mb-4">
              Start tracking your anxiety patterns by creating your first entry.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowNewEntry(true)}
              leftIcon={<Plus size={18} />}
              className="bg-gradient-to-r from-green-500 to-blue-500"
            >
              Create First Entry
            </Button>
          </Card>
        ) : (
          journalEntries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Anxiety: </span>
                        <span className={`font-medium ${
                          entry.anxiety_level <= 3 ? 'text-green-600' :
                          entry.anxiety_level <= 6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {entry.anxiety_level}/10
                        </span>
                      </div>
                      {entry.mood_after !== entry.anxiety_level && (
                        <div className="flex items-center space-x-1 text-sm">
                          <TrendingUp className={`w-4 h-4 ${
                            entry.mood_after > entry.anxiety_level ? 'text-green-500' : 'text-red-500'
                          }`} />
                          <span className={entry.mood_after > entry.anxiety_level ? 'text-green-600' : 'text-red-600'}>
                            {entry.mood_after}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {entry.thoughts && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Thoughts & Feelings</h4>
                      <p className="text-gray-700 text-sm">{entry.thoughts}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {entry.triggers.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 text-sm">Triggers</h4>
                        <div className="flex flex-wrap gap-1">
                          {entry.triggers.map((trigger) => (
                            <span
                              key={trigger}
                              className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs"
                            >
                              {trigger}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {entry.physical_symptoms.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 text-sm">Symptoms</h4>
                        <div className="flex flex-wrap gap-1">
                          {entry.physical_symptoms.map((symptom) => (
                            <span
                              key={symptom}
                              className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs"
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {entry.coping_strategies.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 text-sm">Coping Strategies</h4>
                        <div className="flex flex-wrap gap-1">
                          {entry.coping_strategies.map((strategy) => (
                            <span
                              key={strategy}
                              className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                            >
                              {strategy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnxietyJournal;