import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Brain, X, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAnxietySupport } from '../../hooks/useAnxietySupport';

const CBTWorksheet: React.FC = () => {
  const { cbtWorksheets, addCBTWorksheet } = useAnxietySupport();
  const [showNewWorksheet, setShowNewWorksheet] = useState(false);
  const [selectedType, setSelectedType] = useState<'thought_record' | 'exposure_hierarchy' | 'worry_time' | 'grounding'>('thought_record');
  const [formData, setFormData] = useState({
    situation: '',
    automatic_thoughts: '',
    emotions: [] as string[],
    evidence_for: '',
    evidence_against: '',
    balanced_thought: '',
    new_emotion_rating: 5
  });
  const [emotionInput, setEmotionInput] = useState('');

  const worksheetTypes = [
    {
      id: 'thought_record',
      name: 'Thought Record',
      description: 'Challenge negative automatic thoughts with evidence',
      icon: Brain,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'exposure_hierarchy',
      name: 'Exposure Hierarchy',
      description: 'Gradually face fears in a structured way',
      icon: Target,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'worry_time',
      name: 'Worry Time',
      description: 'Schedule specific time for worrying',
      icon: Lightbulb,
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'grounding',
      name: 'Grounding Exercise',
      description: '5-4-3-2-1 technique for anxiety management',
      icon: Target,
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  const commonEmotions = [
    'Anxious', 'Worried', 'Scared', 'Nervous', 'Panicked',
    'Sad', 'Depressed', 'Hopeless', 'Angry', 'Frustrated',
    'Guilty', 'Ashamed', 'Embarrassed', 'Confused', 'Overwhelmed'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCBTWorksheet({
        worksheet_type: selectedType,
        ...formData
      });
      setFormData({
        situation: '',
        automatic_thoughts: '',
        emotions: [],
        evidence_for: '',
        evidence_against: '',
        balanced_thought: '',
        new_emotion_rating: 5
      });
      setShowNewWorksheet(false);
    } catch (error) {
      console.error('Error saving CBT worksheet:', error);
    }
  };

  const addEmotion = () => {
    if (emotionInput.trim() && !formData.emotions.includes(emotionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        emotions: [...prev.emotions, emotionInput.trim()]
      }));
      setEmotionInput('');
    }
  };

  const removeEmotion = (emotion: string) => {
    setFormData(prev => ({
      ...prev,
      emotions: prev.emotions.filter(e => e !== emotion)
    }));
  };

  const addCommonEmotion = (emotion: string) => {
    if (!formData.emotions.includes(emotion)) {
      setFormData(prev => ({
        ...prev,
        emotions: [...prev.emotions, emotion]
      }));
    }
  };

  const renderThoughtRecordForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Situation or trigger
        </label>
        <textarea
          value={formData.situation}
          onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
          placeholder="Describe the situation that triggered your anxiety..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Automatic thoughts
        </label>
        <textarea
          value={formData.automatic_thoughts}
          onChange={(e) => setFormData(prev => ({ ...prev, automatic_thoughts: e.target.value }))}
          placeholder="What thoughts went through your mind?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emotions felt
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={emotionInput}
            onChange={(e) => setEmotionInput(e.target.value)}
            placeholder="Add an emotion..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmotion())}
          />
          <Button type="button" variant="outline" onClick={addEmotion}>
            Add
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.emotions.map((emotion) => (
            <span
              key={emotion}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
            >
              {emotion}
              <button
                type="button"
                onClick={() => removeEmotion(emotion)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="text-xs text-gray-600 mb-2">Common emotions:</div>
        <div className="flex flex-wrap gap-2">
          {commonEmotions.map((emotion) => (
            <button
              key={emotion}
              type="button"
              onClick={() => addCommonEmotion(emotion)}
              disabled={formData.emotions.includes(emotion)}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Evidence FOR the thought
        </label>
        <textarea
          value={formData.evidence_for}
          onChange={(e) => setFormData(prev => ({ ...prev, evidence_for: e.target.value }))}
          placeholder="What evidence supports this thought?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Evidence AGAINST the thought
        </label>
        <textarea
          value={formData.evidence_against}
          onChange={(e) => setFormData(prev => ({ ...prev, evidence_against: e.target.value }))}
          placeholder="What evidence contradicts this thought?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Balanced, realistic thought
        </label>
        <textarea
          value={formData.balanced_thought}
          onChange={(e) => setFormData(prev => ({ ...prev, balanced_thought: e.target.value }))}
          placeholder="What's a more balanced way to think about this?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New emotion rating: {formData.new_emotion_rating}/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={formData.new_emotion_rating}
          onChange={(e) => setFormData(prev => ({ ...prev, new_emotion_rating: parseInt(e.target.value) }))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Less intense</span>
          <span>More intense</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">CBT Tools</h2>
          <p className="text-gray-600">Cognitive Behavioral Therapy worksheets and exercises</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowNewWorksheet(true)}
          leftIcon={<Plus size={18} />}
          className="bg-gradient-to-r from-orange-500 to-red-500"
        >
          New Worksheet
        </Button>
      </div>

      {/* New Worksheet Modal */}
      <AnimatePresence>
        {showNewWorksheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewWorksheet(false)}
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
                  <h3 className="text-lg font-semibold text-gray-900">New CBT Worksheet</h3>
                  <button
                    onClick={() => setShowNewWorksheet(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Worksheet Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Worksheet Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {worksheetTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id as any)}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          selectedType === type.id
                            ? `${type.color} border-current`
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <type.icon className="w-5 h-5" />
                          <span className="font-medium">{type.name}</span>
                        </div>
                        <p className="text-xs text-gray-600">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {selectedType === 'thought_record' && renderThoughtRecordForm()}
                  
                  {/* Other worksheet types would have their own forms here */}
                  {selectedType !== 'thought_record' && (
                    <div className="text-center py-8">
                      <p className="text-gray-600">
                        This worksheet type is coming soon! Currently only Thought Record is available.
                      </p>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="flex space-x-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={() => setShowNewWorksheet(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      className="bg-gradient-to-r from-orange-500 to-red-500"
                      disabled={selectedType !== 'thought_record'}
                    >
                      Save Worksheet
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Worksheets */}
      <div className="space-y-4">
        {cbtWorksheets.length === 0 ? (
          <Card className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No worksheets yet</h3>
            <p className="text-gray-600 mb-4">
              Start challenging negative thoughts with CBT techniques.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowNewWorksheet(true)}
              leftIcon={<Plus size={18} />}
              className="bg-gradient-to-r from-orange-500 to-red-500"
            >
              Create First Worksheet
            </Button>
          </Card>
        ) : (
          cbtWorksheets.map((worksheet) => (
            <motion.div
              key={worksheet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        worksheet.worksheet_type === 'thought_record' ? 'bg-blue-100 text-blue-800' :
                        worksheet.worksheet_type === 'exposure_hierarchy' ? 'bg-green-100 text-green-800' :
                        worksheet.worksheet_type === 'worry_time' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {worksheet.worksheet_type === 'thought_record' ? 'Thought Record' :
                           worksheet.worksheet_type === 'exposure_hierarchy' ? 'Exposure Hierarchy' :
                           worksheet.worksheet_type === 'worry_time' ? 'Worry Time' :
                           'Grounding Exercise'}
                        </h4>
                        <span className="text-sm text-gray-600">
                          {format(new Date(worksheet.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Emotion: </span>
                      <span className={`font-medium ${
                        worksheet.new_emotion_rating <= 3 ? 'text-green-600' :
                        worksheet.new_emotion_rating <= 6 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {worksheet.new_emotion_rating}/10
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-sm">Situation</h5>
                      <p className="text-gray-700 text-sm">{worksheet.situation}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-sm">Automatic Thoughts</h5>
                      <p className="text-gray-700 text-sm">{worksheet.automatic_thoughts}</p>
                    </div>
                  </div>

                  {worksheet.emotions.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-sm">Emotions</h5>
                      <div className="flex flex-wrap gap-1">
                        {worksheet.emotions.map((emotion) => (
                          <span
                            key={emotion}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-sm">Evidence For</h5>
                      <p className="text-gray-700 text-sm">{worksheet.evidence_for || 'None provided'}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-sm">Evidence Against</h5>
                      <p className="text-gray-700 text-sm">{worksheet.evidence_against || 'None provided'}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2 text-sm">Balanced Thought</h5>
                    <p className="text-gray-700 text-sm">{worksheet.balanced_thought || 'None provided'}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* CBT Info */}
      <Card className="bg-orange-50 border-orange-200">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-6 h-6 text-orange-600" />
          <h3 className="font-semibold text-orange-900">About Cognitive Behavioral Therapy</h3>
        </div>
        <div className="space-y-4 text-sm text-orange-800">
          <p>
            Cognitive Behavioral Therapy (CBT) is one of the most effective treatments for anxiety disorders.
            It helps you identify and challenge negative thought patterns and develop healthier ways of thinking.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium mb-2">Key CBT Principles:</div>
              <ul className="space-y-1 text-orange-700">
                <li>• Thoughts influence emotions and behaviors</li>
                <li>• Identifying cognitive distortions</li>
                <li>• Challenging negative thoughts</li>
                <li>• Developing balanced thinking</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-2">Common Cognitive Distortions:</div>
              <ul className="space-y-1 text-orange-700">
                <li>• Catastrophizing (assuming the worst)</li>
                <li>• All-or-nothing thinking</li>
                <li>• Overgeneralizing from single events</li>
                <li>• Mind reading (assuming others' thoughts)</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CBTWorksheet;