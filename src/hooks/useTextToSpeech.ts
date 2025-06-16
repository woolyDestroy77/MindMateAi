import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
  autoPlay: boolean;
}

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8,
    voice: null,
    autoPlay: false
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced initialization with better browser support detection
  const initializeSpeech = useCallback(() => {
    console.log('🎵 Initializing speech synthesis...');
    
    if (!('speechSynthesis' in window)) {
      console.warn('❌ Speech synthesis not supported');
      setIsSupported(false);
      toast.error('Voice playback is not supported in your browser. Try Chrome, Safari, or Edge for the best experience.');
      return;
    }

    setIsSupported(true);
    
    // Function to load voices with retry mechanism
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      console.log('🎵 Available voices:', availableVoices.length);
      
      if (availableVoices.length === 0) {
        console.log('🎵 No voices loaded yet, retrying...');
        return false;
      }

      setVoices(availableVoices);
      
      // Set default voice with better selection logic
      if (!voiceSettings.voice && availableVoices.length > 0) {
        // Priority order for voice selection
        const voicePreferences = [
          // High-quality female voices
          (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('samantha') && v.lang.startsWith('en'),
          (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('karen') && v.lang.startsWith('en'),
          (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('susan') && v.lang.startsWith('en'),
          (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('female') && v.lang.startsWith('en'),
          // High-quality male voices
          (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('daniel') && v.lang.startsWith('en'),
          (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('alex') && v.lang.startsWith('en'),
          // Any English voice
          (v: SpeechSynthesisVoice) => v.lang.startsWith('en-US'),
          (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
          // Fallback to any voice
          () => true
        ];

        let selectedVoice = null;
        for (const preference of voicePreferences) {
          selectedVoice = availableVoices.find(preference);
          if (selectedVoice) break;
        }

        if (selectedVoice) {
          console.log('🎵 Selected default voice:', selectedVoice.name);
          setVoiceSettings(prev => ({ ...prev, voice: selectedVoice }));
        }
      }
      
      setIsInitialized(true);
      return true;
    };

    // Try to load voices immediately
    if (!loadVoices()) {
      // If voices aren't loaded yet, wait for the event
      const handleVoicesChanged = () => {
        console.log('🎵 Voices changed event fired');
        if (loadVoices()) {
          speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        }
      };

      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback timeout in case the event never fires
      setTimeout(() => {
        if (!isInitialized) {
          console.log('🎵 Timeout reached, forcing voice load');
          loadVoices();
          speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        }
      }, 3000);
    }
  }, [voiceSettings.voice, isInitialized]);

  // Initialize on mount
  useEffect(() => {
    initializeSpeech();
  }, [initializeSpeech]);

  // Enhanced speak function with better error handling
  const speak = useCallback((text: string, messageId: string) => {
    console.log('🎵 Attempting to speak:', { messageId, textLength: text.length, isSupported, isInitialized });

    if (!isSupported) {
      toast.error('Voice playback is not supported in your browser');
      return;
    }

    if (!isInitialized) {
      toast.error('Voice system is still initializing. Please try again in a moment.');
      return;
    }

    // Stop any current speech
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentMessageId(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Enhanced text cleaning for better speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/#{1,6}\s/g, '') // Remove heading markdown
      .replace(/[-•*]\s/g, '') // Remove bullet points
      .replace(/\d+\.\s/g, '') // Remove numbered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
      .replace(/\n+/g, '. ') // Replace line breaks with pauses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Add pauses between sentences
      .trim();

    if (!cleanText || cleanText.length < 2) {
      toast.error('No text to speak');
      return;
    }

    // Limit text length to prevent very long speech
    const maxLength = 1000;
    const finalText = cleanText.length > maxLength 
      ? cleanText.substring(0, maxLength) + '...' 
      : cleanText;

    try {
      // Cancel any existing speech
      speechSynthesis.cancel();
      
      // Small delay to ensure cancellation is processed
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(finalText);
        utteranceRef.current = utterance;

        // Apply voice settings with validation
        utterance.rate = Math.max(0.1, Math.min(3, voiceSettings.rate));
        utterance.pitch = Math.max(0, Math.min(2, voiceSettings.pitch));
        utterance.volume = Math.max(0, Math.min(1, voiceSettings.volume));
        
        if (voiceSettings.voice) {
          utterance.voice = voiceSettings.voice;
          console.log('🎵 Using voice:', voiceSettings.voice.name);
        }

        // Enhanced event handlers
        utterance.onstart = () => {
          console.log('🎵 Speech started for message:', messageId);
          setIsPlaying(true);
          setCurrentMessageId(messageId);
        };

        utterance.onend = () => {
          console.log('🎵 Speech ended for message:', messageId);
          setIsPlaying(false);
          setCurrentMessageId(null);
          utteranceRef.current = null;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };

        utterance.onerror = (event) => {
          console.error('🎵 Speech error:', event.error, event);
          setIsPlaying(false);
          setCurrentMessageId(null);
          utteranceRef.current = null;
          
          // Provide specific error messages
          let errorMessage = 'Voice playback failed';
          switch (event.error) {
            case 'network':
              errorMessage = 'Network error - check your internet connection';
              break;
            case 'synthesis-failed':
              errorMessage = 'Speech synthesis failed - try a different voice';
              break;
            case 'synthesis-unavailable':
              errorMessage = 'Speech synthesis unavailable - try refreshing the page';
              break;
            case 'audio-busy':
              errorMessage = 'Audio system busy - try again in a moment';
              break;
            case 'not-allowed':
              errorMessage = 'Voice playback not allowed - check browser permissions';
              break;
          }
          
          toast.error(errorMessage);
          
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };

        utterance.onpause = () => {
          console.log('🎵 Speech paused');
          setIsPlaying(false);
        };

        utterance.onresume = () => {
          console.log('🎵 Speech resumed');
          setIsPlaying(true);
        };

        // Safety timeout to prevent stuck state
        timeoutRef.current = setTimeout(() => {
          if (isPlaying && currentMessageId === messageId) {
            console.log('🎵 Speech timeout reached, stopping');
            speechSynthesis.cancel();
            setIsPlaying(false);
            setCurrentMessageId(null);
            utteranceRef.current = null;
          }
        }, 60000); // 1 minute timeout

        // Start speaking
        console.log('🎵 Starting speech synthesis...');
        speechSynthesis.speak(utterance);
        
        // Verify speech started (some browsers need a nudge)
        setTimeout(() => {
          if (!speechSynthesis.speaking && !speechSynthesis.pending) {
            console.warn('🎵 Speech may not have started, retrying...');
            speechSynthesis.speak(utterance);
          }
        }, 100);
        
      }, 50);
      
    } catch (error) {
      console.error('🎵 Error creating speech utterance:', error);
      toast.error('Failed to start voice playback');
      setIsPlaying(false);
      setCurrentMessageId(null);
    }
  }, [isSupported, isInitialized, isPlaying, voiceSettings, currentMessageId]);

  // Stop current speech
  const stop = useCallback(() => {
    console.log('🎵 Stopping speech');
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentMessageId(null);
    utteranceRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Pause current speech
  const pause = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      console.log('🎵 Pausing speech');
      speechSynthesis.pause();
      setIsPlaying(false);
    }
  }, []);

  // Resume paused speech
  const resume = useCallback(() => {
    if (speechSynthesis.paused) {
      console.log('🎵 Resuming speech');
      speechSynthesis.resume();
      setIsPlaying(true);
    }
  }, []);

  // Update voice settings
  const updateVoiceSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    console.log('🎵 Updating voice settings:', newSettings);
    setVoiceSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Get available voice categories
  const getVoiceCategories = useCallback(() => {
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
    
    const categories = {
      female: englishVoices.filter(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('susan') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel')
      ),
      male: englishVoices.filter(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('man') ||
        voice.name.toLowerCase().includes('daniel') ||
        voice.name.toLowerCase().includes('alex') ||
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('mark')
      ),
      english: englishVoices,
      all: voices,
      premium: englishVoices.filter(voice => voice.localService)
    };

    return categories;
  }, [voices]);

  // Test voice with sample text
  const testVoice = useCallback(() => {
    const testText = "Hello! I'm your AI wellness companion. I'm here to support your mental health journey with personalized insights and encouragement.";
    speak(testText, 'voice-test');
  }, [speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isPlaying,
    currentMessageId,
    voices,
    isSupported,
    isInitialized,
    voiceSettings,
    
    // Actions
    speak,
    stop,
    pause,
    resume,
    updateVoiceSettings,
    initializeSpeech,
    testVoice,
    
    // Utilities
    getVoiceCategories
  };
};