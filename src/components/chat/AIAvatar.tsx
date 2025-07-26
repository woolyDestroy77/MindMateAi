import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AIAvatarProps {
  isSpeaking: boolean;
  currentText?: string;
  className?: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'concerned' | 'excited' | 'calm';
  intensity?: number;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ 
  isSpeaking, 
  currentText = '', 
  className = '',
  emotion = 'neutral',
  intensity = 0.5
}) => {
  const [audioLevels, setAudioLevels] = useState<number[]>([0.2, 0.4, 0.3, 0.6, 0.5, 0.7, 0.4, 0.3]);

  // Animate audio levels when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setAudioLevels([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]);
      return;
    }

    const animateAudio = () => {
      setAudioLevels(prev => prev.map(() => 
        0.2 + Math.random() * 0.8 * intensity
      ));
    };

    const interval = setInterval(animateAudio, 100);
    return () => clearInterval(interval);
  }, [isSpeaking, intensity]);

  const getEmotionColor = () => {
    switch (emotion) {
      case 'happy': return '#10B981'; // green
      case 'sad': return '#3B82F6'; // blue
      case 'excited': return '#F59E0B'; // yellow
      case 'concerned': return '#EF4444'; // red
      case 'calm': return '#8B5CF6'; // purple
      default: return '#6366F1'; // indigo
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Main AI Circle */}
        <motion.div
          animate={{
            scale: isSpeaking ? [1, 1.1, 1] : 1,
            boxShadow: isSpeaking 
              ? [`0 0 0 0 ${getEmotionColor()}40`, `0 0 0 20px ${getEmotionColor()}00`, `0 0 0 0 ${getEmotionColor()}40`]
              : `0 0 0 0 ${getEmotionColor()}20`
          }}
          transition={{
            scale: { duration: 0.6, repeat: isSpeaking ? Infinity : 0 },
            boxShadow: { duration: 1.5, repeat: isSpeaking ? Infinity : 0 }
          }}
          className="w-48 h-48 rounded-full flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${getEmotionColor()}20, ${getEmotionColor()}40)`,
            border: `3px solid ${getEmotionColor()}`
          }}
        >
          {/* Voice Visualization Bars */}
          <div className="flex items-end space-x-2 h-16">
            {audioLevels.map((level, index) => (
              <motion.div
                key={index}
                animate={{
                  height: `${level * 100}%`,
                  opacity: isSpeaking ? [0.6, 1, 0.6] : 0.3
                }}
                transition={{
                  height: { duration: 0.1 },
                  opacity: { duration: 0.5, repeat: isSpeaking ? Infinity : 0 }
                }}
                className="w-2 rounded-full"
                style={{ backgroundColor: getEmotionColor() }}
              />
            ))}
          </div>
        </motion.div>

        {/* Outer Pulse Ring */}
        {isSpeaking && (
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 0, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: getEmotionColor() }}
          />
        )}

        {/* Status Text */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
          <motion.div
            animate={{
              opacity: isSpeaking ? [0.8, 1, 0.8] : 0.6
            }}
            transition={{
              duration: 1,
              repeat: isSpeaking ? Infinity : 0
            }}
            className="text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
            style={{ backgroundColor: getEmotionColor() }}
          >
            {isSpeaking ? `🎤 Speaking (${emotion})` : '🤖 AI Assistant'}
          </motion.div>
        </div>

        {/* Emotion Indicator */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className="text-2xl">
            {emotion === 'happy' ? '😊' : 
             emotion === 'sad' ? '😔' : 
             emotion === 'excited' ? '🤩' : 
             emotion === 'concerned' ? '😟' : 
             emotion === 'calm' ? '😌' : '🤖'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAvatar;