import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, Smile, Clock, Lightbulb, AlertTriangle, Heart, Brain, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { format } from 'date-fns';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, mood: string, tags: string[], metadata: any) => Promise<void>;
  initialContent?: string;
  initialMood?: string;
  initialTags?: string[];
  initialMetadata?: any;
}

const MOODS = ['😊', '😌', '😐', '😕', '😢', '😠', '😴', '🤔', '😰', '🥰', '🤩', '😤', '🙄', '😓', '😎', '🥳'];

const PROMPT_CATEGORIES = [
  {
    name: 'Reflection',
    icon: Brain,
    color: 'text-purple-600',
    prompts: [
      "What made you smile today?",
      "What are three things you\'re grateful for today?",
      "What\'s something you learned today?",
      "What\'s something you're proud of accomplishing recently?",
      "How have you grown in the past month?"
    ]
  },
  {
    name: 'Emotional',
    icon: Heart,
    color: 'text-red-600',
    prompts: [
      "How are you feeling right now? Why might you be feeling this way?",
      "What emotions have been most present for you today?",
      "What triggered strong emotions for you today?",
      "How did you respond to difficult emotions today?",
      "What would help you feel better right now?"
    ]
  },
  {
    name: 'Mindfulness',
    icon: Lightbulb,
    color: 'text-yellow-600',
    prompts: [
      "What are five things you can see, four things you can touch, three things you can hear, two things you can smell, and one thing you can taste right now?",
      "Describe your surroundings in detail. What do you notice that you usually don\'t?",
      "What sensations are you feeling in your body right now?",
      "What thoughts keep recurring in your mind today?",
      "If your mind was a weather pattern today, what would it be and why?"
    ]
  },
  {
    name: 'Challenges',
    icon: Shield,
    color: 'text-blue-600',
    prompts: [
      "What\'s something you're struggling with right now?",
      "What\'s a challenge you faced today and how did you handle it?",
      "What\'s something you're worried about? What\'s the worst that could happen? What's most likely to happen?",
      "What\'s a problem you're facing that you could use a different perspective on?",
      "What\'s something difficult you've been avoiding? What\'s one small step you could take?"
    ]
  }
];

const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialContent = '',
  initialMood = '😊',
  initialTags = [],
  initialMetadata = {}
}) => {
  const [content, setContent] = useState(initialContent);
  const [selectedMood, setSelectedMood] = useState(initialMood);
  const [tags, setTags] = useState(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Reflection');
  const [metadata, setMetadata] = useState({
    location: '',
    weather: '',
    energy_level: 5,
    sleep_hours: 7,
    activities: [],
    ...initialMetadata
  });
  const [activityInput, setActivityInput] = useState('');
  const [showMetadata, setShowMetadata] = useState(false);

  // Update word and character count when content changes
  useEffect(() => {
    setCharacterCount(content.length);
    setWordCount(content.trim() === '' ? 0 : content.trim().split(/\s+/).length);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content, selectedMood, tags, metadata);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddActivity = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && activityInput.trim()) {
      e.preventDefault();
      if (!metadata.activities.includes(activityInput.trim())) {
        setMetadata({
          ...metadata,
          activities: [...metadata.activities, activityInput.trim()]
        });
      }
      setActivityInput('');
    }
  };

  const removeActivity = (activityToRemove: string) => {
    setMetadata({
      ...metadata,
      activities: metadata.activities.filter((activity: string) => activity !== activityToRemove)
    });
  };

  const handlePromptSelect = (prompt: string) => {
    if (content.trim() === '') {
      setContent(prompt);
    } else {
      setContent(content + '\n\n' + prompt);
    }
    setSelectedPrompt(prompt);
    setShowPrompts(false);
  };

  const commonTags = [
    'work', 'family', 'health', 'relationships', 'anxiety', 'happiness', 
    'stress', 'gratitude', 'goals', 'self-care', 'learning', 'progress'
  ];

  const weatherOptions = [
    'Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Snowy', 'Windy', 'Foggy', 'Hot', 'Cold'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {initialContent ? 'Edit Journal Entry' : 'New Journal Entry'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {format(new Date(), 'EEEE, MMMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Mood Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Smile size={16} className="mr-2" />
                      How are you feeling?
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                      {MOODS.map(mood => (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => setSelectedMood(mood)}
                          className={`text-2xl p-2 rounded-full transition-all ${
                            selectedMood === mood
                              ? 'bg-lavender-100 scale-110 shadow-sm'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Writing Prompts */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center">
                        <Lightbulb size={16} className="mr-2" />
                        Need inspiration?
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPrompts(!showPrompts)}
                        className="text-xs text-lavender-600 hover:text-lavender-800 font-medium"
                      >
                        {showPrompts ? 'Hide prompts' : 'Show writing prompts'}
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {showPrompts && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mb-4"
                        >
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                              {PROMPT_CATEGORIES.map(category => (
                                <button
                                  key={category.name}
                                  type="button"
                                  onClick={() => setSelectedCategory(category.name)}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center space-x-1 ${
                                    selectedCategory === category.name
                                      ? 'bg-lavender-100 text-lavender-800'
                                      : 'bg-white text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  <category.icon size={14} className={category.color} />
                                  <span>{category.name}</span>
                                </button>
                              ))}
                            </div>
                            
                            <div className="space-y-2">
                              {PROMPT_CATEGORIES.find(c => c.name === selectedCategory)?.prompts.map((prompt, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handlePromptSelect(prompt)}
                                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                                    selectedPrompt === prompt
                                      ? 'bg-lavender-100 text-lavender-800'
                                      : 'bg-white text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Journal Content */}
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Brain size={16} className="mr-2" />
                      Write your thoughts
                    </label>
                    <textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      placeholder="How was your day? What's on your mind? What are you feeling right now?"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{wordCount} words</span>
                      <span>{characterCount} characters</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Tag size={16} className="mr-2" />
                      Tags (press Enter to add)
                    </label>
                    <input
                      type="text"
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      placeholder="Add tags..."
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-lavender-100 text-lavender-800 px-2 py-1 rounded-full text-sm flex items-center"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-lavender-600 hover:text-lavender-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    {/* Common Tags */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Common tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {commonTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (!tags.includes(tag)) {
                                setTags([...tags, tag]);
                              }
                            }}
                            disabled={tags.includes(tag)}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              tags.includes(tag)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Additional Metadata Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowMetadata(!showMetadata)}
                      className="text-sm text-lavender-600 hover:text-lavender-800 font-medium flex items-center"
                    >
                      {showMetadata ? 'Hide additional details' : 'Add additional details'}
                      <span className="ml-1 text-xs">{showMetadata ? '▲' : '▼'}</span>
                    </button>
                    
                    <AnimatePresence>
                      {showMetadata && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-4"
                        >
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
                            {/* Location */}
                            <div>
                              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                              </label>
                              <input
                                type="text"
                                id="location"
                                value={metadata.location}
                                onChange={(e) => setMetadata({...metadata, location: e.target.value})}
                                placeholder="Where are you right now?"
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                              />
                            </div>
                            
                            {/* Weather */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Weather
                              </label>
                              <div className="flex flex-wrap gap-1">
                                {weatherOptions.map(weather => (
                                  <button
                                    key={weather}
                                    type="button"
                                    onClick={() => setMetadata({...metadata, weather})}
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      metadata.weather === weather
                                        ? 'bg-lavender-100 text-lavender-800'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                  >
                                    {weather}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Energy Level */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Energy Level: {metadata.energy_level}/10
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={metadata.energy_level}
                                onChange={(e) => setMetadata({...metadata, energy_level: parseInt(e.target.value)})}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Low</span>
                                <span>High</span>
                              </div>
                            </div>
                            
                            {/* Sleep Hours */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hours of Sleep: {metadata.sleep_hours}
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="12"
                                step="0.5"
                                value={metadata.sleep_hours}
                                onChange={(e) => setMetadata({...metadata, sleep_hours: parseFloat(e.target.value)})}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>0h</span>
                                <span>12h</span>
                              </div>
                            </div>
                            
                            {/* Activities */}
                            <div>
                              <label htmlFor="activities" className="block text-sm font-medium text-gray-700 mb-1">
                                Activities Today (press Enter to add)
                              </label>
                              <input
                                type="text"
                                id="activities"
                                value={activityInput}
                                onChange={(e) => setActivityInput(e.target.value)}
                                onKeyDown={handleAddActivity}
                                placeholder="e.g., exercise, reading, work..."
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                              />
                              <div className="mt-2 flex flex-wrap gap-2">
                                {metadata.activities.map((activity: string) => (
                                  <span
                                    key={activity}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center"
                                  >
                                    {activity}
                                    <button
                                      type="button"
                                      onClick={() => removeActivity(activity)}
                                      className="ml-1 text-blue-600 hover:text-blue-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                >
                  {initialContent ? 'Update Entry' : 'Save Entry'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JournalEntryModal;