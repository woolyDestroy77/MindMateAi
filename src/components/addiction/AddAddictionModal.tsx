import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertTriangle, Heart, Users, Phone } from 'lucide-react';
import Button from '../ui/Button';
import { useAddictionSupport, AddictionType } from '../../hooks/useAddictionSupport';

interface AddAddictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    addictionTypeId: string;
    severityLevel: number;
    startDate: string;
    quitAttempts: number;
    personalTriggers: string[];
    supportContacts: any;
  }) => Promise<void>;
}

const AddAddictionModal: React.FC<AddAddictionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { addictionTypes } = useAddictionSupport();
  const [selectedType, setSelectedType] = useState<string>('');
  const [severityLevel, setSeverityLevel] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [quitAttempts, setQuitAttempts] = useState(0);
  const [personalTriggers, setPersonalTriggers] = useState<string[]>([]);
  const [triggerInput, setTriggerInput] = useState('');
  const [supportContacts, setSupportContacts] = useState({
    emergency: '',
    sponsor: '',
    therapist: '',
    family: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const selectedAddictionType = addictionTypes.find(type => type.id === selectedType);

  const resetForm = () => {
    setSelectedType('');
    setSeverityLevel(5);
    setStartDate('');
    setQuitAttempts(0);
    setPersonalTriggers([]);
    setTriggerInput('');
    setSupportContacts({ emergency: '', sponsor: '', therapist: '', family: '' });
    setCurrentStep(1);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        addictionTypeId: selectedType,
        severityLevel,
        startDate,
        quitAttempts,
        personalTriggers,
        supportContacts
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding addiction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTrigger = () => {
    if (triggerInput.trim() && !personalTriggers.includes(triggerInput.trim())) {
      setPersonalTriggers([...personalTriggers, triggerInput.trim()]);
      setTriggerInput('');
    }
  };

  const removeTrigger = (trigger: string) => {
    setPersonalTriggers(personalTriggers.filter(t => t !== trigger));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTrigger();
    }
  };

  const canProceedToStep2 = selectedType && startDate;
  const canSubmit = selectedType && startDate;

  const groupedAddictions = addictionTypes.reduce((groups, addiction) => {
    const category = addiction.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addiction);
    return groups;
  }, {} as Record<string, AddictionType[]>);

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
                    <h2 className="text-xl font-bold text-gray-900">Start Tracking Your Recovery</h2>
                    <p className="text-sm text-gray-600">Step {currentStep} of 2 - Your courage to start is inspiring</p>
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
                {currentStep === 1 && (
                  <>
                    {/* Addiction Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        What would you like to track? *
                      </label>
                      <div className="space-y-4">
                        {Object.entries(groupedAddictions).map(([category, addictions]) => (
                          <div key={category}>
                            <h4 className="text-sm font-medium text-gray-600 mb-2 capitalize">
                              {category === 'substance' ? 'Substance Addictions' : 
                               category === 'behavioral' ? 'Behavioral Addictions' : 
                               'Other Addictions'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {addictions.map((addiction) => (
                                <motion.button
                                  key={addiction.id}
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setSelectedType(addiction.id)}
                                  className={`text-left p-3 rounded-lg border transition-all ${
                                    selectedType === addiction.id
                                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="font-medium">{addiction.name}</div>
                                  <div className="text-xs text-gray-600 mt-1">{addiction.description}</div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                        When did this addiction begin? *
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This helps us calculate your progress and milestones
                      </p>
                    </div>

                    {/* Severity Level */}
                    <div>
                      <label htmlFor="severityLevel" className="block text-sm font-medium text-gray-700 mb-2">
                        How would you rate the severity? ({severityLevel}/10)
                      </label>
                      <input
                        type="range"
                        id="severityLevel"
                        min="1"
                        max="10"
                        value={severityLevel}
                        onChange={(e) => setSeverityLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Mild (1)</span>
                        <span>Moderate (5)</span>
                        <span>Severe (10)</span>
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    {/* Previous Quit Attempts */}
                    <div>
                      <label htmlFor="quitAttempts" className="block text-sm font-medium text-gray-700 mb-2">
                        How many times have you tried to quit before?
                      </label>
                      <input
                        type="number"
                        id="quitAttempts"
                        value={quitAttempts}
                        onChange={(e) => setQuitAttempts(parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Every attempt is progress, not failure. You're learning what works.
                      </p>
                    </div>

                    {/* Personal Triggers */}
                    <div>
                      <label htmlFor="triggers" className="block text-sm font-medium text-gray-700 mb-2">
                        Personal Triggers (optional)
                      </label>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          id="triggers"
                          value={triggerInput}
                          onChange={(e) => setTriggerInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="e.g., stress, social situations, boredom..."
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTrigger}
                          disabled={!triggerInput.trim()}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {personalTriggers.map((trigger) => (
                          <span
                            key={trigger}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            {trigger}
                            <button
                              type="button"
                              onClick={() => removeTrigger(trigger)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Support Contacts */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Support Contacts (optional but recommended)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="emergency" className="block text-xs font-medium text-gray-600 mb-1">
                            Emergency Contact
                          </label>
                          <input
                            type="tel"
                            id="emergency"
                            value={supportContacts.emergency}
                            onChange={(e) => setSupportContacts({...supportContacts, emergency: e.target.value})}
                            placeholder="Phone number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="sponsor" className="block text-xs font-medium text-gray-600 mb-1">
                            Sponsor/Mentor
                          </label>
                          <input
                            type="tel"
                            id="sponsor"
                            value={supportContacts.sponsor}
                            onChange={(e) => setSupportContacts({...supportContacts, sponsor: e.target.value})}
                            placeholder="Phone number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="therapist" className="block text-xs font-medium text-gray-600 mb-1">
                            Therapist/Counselor
                          </label>
                          <input
                            type="tel"
                            id="therapist"
                            value={supportContacts.therapist}
                            onChange={(e) => setSupportContacts({...supportContacts, therapist: e.target.value})}
                            placeholder="Phone number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="family" className="block text-xs font-medium text-gray-600 mb-1">
                            Family/Friend
                          </label>
                          <input
                            type="tel"
                            id="family"
                            value={supportContacts.family}
                            onChange={(e) => setSupportContacts({...supportContacts, family: e.target.value})}
                            placeholder="Phone number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resources for selected addiction */}
                    {selectedAddictionType && selectedAddictionType.resources && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Resources for {selectedAddictionType.name}</h4>
                        <div className="space-y-2 text-sm">
                          {selectedAddictionType.resources.helplines && (
                            <div>
                              <span className="font-medium text-blue-800">Helplines: </span>
                              {selectedAddictionType.resources.helplines.join(', ')}
                            </div>
                          )}
                          {selectedAddictionType.resources.websites && (
                            <div>
                              <span className="font-medium text-blue-800">Websites: </span>
                              {selectedAddictionType.resources.websites.join(', ')}
                            </div>
                          )}
                          {selectedAddictionType.resources.apps && (
                            <div>
                              <span className="font-medium text-blue-800">Apps: </span>
                              {selectedAddictionType.resources.apps.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex space-x-3 pt-4">
                  {currentStep === 1 ? (
                    <>
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
                        type="button"
                        variant="primary"
                        fullWidth
                        onClick={() => setCurrentStep(2)}
                        disabled={!canProceedToStep2}
                        className="bg-gradient-to-r from-blue-500 to-purple-500"
                      >
                        Next Step
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        fullWidth
                        onClick={() => setCurrentStep(1)}
                        disabled={isSubmitting}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        disabled={!canSubmit || isSubmitting}
                        isLoading={isSubmitting}
                        leftIcon={<Heart size={18} />}
                        className="bg-gradient-to-r from-blue-500 to-purple-500"
                      >
                        {isSubmitting ? 'Starting...' : 'Start Tracking'}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddAddictionModal;