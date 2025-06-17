import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Clock, Brain, Settings } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface MeditationPlayerProps {
  onComplete: (technique: string, duration: number) => void;
}

interface MeditationSession {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: 'guided' | 'ambient' | 'nature';
  audioUrl?: string;
  script?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Local storage key for saving settings
const MEDITATION_SETTINGS_KEY = 'puremind_meditation_settings';

const MeditationPlayer: React.FC<MeditationPlayerProps> = ({ onComplete }) => {
  // Load saved settings from localStorage
  const loadSavedSettings = () => {
    try {
      const savedSettings = localStorage.getItem(MEDITATION_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return {
          volume: parsed.volume || 0.7,
          isMuted: parsed.isMuted || false
        };
      }
    } catch (error) {
      console.error('Error loading meditation settings:', error);
    }
    return { volume: 0.7, isMuted: false }; // Default settings
  };

  const savedSettings = loadSavedSettings();
  
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(savedSettings.volume);
  const [isMuted, setIsMuted] = useState(savedSettings.isMuted);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scriptIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(MEDITATION_SETTINGS_KEY, JSON.stringify({
        volume,
        isMuted
      }));
      console.log('Meditation settings saved:', { volume, isMuted });
    } catch (error) {
      console.error('Error saving meditation settings:', error);
    }
  }, [volume, isMuted]);

  const sessions: MeditationSession[] = [
    {
      id: 'anxiety-relief',
      title: 'Anxiety Relief Meditation',
      description: 'Gentle guided meditation specifically for anxiety and stress relief',
      duration: 10,
      type: 'guided',
      difficulty: 'beginner',
      script: [
        "Find a comfortable position and close your eyes gently.",
        "Take a deep breath in through your nose, and slowly exhale through your mouth.",
        "Notice any tension in your body and allow it to melt away with each breath.",
        "Bring your attention to your breath, feeling the natural rhythm of inhaling and exhaling.",
        "If anxious thoughts arise, acknowledge them without judgment and gently return to your breath.",
        "Imagine a warm, golden light surrounding you, creating a bubble of safety and calm.",
        "With each breath, this light grows brighter, dissolving any worry or fear.",
        "You are safe in this moment. You are exactly where you need to be.",
        "Continue breathing deeply, feeling more relaxed with each exhale.",
        "When you're ready, slowly open your eyes and return to the present moment."
      ]
    },
    {
      id: 'body-scan',
      title: 'Progressive Body Scan',
      description: 'Release physical tension and promote deep relaxation',
      duration: 15,
      type: 'guided',
      difficulty: 'beginner',
      script: [
        "Lie down comfortably and close your eyes.",
        "Begin by focusing on your toes. Notice any sensations without trying to change them.",
        "Slowly move your attention up to your feet, feeling them relax completely.",
        "Continue up to your calves, noticing any tension and letting it go.",
        "Move to your thighs, allowing them to become heavy and relaxed.",
        "Focus on your hips and lower back, releasing any tightness.",
        "Bring attention to your abdomen, feeling it rise and fall with your breath.",
        "Notice your chest and shoulders, letting them drop and soften.",
        "Move to your arms, from shoulders to fingertips, feeling them become loose.",
        "Focus on your neck and jaw, releasing any held tension.",
        "Finally, relax your face and scalp, feeling completely at peace.",
        "Take a few moments to enjoy this state of complete relaxation."
      ]
    },
    {
      id: 'mindfulness',
      title: 'Mindful Awareness',
      description: 'Develop present-moment awareness and mental clarity',
      duration: 12,
      type: 'guided',
      difficulty: 'intermediate',
      script: [
        "Sit comfortably with your spine straight and eyes closed.",
        "Begin by simply observing your breath without changing it.",
        "Notice the sensation of air entering and leaving your nostrils.",
        "When your mind wanders, gently bring your attention back to your breath.",
        "Expand your awareness to include sounds around you.",
        "Notice these sounds without labeling or judging them.",
        "Now include physical sensations in your awareness.",
        "Feel the weight of your body, the temperature of the air.",
        "If thoughts arise, observe them like clouds passing in the sky.",
        "You are the observer, not the thoughts themselves.",
        "Rest in this spacious awareness, feeling calm and centered.",
        "Slowly return your focus to your breath before opening your eyes."
      ]
    },
    {
      id: 'loving-kindness',
      title: 'Loving-Kindness Meditation',
      description: 'Cultivate compassion and reduce self-criticism',
      duration: 8,
      type: 'guided',
      difficulty: 'beginner',
      script: [
        "Sit comfortably and place your hand on your heart.",
        "Begin by sending loving-kindness to yourself.",
        "Repeat silently: 'May I be happy, may I be healthy, may I be at peace.'",
        "Feel the warmth of these wishes in your heart.",
        "Now bring to mind someone you love dearly.",
        "Send them the same wishes: 'May you be happy, may you be healthy, may you be at peace.'",
        "Extend these wishes to a neutral person in your life.",
        "Now include someone you have difficulty with.",
        "Finally, extend loving-kindness to all beings everywhere.",
        "Feel the connection and compassion flowing through you.",
        "Return to yourself with gratitude for this practice."
      ]
    },
    {
      id: 'nature-sounds',
      title: 'Nature Soundscape',
      description: 'Relax with calming nature sounds and ambient music',
      duration: 20,
      type: 'nature',
      difficulty: 'beginner',
      script: [
        "Close your eyes and imagine yourself in a peaceful natural setting.",
        "Perhaps a quiet forest, a gentle stream, or a calm beach.",
        "Allow the sounds of nature to wash over you.",
        "Feel yourself becoming one with this peaceful environment.",
        "Let go of all worries and simply be present in this moment.",
        "Continue to breathe naturally as you enjoy this peaceful escape."
      ]
    }
  ];

  useEffect(() => {
    if (selectedSession && isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= selectedSession.duration * 60) {
            completeSession();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      // Handle guided meditation script
      if (selectedSession.script) {
        const scriptDuration = (selectedSession.duration * 60) / selectedSession.script.length;
        scriptIntervalRef.current = setInterval(() => {
          setCurrentScriptIndex(prev => {
            const nextIndex = prev + 1;
            if (nextIndex >= selectedSession.script!.length) {
              return prev;
            }
            return nextIndex;
          });
        }, scriptDuration * 1000);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (scriptIntervalRef.current) clearInterval(scriptIntervalRef.current);
    };
  }, [selectedSession, isPlaying]);

  const startSession = (session: MeditationSession) => {
    setSelectedSession(session);
    setIsPlaying(true);
    setCurrentTime(0);
    setCurrentScriptIndex(0);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetSession = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentScriptIndex(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (scriptIntervalRef.current) clearInterval(scriptIntervalRef.current);
  };

  const completeSession = () => {
    if (selectedSession) {
      onComplete(selectedSession.title, selectedSession.duration);
    }
    setSelectedSession(null);
    resetSession();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!selectedSession) return 0;
    return (currentTime / (selectedSession.duration * 60)) * 100;
  };

  const getCurrentScript = () => {
    if (!selectedSession?.script) return '';
    return selectedSession.script[currentScriptIndex] || '';
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (selectedSession) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedSession.title}</h2>
              <p className="text-gray-600">{selectedSession.description}</p>
            </div>

            {/* Meditation Visual */}
            <div className="flex justify-center">
              <motion.div
                animate={{ 
                  scale: isPlaying ? [1, 1.1, 1] : 1,
                  opacity: isPlaying ? [0.7, 1, 0.7] : 0.8
                }}
                transition={{ 
                  duration: 4,
                  repeat: isPlaying ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center shadow-lg"
              >
                <Brain className="w-16 h-16 text-white" />
              </motion.div>
            </div>

            {/* Script Display */}
            {selectedSession.script && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <motion.p
                  key={currentScriptIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg text-purple-900 leading-relaxed"
                >
                  {getCurrentScript()}
                </motion.p>
              </div>
            )}

            {/* Progress */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(selectedSession.duration * 60)}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="primary"
                onClick={togglePlayPause}
                leftIcon={isPlaying ? <Pause size={18} /> : <Play size={18} />}
                className="bg-gradient-to-r from-purple-500 to-blue-500"
              >
                {isPlaying ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="outline"
                onClick={resetSession}
                leftIcon={<RotateCcw size={18} />}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedSession(null)}
              >
                Back
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={toggleMute}
                className="text-gray-600 hover:text-gray-800"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card className="bg-purple-50 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-purple-900">Meditation Settings</h3>
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
              <div className="space-y-4 pt-4 border-t border-purple-200">
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Volume: {Math.round(volume * 100)}%
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={toggleMute}
                      className="text-purple-700 hover:text-purple-900"
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose a Meditation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{session.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-600">{session.duration}m</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">{session.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      session.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      session.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {session.difficulty}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      session.type === 'guided' ? 'bg-purple-100 text-purple-700' :
                      session.type === 'nature' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {session.type}
                    </span>
                  </div>
                  
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => startSession(session)}
                    leftIcon={<Play size={16} />}
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                  >
                    Start Meditation
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <Card className="bg-purple-50 border-purple-200">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Meditation Benefits</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
          <div>
            <div className="font-medium mb-2">Mental Benefits:</div>
            <ul className="space-y-1 text-purple-700">
              <li>• Reduces anxiety and depression</li>
              <li>• Improves focus and concentration</li>
              <li>• Enhances emotional regulation</li>
              <li>• Increases self-awareness</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Physical Benefits:</div>
            <ul className="space-y-1 text-purple-700">
              <li>• Lowers blood pressure</li>
              <li>• Reduces chronic pain</li>
              <li>• Improves sleep quality</li>
              <li>• Boosts immune system</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MeditationPlayer;