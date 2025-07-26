import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Settings,
  Loader2,
  Brain,
  Waves,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface VideoCallAssistantProps {
  onMoodUpdate?: (sentiment: string, userMessage: string, aiResponse: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

const VideoCallAssistant: React.FC<VideoCallAssistantProps> = ({ onMoodUpdate }) => {
  // Call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // AI state
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Load saved conversation from localStorage
    try {
      const today = new Date().toDateString();
      const savedMessages = localStorage.getItem(`video_chat_messages_${today}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        return parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading saved video chat messages:', error);
      return [];
    }
  });
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      localStorage.setItem(`video_chat_messages_${today}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving video chat messages:', error);
    }
  }, [messages]);
  // Check browser support
  const checkBrowserSupport = useCallback(() => {
    const hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    
    if (!hasWebRTC) {
      setError('Your browser does not support video calls. Please use Chrome, Firefox, or Safari.');
      return false;
    }
    
    if (!hasSpeechRecognition) {
      setError('Your browser does not support speech recognition. Please use Chrome or Safari.');
      return false;
    }
    
    return true;
  }, []);

  // Initialize media stream
  const initializeMediaStream = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      console.log('Requesting media access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Media stream obtained:', stream);
      mediaStreamRef.current = stream;

      if (localVideoRef.current) {
        console.log('Setting video source...');
        localVideoRef.current.srcObject = stream;
        
        // Enhanced video setup
        localVideoRef.current.muted = true; // Prevent feedback
        localVideoRef.current.playsInline = true;
        localVideoRef.current.autoplay = true;
        
        // Force video to play and handle any errors
        try {
          await localVideoRef.current.play();
          console.log('Video playing successfully');
        } catch (playError) {
          console.warn('Video autoplay failed, trying manual play:', playError);
          // Try to play again after a short delay
          setTimeout(async () => {
            try {
              if (localVideoRef.current) {
                await localVideoRef.current.play();
                console.log('Manual video play successful');
              }
            } catch (retryError) {
              console.error('Manual video play also failed:', retryError);
            }
          }, 500);
        }
      }

      // Initialize audio context for better audio processing
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      return stream;
    } catch (err: any) {
      console.error('Error accessing media devices:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera and microphone access denied. Please allow permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please check your devices.');
      } else {
        setError('Failed to access camera and microphone. Please check your device settings.');
      }
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Start call
  const startCall = useCallback(async () => {
    if (!checkBrowserSupport()) return;

    try {
      await initializeMediaStream();
      setIsCallActive(true);
      
      // Add welcome message only if no previous conversation exists
      if (messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: 'Hello! I\'m your AI wellness companion. I can see and hear you now. How are you feeling today?',
          timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);
        
        // Start with AI speaking the welcome message
        await speakText(welcomeMessage.content);
      } else {
        // If continuing conversation, just say a brief reconnection message
        await speakText('Welcome back! I\'m ready to continue our conversation.');
      }
      
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  }, [checkBrowserSupport, initializeMediaStream, messages.length]);

  // End call
  const endCall = useCallback(() => {
    // Stop any current speech immediately
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    // Stop all media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Clear video element
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Stop speech recognition
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }

    // Reset states
    setIsCallActive(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    setCurrentTranscript('');
    setError(null);
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Speech recognition setup
  const setupSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setCurrentTranscript('');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setCurrentTranscript(finalTranscript + interimTranscript);

      // Process final transcript
      if (finalTranscript.trim()) {
        processUserSpeech(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        // Restart recognition after a brief pause
        setTimeout(() => {
          if (isCallActive && speechRecognitionRef.current) {
            recognition.start();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Restart recognition if call is still active
      if (isCallActive && !isProcessing) {
        setTimeout(() => {
          if (speechRecognitionRef.current) {
            recognition.start();
          }
        }, 500);
      }
    };

    return recognition;
  }, [isCallActive, isProcessing]);

  // Process user speech
  const processUserSpeech = useCallback(async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return;

    try {
      setIsProcessing(true);
      setCurrentTranscript('');

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: transcript,
        timestamp: new Date(),
        isVoice: true
      };

      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const aiResponse = await getAIResponse(transcript);
      
      if (aiResponse) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          isVoice: true
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Speak the AI response
        await speakText(aiResponse);

        // Update mood if callback provided
        if (onMoodUpdate) {
          // Simple sentiment analysis for mood update
          const sentiment = analyzeSentiment(transcript);
          onMoodUpdate(sentiment, transcript, aiResponse);
        }
      }
    } catch (error) {
      console.error('Error processing speech:', error);
      setError('Failed to process your message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onMoodUpdate]);

  // Get AI response using existing Dappier chat system
  const getAIResponse = useCallback(async (userMessage: string): Promise<string | null> => {
    try {
      // Use the existing Supabase chat function that connects to Dappier
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          message: userMessage,
          context: messages.slice(-5).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        },
      });

      if (error) {
        console.error('Dappier chat error:', error);
        throw error;
      }

      if (!data?.response) {
        throw new Error('No response from AI service');
      }

      // Extract the response content
      const responseContent = typeof data.response === 'string' 
        ? data.response 
        : data.response.message || data.response;

      return responseContent;
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback response
      return "I understand you're sharing something important with me. I'm here to listen and support you. Can you tell me more about how you're feeling?";
    }
  }, [messages]);

  // Text-to-Speech using Web Speech API (free browser-based)
  const speakText = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);

      // Clean text for better speech synthesis
      const cleanedText = text
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
        // Improve sentence flow for natural speech
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

      // Use browser's built-in Web Speech API (free)
      if ('speechSynthesis' in window) {
        // Cancel any existing speech
        speechSynthesis.cancel();
        
        // Small delay to ensure cancellation is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        // More natural speech settings
        utterance.rate = 0.85; // Slightly slower for more natural pace
        utterance.pitch = 1.0; // Natural pitch
        utterance.volume = 0.9; // Clear volume
        
        // Enhanced voice selection for more human-like speech
        const voices = speechSynthesis.getVoices();
        
        // Priority order for most natural voices
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
        
        let preferredVoice = null;
        for (const preference of voicePreferences) {
          preferredVoice = voices.find(preference);
          if (preferredVoice) break;
        }
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log('Using voice:', preferredVoice.name);
        }
        
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsSpeaking(false);
        };
        
        utterance.onstart = () => {
          setIsSpeaking(true);
        };
        
        speechSynthesis.speak(utterance);
        
        // Store reference for potential cancellation
        currentAudioRef.current = { 
          pause: () => speechSynthesis.cancel(),
          currentTime: 0
        } as HTMLAudioElement;
      } else {
        throw new Error('Speech synthesis not supported');
      }
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsSpeaking(false);
      setError('Speech synthesis failed. Please check your browser settings.');
    }
  }, []);

  // Simple sentiment analysis
  const analyzeSentiment = useCallback((text: string): string => {
    const positiveWords = ['happy', 'good', 'great', 'wonderful', 'amazing', 'love', 'joy', 'excited', 'grateful'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'depressed', 'anxious'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'POSITIVE';
    if (negativeCount > positiveCount) return 'NEGATIVE';
    return 'NEUTRAL';
  }, []);

  // Start speech recognition when call becomes active
  useEffect(() => {
    if (isCallActive && !isProcessing && !isSpeaking) {
      const recognition = setupSpeechRecognition();
      if (recognition) {
        speechRecognitionRef.current = recognition;
        recognition.start();
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
    };
  }, [isCallActive, isProcessing, isSpeaking, setupSpeechRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  if (!isCallActive) {
    return (
      <div className="space-y-6">
        {/* Video Call Start Interface */}
        <Card className="text-center">
          <div className="space-y-6 p-8">
            <div className="flex justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center shadow-lg"
              >
                <Brain className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Video Assistant</h2>
              <p className="text-gray-600 mb-6">
                Start a video call with your AI wellness companion for a more personal conversation experience.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle size={20} />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <div className="space-y-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={startCall}
                  isLoading={isConnecting}
                  leftIcon={<Video size={20} />}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-8 py-4"
                >
                  {isConnecting ? 'Connecting...' : messages.length > 0 ? 'Resume Video Call' : 'Start Video Call'}
                </Button>
                
                <div className="text-xs text-gray-500 space-y-1 text-center">
                  <p>• Make sure your camera and microphone are connected</p>
                  <p>• Allow browser permissions when prompted</p>
                  <p>• Speak naturally - the AI will respond with voice</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Previous Conversation */}
        {messages.length > 0 && (
          <Card>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                Previous Video Conversation
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        {message.isVoice && (
                          <div className="flex items-center text-xs opacity-75">
                            <Waves size={12} className="mr-1" />
                            <span>Voice message</span>
                          </div>
                        )}
                        <span className="text-xs opacity-75">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date().toDateString();
                    localStorage.removeItem(`video_chat_messages_${today}`);
                    setMessages([]);
                  }}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Clear Conversation
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Call Interface */}
      <Card className="overflow-hidden">
        <div className="relative bg-gray-900 aspect-video">
          {/* Local Video */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
            style={{ transform: 'scaleX(-1)' }}
            onLoadedMetadata={() => {
              console.log('Video metadata loaded');
              if (localVideoRef.current) {
                localVideoRef.current.play().catch(console.error);
              }
            }}
            onCanPlay={() => {
              console.log('Video can play');
            }}
            onError={(e) => {
              console.error('Video error:', e);
            }}
          />
          
          {/* Video disabled overlay */}
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Camera is off</p>
              </div>
            </div>
          )}

          {/* AI Status Overlay */}
          <div className="absolute top-4 left-4 space-y-2">
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2"
              >
                <Mic size={16} />
                <span>Listening...</span>
              </motion.div>
            )}
            
            {isProcessing && (
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            
            {isSpeaking && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2"
              >
                <Waves size={16} />
                <span>Speaking...</span>
              </motion.div>
            )}
          </div>

          {/* AI Avatar/Animation */}
          <div className="absolute top-4 right-4">
            <motion.div
              animate={{ 
                scale: isSpeaking ? [1, 1.2, 1] : 1,
                opacity: isSpeaking ? [0.8, 1, 0.8] : 0.9
              }}
              transition={{ 
                duration: isSpeaking ? 0.5 : 0,
                repeat: isSpeaking ? Infinity : 0
              }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center shadow-lg"
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
          </div>

          {/* Current Transcript */}
          {currentTranscript && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/70 text-white p-3 rounded-lg">
                <p className="text-sm">{currentTranscript}</p>
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-black/50 rounded-full p-2">
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  isVideoEnabled 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  isAudioEnabled 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              
              <button
                onClick={endCall}
                className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <PhoneOff size={20} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Chat Messages */}
      {messages.length > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Conversation</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.isVoice && (
                      <div className="flex items-center mt-1 text-xs opacity-75">
                        <Waves size={12} className="mr-1" />
                        <span>Voice message</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="p-4 flex items-center space-x-2 text-red-800">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VideoCallAssistant;