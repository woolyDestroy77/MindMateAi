import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Wind, Heart, Settings } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface BreathingExerciseProps {
  onComplete: (technique: string, duration: number) => void;
}

interface BreathingTechnique {
  id: string;
  name: string;
  description: string;
  pattern: number[];
  instructions: string[];
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onComplete }) => {
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customDuration, setCustomDuration] = useState(5);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const techniques: BreathingTechnique[] = [
    {
      id: '4-7-8',
      name: '4-7-8 Breathing',
      description: 'Inhale for 4, hold for 7, exhale for 8. Great for anxiety and sleep.',
      pattern: [4, 7, 8],
      instructions: ['Inhale through nose', 'Hold your breath', 'Exhale through mouth'],
      duration: 5,
      difficulty: 'beginner'
    },
    {
      id: 'box',
      name: 'Box Breathing',
      description: 'Equal counts for inhale, hold, exhale, hold. Used by Navy SEALs.',
      pattern: [4, 4, 4, 4],
      instructions: ['Inhale', 'Hold', 'Exhale', 'Hold'],
      duration: 5,
      difficulty: 'beginner'
    },
    {
      id: 'coherent',
      name: 'Coherent Breathing',
      description: 'Simple 5-5 pattern for heart rate variability.',
      pattern: [5, 5],
      instructions: ['Inhale slowly', 'Exhale slowly'],
      duration: 10,
      difficulty: 'beginner'
    },
    {
      id: 'triangle',
      name: 'Triangle Breathing',
      description: 'Three-part breath for focus and calm.',
      pattern: [4, 4, 4],
      instructions: ['Inhale', 'Hold', 'Exhale'],
      duration: 7,
      difficulty: 'intermediate'
    },
    {
      id: 'extended',
      name: 'Extended Exhale',
      description: 'Longer exhale activates parasympathetic nervous system.',
      pattern: [4, 8],
      instructions: ['Inhale', 'Exhale slowly'],
      duration: 8,
      difficulty: 'intermediate'
    },
    {
      id: 'wim-hof',
      name: 'Wim Hof Method',
      description: 'Powerful breathing for energy and stress resilience.',
      pattern: [2, 0, 1, 15],
      instructions: ['Deep inhale', 'Quick exhale', 'Final inhale', 'Hold breath'],
      duration: 15,
      difficulty: 'advanced'
    }
  ];

  const phaseLabels = ['Inhale', 'Hold', 'Exhale', 'Hold'];

  useEffect(() => {
    if (isActive && selectedTechnique) {
      const totalCycleTime = selectedTechnique.pattern.reduce((sum, time) => sum + time, 0);
      const totalCycles = Math.floor((customDuration * 60) / totalCycleTime);
      
      if (cycleCount >= totalCycles) {
        completeExercise();
        return;
      }

      const currentPhaseTime = selectedTechnique.pattern[currentPhase];
      
      phaseTimeoutRef.current = setTimeout(() => {
        if (currentPhase === selectedTechnique.pattern.length - 1) {
          setCycleCount(prev => prev + 1);
          setCurrentPhase(0);
        } else {
          setCurrentPhase(prev => prev + 1);
        }
      }, currentPhaseTime * 1000);
    }

    return () => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
    };
  }, [isActive, currentPhase, cycleCount, selectedTechnique, customDuration]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeExercise();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const startExercise = (technique: BreathingTechnique) => {
    setSelectedTechnique(technique);
    setIsActive(true);
    setCurrentPhase(0);
    setCycleCount(0);
    setTimeRemaining(customDuration * 60);
  };

  const pauseExercise = () => {
    setIsActive(false);
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeExercise = () => {
    setIsActive(true);
  };

  const resetExercise = () => {
    setIsActive(false);
    setSelectedTechnique(null);
    setCurrentPhase(0);
    setCycleCount(0);
    setTimeRemaining(0);
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const completeExercise = () => {
    if (selectedTechnique) {
      onComplete(selectedTechnique.name, customDuration);
    }
    resetExercise();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentInstruction = () => {
    if (!selectedTechnique) return '';
    const instructionIndex = Math.min(currentPhase, selectedTechnique.instructions.length - 1);
    return selectedTechnique.instructions[instructionIndex];
  };

  const getBreathingCircleScale = () => {
    if (!selectedTechnique || !isActive) return 1;
    
    const currentPhaseTime = selectedTechnique.pattern[currentPhase];
    const isInhale = currentPhase === 0 || (selectedTechnique.pattern.length === 4 && currentPhase === 0);
    const isExhale = currentPhase === 2 || (selectedTechnique.pattern.length === 2 && currentPhase === 1);
    
    if (isInhale) return 1.5;
    if (isExhale) return 0.8;
    return 1.2; // hold phases
  };

  if (selectedTechnique && isActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTechnique.name}</h2>
              <p className="text-gray-600">{formatTime(timeRemaining)} remaining</p>
            </div>

            {/* Breathing Circle */}
            <div className="flex justify-center">
              <motion.div
                animate={{ 
                  scale: getBreathingCircleScale(),
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ 
                  duration: selectedTechnique.pattern[currentPhase],
                  ease: "easeInOut",
                  opacity: { duration: selectedTechnique.pattern[currentPhase] / 2, repeat: Infinity }
                }}
                className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg"
              >
                <div className="text-white text-center">
                  <Wind className="w-12 h-12 mx-auto mb-2" />
                  <div className="text-lg font-semibold">{getCurrentInstruction()}</div>
                  <div className="text-sm opacity-80">
                    {selectedTechnique.pattern[currentPhase]}s
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Progress */}
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Cycle {cycleCount + 1} • Phase: {getCurrentInstruction()}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${((customDuration * 60 - timeRemaining) / (customDuration * 60)) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={isActive ? pauseExercise : resumeExercise}
                leftIcon={isActive ? <Pause size={18} /> : <Play size={18} />}
              >
                {isActive ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="outline"
                onClick={resetExercise}
                leftIcon={<RotateCcw size={18} />}
              >
                Reset
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-blue-900">Exercise Settings</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            leftIcon={<Settings size={16} />}
          >
            Customize
          </Button>
        </div>
        
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-4 border-t border-blue-200">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Duration: {customDuration} minutes
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-blue-600 mt-1">
                    <span>1 min</span>
                    <span>20 min</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Technique Selection */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose a Breathing Technique</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {techniques.map((technique) => (
            <motion.div
              key={technique.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{technique.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      technique.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      technique.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {technique.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600">{technique.description}</p>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700">Pattern:</div>
                    <div className="flex items-center space-x-2">
                      {technique.pattern.map((time, index) => (
                        <React.Fragment key={index}>
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {time}s
                          </div>
                          {index < technique.pattern.length - 1 && (
                            <div className="text-gray-400">→</div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => startExercise(technique)}
                    leftIcon={<Play size={16} />}
                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    Start ({customDuration} min)
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Info */}
      <Card className="bg-green-50 border-green-200">
        <div className="flex items-center space-x-3 mb-4">
          <Heart className="w-6 h-6 text-green-600" />
          <h3 className="font-semibold text-green-900">Benefits of Breathing Exercises</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
          <div>
            <div className="font-medium mb-2">Physical Benefits:</div>
            <ul className="space-y-1 text-green-700">
              <li>• Reduces heart rate and blood pressure</li>
              <li>• Improves oxygen delivery</li>
              <li>• Activates parasympathetic nervous system</li>
              <li>• Reduces cortisol levels</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Mental Benefits:</div>
            <ul className="space-y-1 text-green-700">
              <li>• Reduces anxiety and stress</li>
              <li>• Improves focus and concentration</li>
              <li>• Enhances emotional regulation</li>
              <li>• Promotes better sleep quality</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BreathingExercise;