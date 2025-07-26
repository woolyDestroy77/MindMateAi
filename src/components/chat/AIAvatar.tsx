import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface AIAvatarProps {
  isSpeaking: boolean;
  currentText?: string;
  className?: string;
}

interface VisemeData {
  time: number;
  viseme: string;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ 
  isSpeaking, 
  currentText = '', 
  className = '' 
}) => {
  const [currentViseme, setCurrentViseme] = useState('neutral');
  const [eyeBlinkState, setEyeBlinkState] = useState(false);
  const [headPosition, setHeadPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const animationFrameRef = useRef<number>();
  const lastVisemeTimeRef = useRef<number>(0);
  const visemeIndexRef = useRef<number>(0);

  // Phoneme to viseme mapping for realistic lip sync
  const phonemeToViseme: { [key: string]: string } = {
    // Vowels
    'a': 'aa', 'e': 'eh', 'i': 'ih', 'o': 'oh', 'u': 'uu',
    'aa': 'aa', 'ae': 'aa', 'ah': 'aa', 'ao': 'oh', 'aw': 'oh',
    'ay': 'aa', 'eh': 'eh', 'er': 'er', 'ey': 'eh', 'ih': 'ih',
    'iy': 'ih', 'ow': 'oh', 'oy': 'oh', 'uh': 'uu', 'uw': 'uu',
    
    // Consonants
    'b': 'pp', 'p': 'pp', 'm': 'pp', // Bilabial
    'f': 'ff', 'v': 'ff', // Labiodental
    'd': 'dd', 't': 'dd', 'n': 'dd', 'l': 'dd', // Alveolar
    'th': 'th', 'dh': 'th', // Dental
    's': 'ss', 'z': 'ss', 'sh': 'ch', 'zh': 'ch', // Sibilants
    'ch': 'ch', 'jh': 'ch', // Affricates
    'k': 'kk', 'g': 'kk', 'ng': 'kk', // Velar
    'r': 'rr', 'w': 'ww', 'y': 'ih', 'h': 'sil'
  };

  // Generate viseme sequence from text
  const generateVisemeSequence = useCallback((text: string): VisemeData[] => {
    if (!text) return [];
    
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const visemes: VisemeData[] = [];
    let currentTime = 0;
    
    // Estimate speaking rate (words per minute to milliseconds per phoneme)
    const wordsPerMinute = 150; // Natural speaking rate
    const avgPhonemesPerWord = 4;
    const msPerPhoneme = (60 * 1000) / (wordsPerMinute * avgPhonemesPerWord);
    
    words.forEach((word, wordIndex) => {
      if (wordIndex > 0) {
        // Add pause between words
        visemes.push({ time: currentTime, viseme: 'sil' });
        currentTime += msPerPhoneme * 0.5;
      }
      
      // Simple phoneme estimation based on common English patterns
      const phonemes = estimatePhonemesFromWord(word);
      
      phonemes.forEach(phoneme => {
        const viseme = phonemeToViseme[phoneme] || 'neutral';
        visemes.push({ time: currentTime, viseme });
        currentTime += msPerPhoneme;
      });
    });
    
    // End with neutral position
    visemes.push({ time: currentTime, viseme: 'neutral' });
    
    return visemes;
  }, [phonemeToViseme]);

  // Simple phoneme estimation from text
  const estimatePhonemesFromWord = (word: string): string[] => {
    const phonemes: string[] = [];
    let i = 0;
    
    while (i < word.length) {
      const char = word[i];
      const nextChar = word[i + 1];
      
      // Handle common digraphs
      if (char === 't' && nextChar === 'h') {
        phonemes.push('th');
        i += 2;
      } else if (char === 's' && nextChar === 'h') {
        phonemes.push('sh');
        i += 2;
      } else if (char === 'c' && nextChar === 'h') {
        phonemes.push('ch');
        i += 2;
      } else if (char === 'n' && nextChar === 'g') {
        phonemes.push('ng');
        i += 2;
      } else {
        // Single character mapping
        phonemes.push(char);
        i++;
      }
    }
    
    return phonemes;
  };

  // Animate visemes when speaking
  useEffect(() => {
    if (!isSpeaking || !currentText) {
      setCurrentViseme('neutral');
      return;
    }

    const visemeSequence = generateVisemeSequence(currentText);
    if (visemeSequence.length === 0) return;

    const startTime = Date.now();
    visemeIndexRef.current = 0;

    const animateVisemes = () => {
      const elapsed = Date.now() - startTime;
      const currentVisemeData = visemeSequence[visemeIndexRef.current];
      
      if (currentVisemeData && elapsed >= currentVisemeData.time) {
        setCurrentViseme(currentVisemeData.viseme);
        visemeIndexRef.current++;
      }
      
      if (visemeIndexRef.current < visemeSequence.length && isSpeaking) {
        animationFrameRef.current = requestAnimationFrame(animateVisemes);
      } else {
        setCurrentViseme('neutral');
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateVisemes);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking, currentText, generateVisemeSequence]);

  // Eye blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlinkState(true);
      setTimeout(() => setEyeBlinkState(false), 150);
    }, 2000 + Math.random() * 3000); // Random blink every 2-5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  // Subtle head movements
  useEffect(() => {
    const moveHead = () => {
      setHeadPosition({
        x: (Math.random() - 0.5) * 4, // Small random movements
        y: (Math.random() - 0.5) * 2
      });
    };

    const headMovementInterval = setInterval(moveHead, 3000 + Math.random() * 2000);
    return () => clearInterval(headMovementInterval);
  }, []);

  // Get mouth shape based on current viseme
  const getMouthPath = (viseme: string): string => {
    switch (viseme) {
      case 'aa': // Open vowels like "ah"
        return 'M 130 180 Q 150 205 170 180 Q 150 192 130 180';
      case 'eh': // Mid vowels like "eh"
        return 'M 135 185 Q 150 197 165 185 Q 150 190 135 185';
      case 'ih': // High vowels like "ee"
        return 'M 140 187 Q 150 192 160 187 Q 150 190 140 187';
      case 'oh': // Rounded vowels like "oh"
        return 'M 137 182 Q 150 197 163 182 Q 150 187 137 182';
      case 'uu': // Rounded vowels like "oo"
        return 'M 140 185 Q 150 195 160 185 Q 150 187 140 185';
      case 'pp': // Bilabial consonants (p, b, m)
        return 'M 142 187 L 158 187';
      case 'ff': // Labiodental consonants (f, v)
        return 'M 137 187 Q 150 182 163 187';
      case 'dd': // Alveolar consonants (t, d, n, l)
        return 'M 140 187 Q 150 190 160 187';
      case 'th': // Dental consonants (th)
        return 'M 137 187 Q 150 185 163 187';
      case 'ss': // Sibilants (s, z)
        return 'M 142 187 Q 150 185 158 187';
      case 'ch': // Affricates (ch, j, sh)
        return 'M 140 185 Q 150 190 160 185';
      case 'kk': // Velar consonants (k, g)
        return 'M 140 187 Q 150 192 160 187';
      case 'rr': // R sound
        return 'M 137 187 Q 150 190 163 187';
      case 'ww': // W sound
        return 'M 140 185 Q 150 192 160 185';
      case 'sil': // Silence
        return 'M 142 187 L 158 187';
      case 'neutral':
      default:
        return 'M 140 187 Q 150 190 160 187';
    }
  };

  // Initialize avatar
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-full w-32 h-32"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{
          x: headPosition.x,
          y: headPosition.y,
          scale: isSpeaking ? [1, 1.05, 1] : 1
        }}
        transition={{
          x: { duration: 2, ease: "easeInOut" },
          y: { duration: 2, ease: "easeInOut" },
          scale: { duration: 0.8, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }
        }}
        className="relative"
      >
        {/* AI Avatar SVG */}
        <svg
          width="300"
          height="350"
          viewBox="0 0 300 350"
          className="drop-shadow-lg max-w-full max-h-full"
        >
          {/* Background circle */}
          <circle
            cx="150"
            cy="175"
            r="140"
            fill="url(#avatarGradient)"
            className="filter drop-shadow-md"
          />
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3E8FF" />
              <stop offset="50%" stopColor="#E9D5FF" />
              <stop offset="100%" stopColor="#C4B5FD" />
            </linearGradient>
            <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
          </defs>
          
          {/* Face */}
          <ellipse
            cx="150"
            cy="160"
            rx="75"
            ry="85"
            fill="url(#skinGradient)"
            className="filter drop-shadow-sm"
          />
          
          {/* Hair */}
          <path
            d="M 75 100 Q 150 60 225 100 Q 225 125 210 140 Q 150 75 90 140 Q 75 125 75 100"
            fill="#374151"
            className="filter drop-shadow-sm"
          />
          
          {/* Eyes */}
          <motion.g
            animate={{
              scaleY: eyeBlinkState ? 0.1 : 1
            }}
            transition={{ duration: 0.1 }}
          >
            {/* Left eye */}
            <ellipse cx="125" cy="140" rx="12" ry="10" fill="white" />
            <circle cx="125" cy="140" r="6" fill="#1F2937" />
            <circle cx="127" cy="137" r="2.5" fill="white" />
            
            {/* Right eye */}
            <ellipse cx="175" cy="140" rx="12" ry="10" fill="white" />
            <circle cx="175" cy="140" r="6" fill="#1F2937" />
            <circle cx="177" cy="137" r="2.5" fill="white" />
          </motion.g>
          
          {/* Eyebrows */}
          <path d="M 110 120 Q 125 115 140 120" stroke="#374151" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M 160 120 Q 175 115 190 120" stroke="#374151" strokeWidth="6" fill="none" strokeLinecap="round" />
          
          {/* Nose */}
          <path d="M 150 155 L 145 165 Q 150 167 155 165 Z" fill="#D97706" opacity="0.6" />
          
          {/* Mouth with lip sync */}
          <motion.path
            d={getMouthPath(currentViseme)}
            fill="#DC2626"
            stroke="#B91C1C"
            strokeWidth="2"
            animate={{
              d: getMouthPath(currentViseme)
            }}
            transition={{ duration: 0.1 }}
          />
          
          {/* Cheeks (subtle) */}
          <circle cx="105" cy="155" r="10" fill="#F59E0B" opacity="0.3" />
          <circle cx="195" cy="155" r="10" fill="#F59E0B" opacity="0.3" />
          
          {/* Neck */}
          <rect x="135" y="240" width="30" height="45" fill="url(#skinGradient)" />
          
          {/* Shoulders */}
          <ellipse cx="150" cy="310" rx="60" ry="25" fill="#6366F1" />
          
          {/* Speaking indicator */}
          {isSpeaking && (
            <motion.circle
              cx="150"
              cy="325"
              r="8"
              fill="#10B981"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </svg>
        
        {/* Status indicators */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          {isSpeaking && (
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              Speaking
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AIAvatar;