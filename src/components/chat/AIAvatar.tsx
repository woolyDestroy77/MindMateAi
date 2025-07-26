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
        return 'M 40 45 Q 50 55 60 45 Q 50 50 40 45';
      case 'eh': // Mid vowels like "eh"
        return 'M 42 47 Q 50 52 58 47 Q 50 49 42 47';
      case 'ih': // High vowels like "ee"
        return 'M 44 48 Q 50 50 56 48 Q 50 49 44 48';
      case 'oh': // Rounded vowels like "oh"
        return 'M 45 46 Q 50 52 55 46 Q 50 48 45 46';
      case 'uu': // Rounded vowels like "oo"
        return 'M 46 47 Q 50 51 54 47 Q 50 48 46 47';
      case 'pp': // Bilabial consonants (p, b, m)
        return 'M 47 48 L 53 48';
      case 'ff': // Labiodental consonants (f, v)
        return 'M 45 48 Q 50 46 55 48';
      case 'dd': // Alveolar consonants (t, d, n, l)
        return 'M 46 48 Q 50 49 54 48';
      case 'th': // Dental consonants (th)
        return 'M 45 48 Q 50 47 55 48';
      case 'ss': // Sibilants (s, z)
        return 'M 47 48 Q 50 47 53 48';
      case 'ch': // Affricates (ch, j, sh)
        return 'M 46 47 Q 50 49 54 47';
      case 'kk': // Velar consonants (k, g)
        return 'M 46 48 Q 50 50 54 48';
      case 'rr': // R sound
        return 'M 45 48 Q 50 49 55 48';
      case 'ww': // W sound
        return 'M 46 47 Q 50 50 54 47';
      case 'sil': // Silence
        return 'M 47 48 L 53 48';
      case 'neutral':
      default:
        return 'M 46 48 Q 50 49 54 48';
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
          width="100%"
          height="100%"
          viewBox="0 0 100 120"
          className="drop-shadow-lg max-w-full max-h-full"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="60"
            r="45"
            fill="url(#avatarGradient)"
            className="filter drop-shadow-md"
          />
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0E7FF" />
              <stop offset="50%" stopColor="#C7D2FE" />
              <stop offset="100%" stopColor="#A5B4FC" />
            </linearGradient>
            <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          
          {/* Face */}
          <ellipse
            cx="50"
            cy="55"
            rx="25"
            ry="30"
            fill="url(#skinGradient)"
            className="filter drop-shadow-sm"
          />
          
          {/* Hair */}
          <path
            d="M 25 35 Q 50 20 75 35 Q 75 45 70 50 Q 50 25 30 50 Q 25 45 25 35"
            fill="#4B5563"
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
            <ellipse cx="42" cy="45" rx="4" ry="3" fill="white" />
            <circle cx="42" cy="45" r="2" fill="#1F2937" />
            <circle cx="43" cy="44" r="0.8" fill="white" />
            
            {/* Right eye */}
            <ellipse cx="58" cy="45" rx="4" ry="3" fill="white" />
            <circle cx="58" cy="45" r="2" fill="#1F2937" />
            <circle cx="59" cy="44" r="0.8" fill="white" />
          </motion.g>
          
          {/* Eyebrows */}
          <path d="M 37 40 Q 42 38 47 40" stroke="#4B5563" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 53 40 Q 58 38 63 40" stroke="#4B5563" strokeWidth="2" fill="none" strokeLinecap="round" />
          
          {/* Nose */}
          <path d="M 50 50 L 48 54 Q 50 55 52 54 Z" fill="#D97706" opacity="0.6" />
          
          {/* Mouth with lip sync */}
          <motion.path
            d={getMouthPath(currentViseme)}
            fill="#DC2626"
            stroke="#B91C1C"
            strokeWidth="0.5"
            animate={{
              d: getMouthPath(currentViseme)
            }}
            transition={{ duration: 0.1 }}
          />
          
          {/* Cheeks (subtle) */}
          <circle cx="35" cy="52" r="3" fill="#F59E0B" opacity="0.3" />
          <circle cx="65" cy="52" r="3" fill="#F59E0B" opacity="0.3" />
          
          {/* Neck */}
          <rect x="45" y="80" width="10" height="15" fill="url(#skinGradient)" />
          
          {/* Shoulders */}
          <ellipse cx="50" cy="105" rx="20" ry="8" fill="#6366F1" />
          
          {/* Speaking indicator */}
          {isSpeaking && (
            <motion.circle
              cx="50"
              cy="110"
              r="2"
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
              className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium"
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