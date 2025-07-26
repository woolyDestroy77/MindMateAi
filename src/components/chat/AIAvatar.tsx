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
  intensity: number;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ 
  isSpeaking, 
  currentText = '', 
  className = '' 
}) => {
  const [currentViseme, setCurrentViseme] = useState('neutral');
  const [eyeBlinkState, setEyeBlinkState] = useState(false);
  const [headPosition, setHeadPosition] = useState({ x: 0, y: 0, rotation: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [mouthIntensity, setMouthIntensity] = useState(0);
  const [eyeMovement, setEyeMovement] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const visemeIndexRef = useRef<number>(0);

  // Enhanced phoneme to viseme mapping for ultra-realistic lip sync
  const phonemeToViseme: { [key: string]: { shape: string; intensity: number } } = {
    // Vowels with intensity levels
    'a': { shape: 'aa', intensity: 0.9 }, 'e': { shape: 'eh', intensity: 0.6 }, 
    'i': { shape: 'ih', intensity: 0.4 }, 'o': { shape: 'oh', intensity: 0.8 }, 
    'u': { shape: 'uu', intensity: 0.7 },
    'aa': { shape: 'aa', intensity: 0.9 }, 'ae': { shape: 'aa', intensity: 0.8 }, 
    'ah': { shape: 'aa', intensity: 0.7 }, 'ao': { shape: 'oh', intensity: 0.8 }, 
    'aw': { shape: 'oh', intensity: 0.9 }, 'ay': { shape: 'aa', intensity: 0.6 },
    'eh': { shape: 'eh', intensity: 0.6 }, 'er': { shape: 'er', intensity: 0.5 }, 
    'ey': { shape: 'eh', intensity: 0.7 }, 'ih': { shape: 'ih', intensity: 0.4 },
    'iy': { shape: 'ih', intensity: 0.5 }, 'ow': { shape: 'oh', intensity: 0.8 }, 
    'oy': { shape: 'oh', intensity: 0.7 }, 'uh': { shape: 'uu', intensity: 0.5 }, 
    'uw': { shape: 'uu', intensity: 0.8 },
    
    // Consonants with realistic mouth shapes
    'b': { shape: 'pp', intensity: 1.0 }, 'p': { shape: 'pp', intensity: 1.0 }, 
    'm': { shape: 'pp', intensity: 0.9 }, // Bilabial
    'f': { shape: 'ff', intensity: 0.7 }, 'v': { shape: 'ff', intensity: 0.8 }, // Labiodental
    'd': { shape: 'dd', intensity: 0.6 }, 't': { shape: 'dd', intensity: 0.7 }, 
    'n': { shape: 'dd', intensity: 0.5 }, 'l': { shape: 'dd', intensity: 0.6 }, // Alveolar
    'th': { shape: 'th', intensity: 0.5 }, 'dh': { shape: 'th', intensity: 0.6 }, // Dental
    's': { shape: 'ss', intensity: 0.4 }, 'z': { shape: 'ss', intensity: 0.5 }, 
    'sh': { shape: 'ch', intensity: 0.6 }, 'zh': { shape: 'ch', intensity: 0.7 }, // Sibilants
    'ch': { shape: 'ch', intensity: 0.8 }, 'jh': { shape: 'ch', intensity: 0.8 }, // Affricates
    'k': { shape: 'kk', intensity: 0.6 }, 'g': { shape: 'kk', intensity: 0.7 }, 
    'ng': { shape: 'kk', intensity: 0.5 }, // Velar
    'r': { shape: 'rr', intensity: 0.6 }, 'w': { shape: 'ww', intensity: 0.8 }, 
    'y': { shape: 'ih', intensity: 0.4 }, 'h': { shape: 'sil', intensity: 0.2 }
  };

  // Generate ultra-realistic viseme sequence
  const generateVisemeSequence = useCallback((text: string): VisemeData[] => {
    if (!text) return [];
    
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const visemes: VisemeData[] = [];
    let currentTime = 0;
    
    // More natural speaking rate
    const wordsPerMinute = 140; // Slightly slower for clarity
    const avgPhonemesPerWord = 4.2;
    const msPerPhoneme = (60 * 1000) / (wordsPerMinute * avgPhonemesPerWord);
    
    words.forEach((word, wordIndex) => {
      if (wordIndex > 0) {
        // Natural pause between words
        visemes.push({ time: currentTime, viseme: 'sil', intensity: 0 });
        currentTime += msPerPhoneme * 0.3;
      }
      
      const phonemes = estimatePhonemesFromWord(word);
      
      phonemes.forEach((phoneme, phonemeIndex) => {
        const phonemeData = phonemeToViseme[phoneme] || { shape: 'neutral', intensity: 0.3 };
        
        // Add slight variation for naturalness
        const intensityVariation = 0.8 + (Math.random() * 0.4);
        const adjustedIntensity = Math.min(1.0, phonemeData.intensity * intensityVariation);
        
        visemes.push({ 
          time: currentTime, 
          viseme: phonemeData.shape, 
          intensity: adjustedIntensity 
        });
        
        // Vary timing slightly for natural speech rhythm
        const timingVariation = 0.8 + (Math.random() * 0.4);
        currentTime += msPerPhoneme * timingVariation;
      });
    });
    
    // End with neutral position
    visemes.push({ time: currentTime, viseme: 'neutral', intensity: 0 });
    
    return visemes;
  }, [phonemeToViseme]);

  // Enhanced phoneme estimation
  const estimatePhonemesFromWord = (word: string): string[] => {
    const phonemes: string[] = [];
    let i = 0;
    
    while (i < word.length) {
      const char = word[i];
      const nextChar = word[i + 1];
      const prevChar = word[i - 1];
      
      // Handle complex digraphs and trigraphs
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
      } else if (char === 'p' && nextChar === 'h') {
        phonemes.push('f');
        i += 2;
      } else if (char === 'g' && nextChar === 'h') {
        phonemes.push('g');
        i += 2;
      } else if (char === 'e' && nextChar === 'a') {
        phonemes.push('eh');
        i += 2;
      } else if (char === 'o' && nextChar === 'u') {
        phonemes.push('aw');
        i += 2;
      } else if (char === 'a' && nextChar === 'i') {
        phonemes.push('ay');
        i += 2;
      } else {
        // Enhanced single character mapping
        switch (char) {
          case 'a': phonemes.push(nextChar === 'r' ? 'aa' : 'ae'); break;
          case 'e': phonemes.push(nextChar === 'r' ? 'er' : 'eh'); break;
          case 'i': phonemes.push('ih'); break;
          case 'o': phonemes.push('oh'); break;
          case 'u': phonemes.push('uh'); break;
          case 'y': phonemes.push('iy'); break;
          default: phonemes.push(char); break;
        }
        i++;
      }
    }
    
    return phonemes;
  };

  // Ultra-realistic mouth shapes with proper lip positioning
  const getMouthPath = (viseme: string, intensity: number = 0.5): string => {
    const baseIntensity = Math.max(0.3, intensity);
    const scale = 0.7 + (baseIntensity * 0.6); // Scale mouth opening based on intensity
    
    switch (viseme) {
      case 'aa': // Wide open for "ah" sounds
        const aaHeight = 15 + (baseIntensity * 12);
        const aaWidth = 20 + (baseIntensity * 8);
        return `M ${150 - aaWidth} ${190 - aaHeight/2} 
                Q 150 ${190 + aaHeight} ${150 + aaWidth} ${190 - aaHeight/2} 
                Q 150 ${190 + aaHeight/2} ${150 - aaWidth} ${190 - aaHeight/2}`;
                
      case 'eh': // Mid vowels
        const ehHeight = 8 + (baseIntensity * 6);
        const ehWidth = 16 + (baseIntensity * 6);
        return `M ${150 - ehWidth} ${190 - ehHeight/2} 
                Q 150 ${190 + ehHeight} ${150 + ehWidth} ${190 - ehHeight/2} 
                Q 150 ${190 + ehHeight/3} ${150 - ehWidth} ${190 - ehHeight/2}`;
                
      case 'ih': // High vowels like "ee"
        const ihHeight = 4 + (baseIntensity * 4);
        const ihWidth = 18 + (baseIntensity * 4);
        return `M ${150 - ihWidth} ${190 - ihHeight/2} 
                Q 150 ${190 + ihHeight} ${150 + ihWidth} ${190 - ihHeight/2} 
                Q 150 ${190 + ihHeight/4} ${150 - ihWidth} ${190 - ihHeight/2}`;
                
      case 'oh': // Rounded vowels
        const ohHeight = 12 + (baseIntensity * 8);
        const ohWidth = 12 + (baseIntensity * 4);
        return `M ${150 - ohWidth} ${190 - ohHeight/2} 
                Q 150 ${190 + ohHeight} ${150 + ohWidth} ${190 - ohHeight/2} 
                Q 150 ${190 + ohHeight/3} ${150 - ohWidth} ${190 - ohHeight/2}`;
                
      case 'uu': // Very rounded like "oo"
        const uuHeight = 10 + (baseIntensity * 6);
        const uuWidth = 8 + (baseIntensity * 3);
        return `M ${150 - uuWidth} ${190 - uuHeight/2} 
                Q 150 ${190 + uuHeight} ${150 + uuWidth} ${190 - uuHeight/2} 
                Q 150 ${190 + uuHeight/4} ${150 - uuWidth} ${190 - uuHeight/2}`;
                
      case 'pp': // Lips pressed together
        return `M 145 190 L 155 190`;
        
      case 'ff': // Lip-teeth contact
        const ffWidth = 14 + (baseIntensity * 4);
        return `M ${150 - ffWidth} 190 Q 150 ${188 - baseIntensity * 2} ${150 + ffWidth} 190`;
        
      case 'dd': // Tongue-teeth contact
        const ddHeight = 6 + (baseIntensity * 4);
        const ddWidth = 14 + (baseIntensity * 4);
        return `M ${150 - ddWidth} ${190 - ddHeight/2} 
                Q 150 ${190 + ddHeight} ${150 + ddWidth} ${190 - ddHeight/2}`;
                
      case 'th': // Tongue between teeth
        const thWidth = 16 + (baseIntensity * 4);
        return `M ${150 - thWidth} 190 Q 150 ${188 - baseIntensity * 3} ${150 + thWidth} 190`;
        
      case 'ss': // Sibilant sounds
        const ssHeight = 3 + (baseIntensity * 3);
        const ssWidth = 12 + (baseIntensity * 3);
        return `M ${150 - ssWidth} ${190 - ssHeight/2} 
                Q 150 ${190 + ssHeight} ${150 + ssWidth} ${190 - ssHeight/2}`;
                
      case 'ch': // Affricates
        const chHeight = 8 + (baseIntensity * 5);
        const chWidth = 10 + (baseIntensity * 4);
        return `M ${150 - chWidth} ${190 - chHeight/2} 
                Q 150 ${190 + chHeight} ${150 + chWidth} ${190 - chHeight/2}`;
                
      case 'kk': // Back consonants
        const kkHeight = 6 + (baseIntensity * 4);
        const kkWidth = 12 + (baseIntensity * 4);
        return `M ${150 - kkWidth} ${190 - kkHeight/2} 
                Q 150 ${190 + kkHeight} ${150 + kkWidth} ${190 - kkHeight/2}`;
                
      case 'rr': // R sound with lip rounding
        const rrHeight = 8 + (baseIntensity * 4);
        const rrWidth = 10 + (baseIntensity * 3);
        return `M ${150 - rrWidth} ${190 - rrHeight/2} 
                Q 150 ${190 + rrHeight} ${150 + rrWidth} ${190 - rrHeight/2}`;
                
      case 'ww': // W sound with strong lip rounding
        const wwHeight = 10 + (baseIntensity * 5);
        const wwWidth = 8 + (baseIntensity * 2);
        return `M ${150 - wwWidth} ${190 - wwHeight/2} 
                Q 150 ${190 + wwHeight} ${150 + wwWidth} ${190 - wwHeight/2}`;
                
      case 'sil': // Silence - lips slightly apart
        return `M 145 190 L 155 190`;
        
      case 'neutral':
      default: // Neutral resting position
        return `M 142 190 Q 150 194 158 190 Q 150 192 142 190`;
    }
  };

  // Animate visemes with intensity
  useEffect(() => {
    if (!isSpeaking || !currentText) {
      setCurrentViseme('neutral');
      setMouthIntensity(0);
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
        setMouthIntensity(currentVisemeData.intensity);
        visemeIndexRef.current++;
      }
      
      if (visemeIndexRef.current < visemeSequence.length && isSpeaking) {
        animationFrameRef.current = requestAnimationFrame(animateVisemes);
      } else {
        setCurrentViseme('neutral');
        setMouthIntensity(0);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateVisemes);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking, currentText, generateVisemeSequence]);

  // Enhanced eye blinking with natural timing
  useEffect(() => {
    const blink = () => {
      setEyeBlinkState(true);
      setTimeout(() => setEyeBlinkState(false), 120 + Math.random() * 80);
    };

    // More natural blinking pattern
    const scheduleNextBlink = () => {
      const delay = 1500 + Math.random() * 4000; // 1.5-5.5 seconds
      setTimeout(() => {
        blink();
        scheduleNextBlink();
      }, delay);
    };

    scheduleNextBlink();
  }, []);

  // Natural head movements and eye tracking
  useEffect(() => {
    const moveHead = () => {
      setHeadPosition({
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 4,
        rotation: (Math.random() - 0.5) * 3
      });
      
      // Subtle eye movements
      setEyeMovement({
        x: (Math.random() - 0.5) * 3,
        y: (Math.random() - 0.5) * 2
      });
    };

    const headMovementInterval = setInterval(moveHead, 2000 + Math.random() * 3000);
    return () => clearInterval(headMovementInterval);
  }, []);

  // Initialize avatar
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-pulse bg-gradient-to-br from-purple-200 to-blue-200 rounded-full w-48 h-48"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{
          x: headPosition.x,
          y: headPosition.y,
          rotate: headPosition.rotation,
          scale: isSpeaking ? [1, 1.02, 1] : 1
        }}
        transition={{
          x: { duration: 3, ease: "easeInOut" },
          y: { duration: 3, ease: "easeInOut" },
          rotate: { duration: 4, ease: "easeInOut" },
          scale: { duration: 0.6, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }
        }}
        className="relative"
      >
        {/* Ultra-realistic AI Human Avatar */}
        <svg
          width="400"
          height="500"
          viewBox="0 0 400 500"
          className="drop-shadow-xl max-w-full max-h-full"
        >
          {/* Enhanced gradient definitions */}
          <defs>
            <radialGradient id="faceGradient" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="50%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
            <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#92400E" />
              <stop offset="50%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
            <radialGradient id="eyeGradient" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="70%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </radialGradient>
            <linearGradient id="lipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="50%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          
          {/* Neck and shoulders */}
          <ellipse cx="200" cy="450" rx="80" ry="40" fill="url(#faceGradient)" />
          <rect x="140" y="420" width="120" height="80" fill="#6366F1" rx="20" />
          
          {/* Face shape with realistic proportions */}
          <ellipse
            cx="200"
            cy="220"
            rx="95"
            ry="120"
            fill="url(#faceGradient)"
            className="filter drop-shadow-lg"
          />
          
          {/* Realistic hair with texture */}
          <path
            d="M 105 140 Q 200 80 295 140 Q 295 160 285 180 Q 200 100 115 180 Q 105 160 105 140"
            fill="url(#hairGradient)"
            className="filter drop-shadow-md"
          />
          <path
            d="M 120 160 Q 200 120 280 160 Q 270 175 260 185 Q 200 140 140 185 Q 130 175 120 160"
            fill="url(#hairGradient)"
            opacity="0.8"
          />
          
          {/* Forehead and facial structure */}
          <ellipse cx="200" cy="180" rx="85" ry="25" fill="url(#faceGradient)" opacity="0.3" />
          
          {/* Enhanced eyes with realistic movement */}
          <motion.g
            animate={{
              x: eyeMovement.x,
              y: eyeMovement.y,
              scaleY: eyeBlinkState ? 0.1 : 1
            }}
            transition={{ duration: 0.1 }}
          >
            {/* Left eye socket */}
            <ellipse cx="165" cy="200" rx="20" ry="15" fill="white" stroke="#E5E7EB" strokeWidth="1" />
            <ellipse cx="165" cy="200" rx="12" ry="12" fill="url(#eyeGradient)" />
            <circle cx="165" cy="200" r="6" fill="#000000" />
            <circle cx="167" cy="197" r="3" fill="white" opacity="0.9" />
            <circle cx="168" cy="198" r="1.5" fill="white" />
            
            {/* Right eye socket */}
            <ellipse cx="235" cy="200" rx="20" ry="15" fill="white" stroke="#E5E7EB" strokeWidth="1" />
            <ellipse cx="235" cy="200" rx="12" ry="12" fill="url(#eyeGradient)" />
            <circle cx="235" cy="200" r="6" fill="#000000" />
            <circle cx="237" cy="197" r="3" fill="white" opacity="0.9" />
            <circle cx="238" cy="198" r="1.5" fill="white" />
          </motion.g>
          
          {/* Realistic eyebrows with texture */}
          <path d="M 140 175 Q 165 165 190 175" stroke="#78350F" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 210 175 Q 235 165 260 175" stroke="#78350F" strokeWidth="8" fill="none" strokeLinecap="round" />
          
          {/* Nose with realistic shading */}
          <path d="M 200 210 L 190 235 Q 200 240 210 235 Z" fill="#F59E0B" opacity="0.7" />
          <path d="M 195 235 Q 200 238 205 235" stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round" />
          
          {/* Enhanced mouth with ultra-realistic lip sync */}
          <motion.g>
            <motion.path
              d={getMouthPath(currentViseme, mouthIntensity)}
              fill="url(#lipGradient)"
              stroke="#B91C1C"
              strokeWidth="1.5"
              animate={{
                d: getMouthPath(currentViseme, mouthIntensity)
              }}
              transition={{ duration: 0.08, ease: "easeInOut" }}
              className="filter drop-shadow-sm"
            />
            {/* Lip highlight for realism */}
            <motion.path
              d={getMouthPath(currentViseme, mouthIntensity * 0.6)}
              fill="none"
              stroke="#FCA5A5"
              strokeWidth="1"
              opacity="0.6"
              animate={{
                d: getMouthPath(currentViseme, mouthIntensity * 0.6)
              }}
              transition={{ duration: 0.08, ease: "easeInOut" }}
            />
          </motion.g>
          
          {/* Realistic cheeks with subtle coloring */}
          <circle cx="140" cy="220" r="15" fill="#F59E0B" opacity="0.4" />
          <circle cx="260" cy="220" r="15" fill="#F59E0B" opacity="0.4" />
          
          {/* Chin definition */}
          <ellipse cx="200" cy="280" rx="40" ry="20" fill="url(#faceGradient)" opacity="0.3" />
          
          {/* Speaking pulse indicator */}
          {isSpeaking && (
            <motion.circle
              cx="200"
              cy="480"
              r="12"
              fill="#10B981"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          
          {/* Subtle facial shadows for depth */}
          <ellipse cx="200" cy="240" rx="70" ry="80" fill="none" stroke="#D97706" strokeWidth="1" opacity="0.2" />
        </svg>
        
        {/* Enhanced status indicators */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
          {isSpeaking && (
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
            >
              🎤 Speaking
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AIAvatar;