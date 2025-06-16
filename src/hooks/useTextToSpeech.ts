import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
}

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8,
    voice: null
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis
  const initializeSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // Load available voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Set default voice (prefer English voices)
        if (availableVoices.length > 0 && !voiceSettings.voice) {
          const englishVoice = availableVoices.find(voice => 
            voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
          ) || availableVoices.find(voice => 
            voice.lang.startsWith('en')
          ) || availableVoices[0];
          
          setVoiceSettings(prev => ({ ...prev, voice: englishVoice }));
        }
      };

      loadVoices();
      
      // Some browsers load voices asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    } else {
      setIsSupported(false);
      console.warn('Speech synthesis not supported in this browser');
    }
  }, [voiceSettings.voice]);

  // Speak text with AI voice
  const speak = useCallback((text: string, messageId: string) => {
    if (!isSupported) {
      toast.error('Voice playback is not supported in your browser');
      return;
    }

    // Stop any current speech
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentMessageId(null);
    }

    // Clean text for better speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/#{1,6}\s/g, '') // Remove heading markdown
      .replace(/[-•*]\s/g, '') // Remove bullet points
      .replace(/\d+\.\s/g, '') // Remove numbered lists
      .replace(/\n+/g, '. ') // Replace line breaks with pauses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleanText) {
      toast.error('No text to speak');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;

      // Apply voice settings
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      
      if (voiceSettings.voice) {
        utterance.voice = voiceSettings.voice;
      }

      // Event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentMessageId(messageId);
        console.log('🎵 Started speaking message:', messageId);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentMessageId(null);
        utteranceRef.current = null;
        console.log('🎵 Finished speaking message:', messageId);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        setCurrentMessageId(null);
        utteranceRef.current = null;
        toast.error('Voice playback failed');
      };

      utterance.onpause = () => {
        setIsPlaying(false);
      };

      utterance.onresume = () => {
        setIsPlaying(true);
      };

      // Start speaking
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Error creating speech utterance:', error);
      toast.error('Failed to start voice playback');
    }
  }, [isSupported, isPlaying, voiceSettings]);

  // Stop current speech
  const stop = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentMessageId(null);
    utteranceRef.current = null;
  }, []);

  // Pause current speech
  const pause = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPlaying(false);
    }
  }, []);

  // Resume paused speech
  const resume = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPlaying(true);
    }
  }, []);

  // Update voice settings
  const updateVoiceSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setVoiceSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Get available voice categories
  const getVoiceCategories = useCallback(() => {
    const categories = {
      female: voices.filter(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('susan')
      ),
      male: voices.filter(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('man') ||
        voice.name.toLowerCase().includes('daniel') ||
        voice.name.toLowerCase().includes('alex') ||
        voice.name.toLowerCase().includes('tom')
      ),
      english: voices.filter(voice => voice.lang.startsWith('en')),
      all: voices
    };

    return categories;
  }, [voices]);

  return {
    // State
    isPlaying,
    currentMessageId,
    voices,
    isSupported,
    voiceSettings,
    
    // Actions
    speak,
    stop,
    pause,
    resume,
    updateVoiceSettings,
    initializeSpeech,
    
    // Utilities
    getVoiceCategories
  };
};