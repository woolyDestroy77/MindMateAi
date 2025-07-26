import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface AIAvatarProps {
  isSpeaking: boolean;
  currentText?: string;
  className?: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'concerned' | 'excited' | 'calm';
  intensity?: number;
}

interface VisemeData {
  time: number;
  viseme: string;
  intensity: number;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ 
  isSpeaking, 
  currentText = '', 
  className = '',
  emotion = 'neutral',
  intensity = 0.5
}) => {
  const [currentViseme, setCurrentViseme] = useState('neutral');
  const [eyeBlinkState, setEyeBlinkState] = useState(false);
  const [headPosition, setHeadPosition] = useState({ x: 0, y: 0, rotation: 0 });
  const [mouthIntensity, setMouthIntensity] = useState(0);
  const [eyeMovement, setEyeMovement] = useState({ x: 0, y: 0 });
  const [facialExpression, setFacialExpression] = useState('neutral');
  const [breathingPhase, setBreathingPhase] = useState(0);
  const animationFrameRef = useRef<number>();
  const visemeIndexRef = useRef<number>(0);

  // Ultra-realistic phoneme to viseme mapping with emotional variations
  const phonemeToViseme: { [key: string]: { shape: string; intensity: number; duration: number } } = {
    // Vowels with natural timing
    'a': { shape: 'aa', intensity: 0.9, duration: 120 }, 
    'e': { shape: 'eh', intensity: 0.6, duration: 100 }, 
    'i': { shape: 'ih', intensity: 0.4, duration: 90 }, 
    'o': { shape: 'oh', intensity: 0.8, duration: 130 }, 
    'u': { shape: 'uu', intensity: 0.7, duration: 110 },
    
    // Extended vowels
    'aa': { shape: 'aa', intensity: 0.9, duration: 140 }, 
    'ae': { shape: 'aa', intensity: 0.8, duration: 120 }, 
    'ah': { shape: 'aa', intensity: 0.7, duration: 110 }, 
    'ao': { shape: 'oh', intensity: 0.8, duration: 130 }, 
    'aw': { shape: 'oh', intensity: 0.9, duration: 150 }, 
    'ay': { shape: 'aa', intensity: 0.6, duration: 100 },
    'eh': { shape: 'eh', intensity: 0.6, duration: 100 }, 
    'er': { shape: 'er', intensity: 0.5, duration: 120 }, 
    'ey': { shape: 'eh', intensity: 0.7, duration: 110 }, 
    'ih': { shape: 'ih', intensity: 0.4, duration: 90 },
    'iy': { shape: 'ih', intensity: 0.5, duration: 100 }, 
    'ow': { shape: 'oh', intensity: 0.8, duration: 140 }, 
    'oy': { shape: 'oh', intensity: 0.7, duration: 120 }, 
    'uh': { shape: 'uu', intensity: 0.5, duration: 100 }, 
    'uw': { shape: 'uu', intensity: 0.8, duration: 130 },
    
    // Consonants with realistic timing
    'b': { shape: 'pp', intensity: 1.0, duration: 80 }, 
    'p': { shape: 'pp', intensity: 1.0, duration: 90 }, 
    'm': { shape: 'pp', intensity: 0.9, duration: 100 },
    'f': { shape: 'ff', intensity: 0.7, duration: 110 }, 
    'v': { shape: 'ff', intensity: 0.8, duration: 100 },
    'd': { shape: 'dd', intensity: 0.6, duration: 70 }, 
    't': { shape: 'dd', intensity: 0.7, duration: 80 }, 
    'n': { shape: 'dd', intensity: 0.5, duration: 90 }, 
    'l': { shape: 'dd', intensity: 0.6, duration: 100 },
    'th': { shape: 'th', intensity: 0.5, duration: 120 }, 
    'dh': { shape: 'th', intensity: 0.6, duration: 110 },
    's': { shape: 'ss', intensity: 0.4, duration: 100 }, 
    'z': { shape: 'ss', intensity: 0.5, duration: 90 }, 
    'sh': { shape: 'ch', intensity: 0.6, duration: 110 }, 
    'zh': { shape: 'ch', intensity: 0.7, duration: 100 },
    'ch': { shape: 'ch', intensity: 0.8, duration: 120 }, 
    'jh': { shape: 'ch', intensity: 0.8, duration: 110 },
    'k': { shape: 'kk', intensity: 0.6, duration: 80 }, 
    'g': { shape: 'kk', intensity: 0.7, duration: 90 }, 
    'ng': { shape: 'kk', intensity: 0.5, duration: 100 },
    'r': { shape: 'rr', intensity: 0.6, duration: 100 }, 
    'w': { shape: 'ww', intensity: 0.8, duration: 120 }, 
    'y': { shape: 'ih', intensity: 0.4, duration: 80 }, 
    'h': { shape: 'sil', intensity: 0.2, duration: 60 }
  };

  // Emotional expressions that affect facial features
  const emotionalExpressions = {
    neutral: { eyebrowHeight: 0, eyeSize: 1, mouthCurve: 0, cheekRaise: 0 },
    happy: { eyebrowHeight: 2, eyeSize: 0.9, mouthCurve: 8, cheekRaise: 3 },
    sad: { eyebrowHeight: -3, eyeSize: 0.8, mouthCurve: -5, cheekRaise: -2 },
    concerned: { eyebrowHeight: -2, eyeSize: 1.1, mouthCurve: -2, cheekRaise: 0 },
    excited: { eyebrowHeight: 4, eyeSize: 1.2, mouthCurve: 12, cheekRaise: 5 },
    calm: { eyebrowHeight: 1, eyeSize: 0.95, mouthCurve: 2, cheekRaise: 1 }
  };

  // Generate ultra-realistic viseme sequence with emotional context
  const generateVisemeSequence = useCallback((text: string): VisemeData[] => {
    if (!text) return [];
    
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const visemes: VisemeData[] = [];
    let currentTime = 0;
    
    // Emotional speaking rate adjustment
    const emotionalSpeedMultiplier = emotion === 'excited' ? 1.2 : emotion === 'sad' ? 0.8 : 1.0;
    const baseWordsPerMinute = 150 * emotionalSpeedMultiplier;
    const avgPhonemesPerWord = 4.5;
    const msPerPhoneme = (60 * 1000) / (baseWordsPerMinute * avgPhonemesPerWord);
    
    words.forEach((word, wordIndex) => {
      if (wordIndex > 0) {
        // Natural pause between words (longer for emotional emphasis)
        const pauseDuration = emotion === 'sad' ? 0.5 : emotion === 'excited' ? 0.2 : 0.3;
        visemes.push({ time: currentTime, viseme: 'sil', intensity: 0 });
        currentTime += msPerPhoneme * pauseDuration;
      }
      
      const phonemes = estimatePhonemesFromWord(word);
      
      phonemes.forEach((phoneme) => {
        const phonemeData = phonemeToViseme[phoneme] || { shape: 'neutral', intensity: 0.3, duration: 100 };
        
        // Emotional intensity variation
        const emotionalIntensityMultiplier = emotion === 'excited' ? 1.3 : emotion === 'sad' ? 0.7 : 1.0;
        const naturalVariation = 0.85 + (Math.random() * 0.3);
        const adjustedIntensity = Math.min(1.0, phonemeData.intensity * emotionalIntensityMultiplier * naturalVariation);
        
        visemes.push({ 
          time: currentTime, 
          viseme: phonemeData.shape, 
          intensity: adjustedIntensity 
        });
        
        // Use phoneme-specific duration with emotional adjustment
        const emotionalDurationMultiplier = emotion === 'sad' ? 1.2 : emotion === 'excited' ? 0.8 : 1.0;
        currentTime += phonemeData.duration * emotionalDurationMultiplier;
      });
    });
    
    // End with neutral position
    visemes.push({ time: currentTime, viseme: 'neutral', intensity: 0 });
    
    return visemes;
  }, [phonemeToViseme, emotion]);

  // Advanced phoneme estimation with better accuracy
  const estimatePhonemesFromWord = (word: string): string[] => {
    const phonemes: string[] = [];
    let i = 0;
    
    while (i < word.length) {
      const char = word[i];
      const nextChar = word[i + 1];
      const nextTwoChars = word.slice(i + 1, i + 3);
      
      // Handle complex combinations first
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
      } else if (char === 'o' && nextChar === 'u') {
        phonemes.push('aw');
        i += 2;
      } else if (char === 'a' && nextChar === 'i') {
        phonemes.push('ay');
        i += 2;
      } else if (char === 'e' && nextChar === 'a') {
        phonemes.push('eh');
        i += 2;
      } else if (char === 'o' && nextChar === 'o') {
        phonemes.push('uu');
        i += 2;
      } else if (char === 'e' && nextChar === 'e') {
        phonemes.push('ih');
        i += 2;
      } else {
        // Enhanced single character mapping with context
        switch (char) {
          case 'a': 
            phonemes.push(nextChar === 'r' ? 'aa' : nextChar === 'w' ? 'aw' : 'ae'); 
            break;
          case 'e': 
            phonemes.push(nextChar === 'r' ? 'er' : nextChar === 'w' ? 'uu' : 'eh'); 
            break;
          case 'i': 
            phonemes.push(nextChar === 'r' ? 'er' : 'ih'); 
            break;
          case 'o': 
            phonemes.push(nextChar === 'r' ? 'ao' : nextChar === 'w' ? 'ow' : 'oh'); 
            break;
          case 'u': 
            phonemes.push(nextChar === 'r' ? 'er' : 'uh'); 
            break;
          case 'y': 
            phonemes.push(i === 0 ? 'y' : 'iy'); 
            break;
          default: 
            phonemes.push(char); 
            break;
        }
        i++;
      }
    }
    
    return phonemes;
  };

  // Ultra-realistic mouth shapes with emotional variations
  const getMouthPath = (viseme: string, intensity: number = 0.5, emotion: string = 'neutral'): string => {
    const baseIntensity = Math.max(0.2, intensity);
    const emotionalMod = emotionalExpressions[emotion as keyof typeof emotionalExpressions] || emotionalExpressions.neutral;
    const mouthCurve = emotionalMod.mouthCurve;
    
    switch (viseme) {
      case 'aa': // Wide open for "ah" sounds
        const aaHeight = 18 + (baseIntensity * 15) + (emotion === 'excited' ? 5 : 0);
        const aaWidth = 25 + (baseIntensity * 10);
        return `M ${200 - aaWidth} ${240 - aaHeight/2 + mouthCurve} 
                Q 200 ${240 + aaHeight + mouthCurve} ${200 + aaWidth} ${240 - aaHeight/2 + mouthCurve} 
                Q 200 ${240 + aaHeight/2 + mouthCurve} ${200 - aaWidth} ${240 - aaHeight/2 + mouthCurve}`;
                
      case 'eh': // Mid vowels
        const ehHeight = 10 + (baseIntensity * 8);
        const ehWidth = 20 + (baseIntensity * 8);
        return `M ${200 - ehWidth} ${240 - ehHeight/2 + mouthCurve} 
                Q 200 ${240 + ehHeight + mouthCurve} ${200 + ehWidth} ${240 - ehHeight/2 + mouthCurve} 
                Q 200 ${240 + ehHeight/3 + mouthCurve} ${200 - ehWidth} ${240 - ehHeight/2 + mouthCurve}`;
                
      case 'ih': // High vowels like "ee"
        const ihHeight = 6 + (baseIntensity * 5);
        const ihWidth = 22 + (baseIntensity * 6);
        return `M ${200 - ihWidth} ${240 - ihHeight/2 + mouthCurve} 
                Q 200 ${240 + ihHeight + mouthCurve} ${200 + ihWidth} ${240 - ihHeight/2 + mouthCurve} 
                Q 200 ${240 + ihHeight/4 + mouthCurve} ${200 - ihWidth} ${240 - ihHeight/2 + mouthCurve}`;
                
      case 'oh': // Rounded vowels
        const ohHeight = 15 + (baseIntensity * 10);
        const ohWidth = 15 + (baseIntensity * 6);
        return `M ${200 - ohWidth} ${240 - ohHeight/2 + mouthCurve} 
                Q 200 ${240 + ohHeight + mouthCurve} ${200 + ohWidth} ${240 - ohHeight/2 + mouthCurve} 
                Q 200 ${240 + ohHeight/3 + mouthCurve} ${200 - ohWidth} ${240 - ohHeight/2 + mouthCurve}`;
                
      case 'uu': // Very rounded like "oo"
        const uuHeight = 12 + (baseIntensity * 8);
        const uuWidth = 10 + (baseIntensity * 4);
        return `M ${200 - uuWidth} ${240 - uuHeight/2 + mouthCurve} 
                Q 200 ${240 + uuHeight + mouthCurve} ${200 + uuWidth} ${240 - uuHeight/2 + mouthCurve} 
                Q 200 ${240 + uuHeight/4 + mouthCurve} ${200 - uuWidth} ${240 - uuHeight/2 + mouthCurve}`;
                
      case 'pp': // Lips pressed together
        return `M ${195 + mouthCurve/2} ${240 + mouthCurve} L ${205 - mouthCurve/2} ${240 + mouthCurve}`;
        
      case 'ff': // Lip-teeth contact
        const ffWidth = 18 + (baseIntensity * 6);
        return `M ${200 - ffWidth} ${240 + mouthCurve} Q 200 ${238 - baseIntensity * 3 + mouthCurve} ${200 + ffWidth} ${240 + mouthCurve}`;
        
      case 'dd': // Tongue-teeth contact
        const ddHeight = 8 + (baseIntensity * 6);
        const ddWidth = 18 + (baseIntensity * 6);
        return `M ${200 - ddWidth} ${240 - ddHeight/2 + mouthCurve} 
                Q 200 ${240 + ddHeight + mouthCurve} ${200 + ddWidth} ${240 - ddHeight/2 + mouthCurve}`;
                
      case 'th': // Tongue between teeth
        const thWidth = 20 + (baseIntensity * 6);
        return `M ${200 - thWidth} ${240 + mouthCurve} Q 200 ${238 - baseIntensity * 4 + mouthCurve} ${200 + thWidth} ${240 + mouthCurve}`;
        
      case 'ss': // Sibilant sounds
        const ssHeight = 4 + (baseIntensity * 4);
        const ssWidth = 16 + (baseIntensity * 4);
        return `M ${200 - ssWidth} ${240 - ssHeight/2 + mouthCurve} 
                Q 200 ${240 + ssHeight + mouthCurve} ${200 + ssWidth} ${240 - ssHeight/2 + mouthCurve}`;
                
      case 'ch': // Affricates
        const chHeight = 10 + (baseIntensity * 7);
        const chWidth = 14 + (baseIntensity * 6);
        return `M ${200 - chWidth} ${240 - chHeight/2 + mouthCurve} 
                Q 200 ${240 + chHeight + mouthCurve} ${200 + chWidth} ${240 - chHeight/2 + mouthCurve}`;
                
      case 'kk': // Back consonants
        const kkHeight = 8 + (baseIntensity * 6);
        const kkWidth = 16 + (baseIntensity * 6);
        return `M ${200 - kkWidth} ${240 - kkHeight/2 + mouthCurve} 
                Q 200 ${240 + kkHeight + mouthCurve} ${200 + kkWidth} ${240 - kkHeight/2 + mouthCurve}`;
                
      case 'rr': // R sound with lip rounding
        const rrHeight = 10 + (baseIntensity * 6);
        const rrWidth = 12 + (baseIntensity * 4);
        return `M ${200 - rrWidth} ${240 - rrHeight/2 + mouthCurve} 
                Q 200 ${240 + rrHeight + mouthCurve} ${200 + rrWidth} ${240 - rrHeight/2 + mouthCurve}`;
                
      case 'ww': // W sound with strong lip rounding
        const wwHeight = 12 + (baseIntensity * 7);
        const wwWidth = 10 + (baseIntensity * 3);
        return `M ${200 - wwWidth} ${240 - wwHeight/2 + mouthCurve} 
                Q 200 ${240 + wwHeight + mouthCurve} ${200 + wwWidth} ${240 - wwHeight/2 + mouthCurve}`;
                
      case 'sil': // Silence - lips slightly apart
        return `M ${195 + mouthCurve/3} ${240 + mouthCurve} L ${205 - mouthCurve/3} ${240 + mouthCurve}`;
        
      case 'neutral':
      default: // Neutral resting position with emotional curve
        return `M ${190 + mouthCurve/2} ${240 + mouthCurve} Q 200 ${244 + mouthCurve} ${210 - mouthCurve/2} ${240 + mouthCurve} Q 200 ${242 + mouthCurve} ${190 + mouthCurve/2} ${240 + mouthCurve}`;
    }
  };

  // Animate visemes with emotional context
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

  // Enhanced natural blinking with emotional variation
  useEffect(() => {
    const blink = () => {
      setEyeBlinkState(true);
      const blinkDuration = emotion === 'sad' ? 180 : emotion === 'excited' ? 80 : 130;
      setTimeout(() => setEyeBlinkState(false), blinkDuration);
    };

    const scheduleNextBlink = () => {
      const baseDelay = emotion === 'excited' ? 1000 : emotion === 'sad' ? 3000 : 2000;
      const randomVariation = Math.random() * 3000;
      const delay = baseDelay + randomVariation;
      
      setTimeout(() => {
        blink();
        scheduleNextBlink();
      }, delay);
    };

    scheduleNextBlink();
  }, [emotion]);

  // Natural head movements with emotional personality
  useEffect(() => {
    const moveHead = () => {
      const emotionalMovement = emotion === 'excited' ? 2.0 : emotion === 'sad' ? 0.5 : 1.0;
      
      setHeadPosition({
        x: (Math.random() - 0.5) * 8 * emotionalMovement,
        y: (Math.random() - 0.5) * 6 * emotionalMovement,
        rotation: (Math.random() - 0.5) * 4 * emotionalMovement
      });
      
      // Emotional eye movements
      setEyeMovement({
        x: (Math.random() - 0.5) * 4 * emotionalMovement,
        y: (Math.random() - 0.5) * 3 * emotionalMovement
      });
    };

    const movementInterval = emotion === 'excited' ? 1500 : emotion === 'sad' ? 4000 : 2500;
    const headMovementInterval = setInterval(moveHead, movementInterval + Math.random() * 2000);
    return () => clearInterval(headMovementInterval);
  }, [emotion]);

  // Breathing animation for life-like presence
  useEffect(() => {
    const breathe = () => {
      setBreathingPhase(prev => (prev + 1) % 4);
    };

    const breathingInterval = setInterval(breathe, 1000); // 4-second breathing cycle
    return () => clearInterval(breathingInterval);
  }, []);

  // Update facial expression based on emotion
  useEffect(() => {
    setFacialExpression(emotion);
  }, [emotion]);

  const currentExpression = emotionalExpressions[facialExpression as keyof typeof emotionalExpressions] || emotionalExpressions.neutral;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{
          x: headPosition.x,
          y: headPosition.y,
          rotate: headPosition.rotation,
          scale: isSpeaking ? [1, 1.02, 1] : [1, 1.005, 1] // Subtle breathing
        }}
        transition={{
          x: { duration: 3, ease: "easeInOut" },
          y: { duration: 3, ease: "easeInOut" },
          rotate: { duration: 4, ease: "easeInOut" },
          scale: { 
            duration: isSpeaking ? 0.6 : 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }
        }}
        className="relative"
      >
        {/* Ultra-realistic AI Human Avatar */}
        <svg
          width="500"
          height="600"
          viewBox="0 0 500 600"
          className="drop-shadow-2xl max-w-full max-h-full"
        >
          {/* Enhanced gradient definitions for photorealism */}
          <defs>
            <radialGradient id="faceGradient" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFEAA7" />
              <stop offset="30%" stopColor="#FDCB6E" />
              <stop offset="70%" stopColor="#E17055" />
              <stop offset="100%" stopColor="#D63031" />
            </radialGradient>
            <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C5CE7" />
              <stop offset="50%" stopColor="#5F3DC4" />
              <stop offset="100%" stopColor="#4C1D95" />
            </linearGradient>
            <radialGradient id="eyeGradient" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#74B9FF" />
              <stop offset="50%" stopColor="#0984E3" />
              <stop offset="100%" stopColor="#2D3436" />
            </radialGradient>
            <linearGradient id="lipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FD79A8" />
              <stop offset="50%" stopColor="#E84393" />
              <stop offset="100%" stopColor="#C0392B" />
            </radialGradient>
            <radialGradient id="cheekGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF7675" />
              <stop offset="100%" stopColor="#E17055" />
            </radialGradient>
            <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#2D3436" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Neck and shoulders with realistic shading */}
          <ellipse cx="250" cy="550" rx="100" ry="50" fill="url(#faceGradient)" opacity="0.8" />
          <rect x="170" y="520" width="160" height="80" fill="#6C5CE7" rx="25" />
          <rect x="180" y="530" width="140" height="70" fill="#5F3DC4" rx="20" />
          
          {/* Face shape with ultra-realistic proportions */}
          <ellipse
            cx="250"
            cy="280"
            rx="120"
            ry="150"
            fill="url(#faceGradient)"
            filter="url(#softShadow)"
            className="filter drop-shadow-xl"
          />
          
          {/* Realistic hair with multiple layers and texture */}
          <path
            d="M 130 180 Q 250 100 370 180 Q 370 200 360 220 Q 250 120 140 220 Q 130 200 130 180"
            fill="url(#hairGradient)"
            filter="url(#softShadow)"
          />
          <path
            d="M 145 200 Q 250 140 355 200 Q 345 215 335 225 Q 250 160 165 225 Q 155 215 145 200"
            fill="url(#hairGradient)"
            opacity="0.9"
          />
          <path
            d="M 160 220 Q 250 180 340 220 Q 330 230 320 235 Q 250 200 180 235 Q 170 230 160 220"
            fill="url(#hairGradient)"
            opacity="0.7"
          />
          
          {/* Forehead and facial structure with depth */}
          <ellipse cx="250" cy="220" rx="100" ry="30" fill="url(#faceGradient)" opacity="0.4" />
          <ellipse cx="250" cy="240" rx="90" ry="20" fill="#FDCB6E" opacity="0.3" />
          
          {/* Enhanced eyes with ultra-realistic movement and emotion */}
          <motion.g
            animate={{
              x: eyeMovement.x,
              y: eyeMovement.y,
              scaleY: eyeBlinkState ? 0.1 : 1,
              scaleX: currentExpression.eyeSize
            }}
            transition={{ duration: 0.1 }}
          >
            {/* Left eye socket with depth */}
            <ellipse cx="210" cy="250" rx="25" ry="18" fill="white" stroke="#DDD" strokeWidth="1" />
            <ellipse cx="210" cy="250" rx="20" ry="15" fill="#F8F9FA" />
            <ellipse cx="210" cy="250" rx="15" ry="15" fill="url(#eyeGradient)" />
            <circle cx="210" cy="250" r="8" fill="#2D3436" />
            <circle cx="212" cy="247" r="4" fill="white" opacity="0.9" />
            <circle cx="213" cy="248" r="2" fill="white" />
            <ellipse cx="210" cy="245" rx="3" ry="1" fill="white" opacity="0.6" />
            
            {/* Right eye socket with depth */}
            <ellipse cx="290" cy="250" rx="25" ry="18" fill="white" stroke="#DDD" strokeWidth="1" />
            <ellipse cx="290" cy="250" rx="20" ry="15" fill="#F8F9FA" />
            <ellipse cx="290" cy="250" rx="15" ry="15" fill="url(#eyeGradient)" />
            <circle cx="290" cy="250" r="8" fill="#2D3436" />
            <circle cx="292" cy="247" r="4" fill="white" opacity="0.9" />
            <circle cx="293" cy="248" r="2" fill="white" />
            <ellipse cx="290" cy="245" rx="3" ry="1" fill="white" opacity="0.6" />
          </motion.g>
          
          {/* Realistic eyebrows with emotional positioning */}
          <motion.g
            animate={{
              y: currentExpression.eyebrowHeight
            }}
            transition={{ duration: 0.3 }}
          >
            <path d="M 180 225 Q 210 215 240 225" stroke="#4C1D95" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M 260 225 Q 290 215 320 225" stroke="#4C1D95" strokeWidth="10" fill="none" strokeLinecap="round" />
            {/* Eyebrow texture */}
            <path d="M 185 227 Q 210 220 235 227" stroke="#6C5CE7" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M 265 227 Q 290 220 315 227" stroke="#6C5CE7" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
          </motion.g>
          
          {/* Nose with realistic shading and highlights */}
          <path d="M 250 260 L 240 290 Q 250 295 260 290 Z" fill="#E17055" opacity="0.8" />
          <path d="M 245 290 Q 250 293 255 290" stroke="#D63031" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="247" cy="288" rx="2" ry="3" fill="#2D3436" opacity="0.6" />
          <ellipse cx="253" cy="288" rx="2" ry="3" fill="#2D3436" opacity="0.6" />
          <ellipse cx="250" cy="285" rx="1" ry="2" fill="white" opacity="0.4" />
          
          {/* Ultra-enhanced mouth with perfect lip sync and emotional expression */}
          <motion.g>
            <motion.path
              d={getMouthPath(currentViseme, mouthIntensity, emotion)}
              fill="url(#lipGradient)"
              stroke="#C0392B"
              strokeWidth="2"
              animate={{
                d: getMouthPath(currentViseme, mouthIntensity, emotion)
              }}
              transition={{ duration: 0.06, ease: "easeInOut" }}
              filter="url(#softShadow)"
            />
            {/* Lip highlight for ultra-realism */}
            <motion.path
              d={getMouthPath(currentViseme, mouthIntensity * 0.7, emotion)}
              fill="none"
              stroke="#FD79A8"
              strokeWidth="1.5"
              opacity="0.8"
              animate={{
                d: getMouthPath(currentViseme, mouthIntensity * 0.7, emotion)
              }}
              transition={{ duration: 0.06, ease: "easeInOut" }}
            />
            {/* Inner mouth shadow */}
            <motion.path
              d={getMouthPath(currentViseme, mouthIntensity * 0.5, emotion)}
              fill="#2D3436"
              opacity="0.3"
              animate={{
                d: getMouthPath(currentViseme, mouthIntensity * 0.5, emotion)
              }}
              transition={{ duration: 0.06, ease: "easeInOut" }}
            />
          </motion.g>
          
          {/* Realistic cheeks with emotional variation */}
          <motion.g
            animate={{
              y: currentExpression.cheekRaise
            }}
            transition={{ duration: 0.3 }}
          >
            <circle cx="170" cy="280" r="20" fill="url(#cheekGradient)" opacity="0.5" />
            <circle cx="330" cy="280" r="20" fill="url(#cheekGradient)" opacity="0.5" />
            {/* Cheek highlights */}
            <circle cx="175" cy="275" r="8" fill="white" opacity="0.2" />
            <circle cx="325" cy="275" r="8" fill="white" opacity="0.2" />
          </motion.g>
          
          {/* Chin and jawline definition */}
          <ellipse cx="250" cy="350" rx="50" ry="25" fill="url(#faceGradient)" opacity="0.4" />
          <path d="M 200 320 Q 250 360 300 320" stroke="#E17055" strokeWidth="2" fill="none" opacity="0.3" />
          
          {/* Facial shadows for ultra-realistic depth */}
          <ellipse cx="250" cy="300" rx="90" ry="100" fill="none" stroke="#D63031" strokeWidth="1" opacity="0.2" />
          <ellipse cx="220" cy="270" rx="15" ry="8" fill="#E17055" opacity="0.3" />
          <ellipse cx="280" cy="270" rx="15" ry="8" fill="#E17055" opacity="0.3" />
          
          {/* Enhanced status indicators */}
          {isSpeaking && (
            <motion.g>
              <motion.circle
                cx="250"
                cy="580"
                r="15"
                fill="#00B894"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.circle
                cx="250"
                cy="580"
                r="25"
                fill="none"
                stroke="#00B894"
                strokeWidth="2"
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.8, 0, 0.8]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.g>
          )}
          
          {/* Emotional aura effect */}
          {emotion !== 'neutral' && (
            <motion.circle
              cx="250"
              cy="280"
              r="180"
              fill="none"
              stroke={
                emotion === 'happy' ? '#00B894' :
                emotion === 'sad' ? '#74B9FF' :
                emotion === 'excited' ? '#FDCB6E' :
                emotion === 'concerned' ? '#E17055' :
                '#DDD'
              }
              strokeWidth="3"
              opacity="0.2"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </svg>
        
        {/* Enhanced status indicators with emotional context */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
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
              className={`text-white px-6 py-3 rounded-full text-sm font-medium shadow-xl ${
                emotion === 'happy' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                emotion === 'sad' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                emotion === 'excited' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                emotion === 'concerned' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                'bg-gradient-to-r from-purple-500 to-blue-500'
              }`}
            >
              🎤 Speaking {emotion !== 'neutral' && `(${emotion})`}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AIAvatar;