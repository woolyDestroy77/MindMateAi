import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Wind, Heart, Phone, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import Button from '../ui/Button';

interface PanicButtonProps {
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}

const PanicButton: React.FC<PanicButtonProps> = ({ isActive, onActivate, onDeactivate }) => {
  const [currentTechnique, setCurrentTechnique] = useState<'breathing' | 'grounding' | 'affirmations'>('breathing');
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingCount, setBreathingCount] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const groundingPrompts = [
    "Name 5 things you can see around you",
    "Name 4 things you can touch",
    "Name 3 things you can hear",
    "Name 2 things you can smell",
    "Name 1 thing you can taste"
  ];

  const affirmations = [
    "This feeling will pass. I am safe right now.",
    "I am stronger than my anxiety. I can get through this.",
    "I am breathing slowly and deeply. I am in control.",
    "This is temporary. I have survived this before.",
    "I am grounded in this moment. I am okay.",
    "My anxiety does not define me. I am capable and strong.",
    "I choose peace over panic. I am safe.",
    "I trust my body to return to calm. I am healing."
  ];

  const emergencyContacts = [
    { name: 'Crisis Lifeline', number: '988', action: 'tel:988' },
    { name: 'Crisis Text', number: 'Text HOME to 741741', action: 'sms:741741?body=HOME' },
    { name: 'Emergency', number: '911', action: 'tel:911' }
  ];

  // Breathing exercise timing
  useEffect(() => {
    if (isActive && currentTechnique === 'breathing') {
      const breathingPattern = {
        inhale: 4000,
        hold: 7000,
        exhale: 8000
      };

      const timer = setTimeout(() => {
        if (breathingPhase === 'inhale') {
          setBreathingPhase('hold');
        } else if (breathingPhase === 'hold') {
          setBreathingPhase('exhale');
        } else {
          setBreathingPhase('inhale');
          setBreathingCount(prev => prev + 1);
        }
      }, breathingPattern[breathingPhase]);

      return () => clearTimeout(timer);
    }
  }, [isActive, currentTechnique, breathingPhase]);

  // Audio feedback for breathing
  useEffect(() => {
    if (isAudioEnabled && audioContext && isActive && currentTechnique === 'breathing') {
      const frequency = breathingPhase === 'inhale' ? 440 : breathingPhase === 'hold' ? 523 : 349;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [breathingPhase, isAudioEnabled, audioContext, isActive, currentTechnique]);

  const initAudio = async () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);
      setIsAudioEnabled(true);
    } catch (error) {
      console.error('Audio not supported:', error);
    }
  };

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe in slowly through your nose';
      case 'hold': return 'Hold your breath gently';
      case 'exhale': return 'Exhale slowly through your mouth';
    }
  };

  const getBreathingCircleScale = () => {
    switch (breathingPhase) {
      case 'inhale': return 1.5;
      case 'hold': return 1.5;
      case 'exhale': return 0.8;
    }
  };

  return (
    <>
      {/* Panic Button - Always visible */}
      {!isActive && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onActivate}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <AlertTriangle className="w-8 h-8" />
        </motion.button>
      )}

      {/* Panic Mode Overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-red-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Heart className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-red-900">Panic Relief Mode</h2>
                      <p className="text-sm text-red-700">You're safe. Let's work through this together.</p>
                    </div>
                  </div>
                  <button
                    onClick={onDeactivate}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Technique Selector */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentTechnique('breathing')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentTechnique === 'breathing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Breathing
                  </button>
                  <button
                    onClick={() => setCurrentTechnique('grounding')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentTechnique === 'grounding'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Grounding
                  </button>
                  <button
                    onClick={() => setCurrentTechnique('affirmations')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentTechnique === 'affirmations'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Affirmations
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {currentTechnique === 'breathing' && (
                  <div className="text-center space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">4-7-8 Breathing</h3>
                      <p className="text-gray-600">Follow the circle and breathe with the rhythm</p>
                    </div>

                    {/* Breathing Circle */}
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ scale: getBreathingCircleScale() }}
                        transition={{ 
                          duration: breathingPhase === 'inhale' ? 4 : breathingPhase === 'hold' ? 7 : 8,
                          ease: "easeInOut"
                        }}
                        className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg"
                      >
                        <div className="text-white text-center">
                          <Wind className="w-12 h-12 mx-auto mb-2" />
                          <div className="text-lg font-semibold capitalize">{breathingPhase}</div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900">{getBreathingInstruction()}</p>
                      <p className="text-sm text-gray-600">Cycle {breathingCount + 1}</p>
                    </div>

                    {/* Audio Toggle */}
                    <div className="flex justify-center">
                      <button
                        onClick={isAudioEnabled ? () => setIsAudioEnabled(false) : initAudio}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {isAudioEnabled ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        <span className="text-sm">{isAudioEnabled ? 'Disable' : 'Enable'} Audio</span>
                      </button>
                    </div>
                  </div>
                )}

                {currentTechnique === 'grounding' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">5-4-3-2-1 Grounding</h3>
                      <p className="text-gray-600">Focus on your senses to ground yourself in the present</p>
                    </div>

                    <div className="space-y-4">
                      {groundingPrompts.map((prompt, index) => (
                        <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-800 font-medium">{prompt}</p>
                        </div>
                      ))}
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Take your time with each step. There's no rush.
                      </p>
                    </div>
                  </div>
                )}

                {currentTechnique === 'affirmations' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Calming Affirmations</h3>
                      <p className="text-gray-600">Read these slowly and let them sink in</p>
                    </div>

                    <div className="space-y-4">
                      {affirmations.map((affirmation, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.2 }}
                          className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center"
                        >
                          <p className="text-purple-800 font-medium italic">"{affirmation}"</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency Contacts */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Need immediate help?</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {emergencyContacts.map((contact, index) => (
                    <a
                      key={index}
                      href={contact.action}
                      className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border"
                    >
                      {contact.name === 'Crisis Text' ? (
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Phone className="w-5 h-5 text-blue-600" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{contact.name}</div>
                        <div className="text-xs text-gray-600">{contact.number}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <div className="p-6 border-t border-gray-200">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={onDeactivate}
                  className="bg-green-600 hover:bg-green-700"
                >
                  I'm Feeling Better
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PanicButton;