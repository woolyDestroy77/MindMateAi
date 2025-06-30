import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
  autoPlay: boolean;
  voiceName?: string; // Store voice name for persistence
  voiceLang?: string; // Store voice language for persistence
}

const VOICE_SETTINGS_KEY = 'puremind_voice_settings';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    // Load saved settings from localStorage
    try {
      const saved = localStorage.getItem(VOICE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🎵 Loaded saved voice settings:', parsed);
        return {
          rate: parsed.rate || 0.9,
          pitch: parsed.pitch || 1.0,
          volume: parsed.volume || 0.8,
          voice: null, // Will be set when voices are loaded
          autoPlay: parsed.autoPlay || false,
          voiceName: parsed.voiceName,
          voiceLang: parsed.voiceLang
        };
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
    }
    
    // Default settings
    return {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      voice: null,
      autoPlay: false
    };
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save settings to localStorage whenever they change
  const saveVoiceSettings = useCallback((settings: VoiceSettings) => {
    try {
      const settingsToSave = {
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume,
        autoPlay: settings.autoPlay,
        voiceName: settings.voice?.name,
        voiceLang: settings.voice?.lang
      };
      localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settingsToSave));
      console.log('🎵 Voice settings saved:', settingsToSave);
    } catch (error) {
      console.error('Error saving voice settings:', error);
    }
  }, []);

  // Enhanced text cleaning function to remove emojis and improve speech
  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      // Remove all emojis (comprehensive emoji regex)
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Remove other Unicode symbols and pictographs
      .replace(/[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{2B50}]|[\u{2B55}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, '')
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/#{1,6}\s/g, '') // Remove heading markdown
      .replace(/[-•*]\s/g, '') // Remove bullet points
      .replace(/\d+\.\s/g, '') // Remove numbered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
      // Improve sentence flow
      .replace(/\n+/g, '. ') // Replace line breaks with pauses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Add pauses between sentences
      // Remove common text artifacts
      .replace(/\s*\.\s*\.\s*\./g, '.') // Remove multiple dots
      .replace(/\s*,\s*,/g, ',') // Remove multiple commas
      .replace(/\s*;\s*;/g, ';') // Remove multiple semicolons
      // Clean up extra spaces and punctuation
      .replace(/\s+([.!?,:;])/g, '$1') // Remove spaces before punctuation
      .replace(/([.!?])\s*([.!?])/g, '$1') // Remove duplicate punctuation
      .trim();
  }, []);

  // Enhanced initialization with better browser support detection
  const initializeSpeech = useCallback(() => {
    console.log('🎵 Initializing speech synthesis...');
    
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      setIsSupported(false);
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
      
      // Restore saved voice or set default voice
      if (availableVoices.length > 0) {
        let selectedVoice = null;

        // Try to restore previously saved voice
        if (voiceSettings.voiceName && voiceSettings.voiceLang) {
          selectedVoice = availableVoices.find(v => 
            v.name === voiceSettings.voiceName && v.lang === voiceSettings.voiceLang
          );
          
          if (selectedVoice) {
            console.log('🎵 Restored saved voice:', selectedVoice.name);
          } else {
            console.log('🎵 Saved voice not found, selecting default');
          }
        }

        // If no saved voice or saved voice not found, select default
        if (!selectedVoice) {
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

          for (const preference of voicePreferences) {
            selectedVoice = availableVoices.find(preference);
            if (selectedVoice) break;
          }

          if (selectedVoice) {
            console.log('🎵 Selected default voice:', selectedVoice.name);
          }
        }

        if (selectedVoice) {
          const newSettings = { 
            ...voiceSettings, 
            voice: selectedVoice,
            voiceName: selectedVoice.name,
            voiceLang: selectedVoice.lang
          };
          setVoiceSettings(newSettings);
          saveVoiceSettings(newSettings);
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
  }, [voiceSettings, isInitialized, saveVoiceSettings]);

  // Initialize on mount
  useEffect(() => {
    initializeSpeech();
  }, [initializeSpeech]);

  // Enhanced speak function with better error handling and emoji filtering
  const speak = useCallback((text: string, messageId: string) => {
    console.log('🎵 Attempting to speak:', { messageId, textLength: text.length, isSupported, isInitialized });

    if (!isSupported) {
      return;
    }

    if (!isInitialized) {
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

    // Enhanced text cleaning with emoji removal
    const cleanText = cleanTextForSpeech(text);

    if (!cleanText || cleanText.length < 2) {
      return;
    }

    // Limit text length to prevent very long speech
    const maxLength = 1000;
    const finalText = cleanText.length > maxLength 
      ? cleanText.substring(0, maxLength) + '...' 
      : cleanText;

    console.log('🎵 Original text:', text);
    console.log('🎵 Cleaned text:', finalText);

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
      setIsPlaying(false);
      setCurrentMessageId(null);
    }
  }, [isSupported, isInitialized, isPlaying, voiceSettings, currentMessageId, cleanTextForSpeech]);

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

  // Stop all audio (alias for stop for clarity)
  const stopAudio = useCallback(() => {
    console.log('🔇 Stopping all audio');
    stop();
    toast.success('Audio stopped', { duration: 1500 });
  }, [stop]);

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

  // Update voice settings with persistence
  const updateVoiceSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    console.log('🎵 Updating voice settings:', newSettings);
    const updatedSettings = { ...voiceSettings, ...newSettings };
    
    // If voice is being updated, also update the name and lang for persistence
    if (newSettings.voice) {
      updatedSettings.voiceName = newSettings.voice.name;
      updatedSettings.voiceLang = newSettings.voice.lang;
    }
    
    setVoiceSettings(updatedSettings);
    saveVoiceSettings(updatedSettings);
    
    // Show confirmation toast
    if (Object.keys(newSettings).length > 0) {
      toast.success('Voice settings saved', { 
        duration: 2000,
        icon: '🎵'
      });
    }
  }, [voiceSettings, saveVoiceSettings]);

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

  // Test voice with sample text (emoji-free)
  const testVoice = useCallback(() => {
    const testText = "Hello! I'm your AI wellness companion. I'm here to support your mental health journey with personalized insights and encouragement.";
    speak(testText, 'voice-test');
  }, [speak]);

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    const defaultSettings: VoiceSettings = {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      voice: null,
      autoPlay: false
    };
    
    setVoiceSettings(defaultSettings);
    saveVoiceSettings(defaultSettings);
    
    // Clear saved settings
    try {
      localStorage.removeItem(VOICE_SETTINGS_KEY);
      toast.success('Voice settings reset to defaults', { 
        duration: 2000,
        icon: '🔄'
      });
    } catch (error) {
      console.error('Error clearing voice settings:', error);
    }
    
    // Re-initialize to set default voice
    setTimeout(() => {
      initializeSpeech();
    }, 100);
  }, [saveVoiceSettings, initializeSpeech]);

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
    stopAudio, // New dedicated stop audio function
    pause,
    resume,
    updateVoiceSettings,
    initializeSpeech,
    testVoice,
    resetSettings, // New reset function
    
    // Utilities
    getVoiceCategories,
    cleanTextForSpeech // Expose for testing
  };
};