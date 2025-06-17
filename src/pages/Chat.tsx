import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  Loader2,
  Bot,
  User,
  Volume2,
  X,
  Play,
  Pause,
  TrendingUp,
  Zap,
  Calendar,
  Activity,
  Heart,
  Clock,
  Trash2,
  MoreVertical,
  AlertTriangle,
  MessageCircle,
  Sparkles,
  Download,
  VolumeX,
  Settings,
  Brain
} from "lucide-react";
import { format, isToday, startOfDay, differenceInHours } from "date-fns";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import { useAIChat } from "../hooks/useAIChat";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { useDashboardData } from "../hooks/useDashboardData";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import VoiceSettingsModal from "../components/chat/VoiceSettingsModal";

const Chat = () => {
  const { dashboardData, updateMoodFromAI } = useDashboardData();
  
  // Use a fixed session ID for the single daily chat
  const DAILY_CHAT_SESSION = "daily-health-chat";
  
  const { messages, isLoading, sendMessage, sendVoiceMessage, deleteChatHistory } = useAIChat(
    DAILY_CHAT_SESSION,
    updateMoodFromAI
  );
  
  const { 
    isRecording, 
    transcript, 
    error: voiceError,
    isProcessing,
    audioUrl,
    recordingDuration,
    startRecording, 
    stopRecording,
    clearRecording,
    formatDuration
  } = useVoiceInput();

  const {
    speak,
    stop,
    isPlaying,
    currentMessageId,
    voiceSettings,
    updateVoiceSettings,
    voices,
    testVoice,
    resetSettings
  } = useTextToSpeech();

  const [inputMessage, setInputMessage] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const [audioDurations, setAudioDurations] = useState<{ [key: string]: number }>({});
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const welcomeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-play AI responses if enabled
  useEffect(() => {
    if (voiceSettings.autoPlay && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.id !== currentMessageId) {
        speak(lastMessage.content, lastMessage.id);
      }
    }
  }, [messages, voiceSettings.autoPlay, speak, currentMessageId]);

  // Show welcome message for new day or first visit with proper auto-hide
  useEffect(() => {
    // Clear any existing timer
    if (welcomeTimerRef.current) {
      clearTimeout(welcomeTimerRef.current);
      welcomeTimerRef.current = null;
    }

    if (messages.length === 0) {
      setShowWelcomeMessage(true);
      // Set timer to hide welcome message after 3 seconds (shorter)
      welcomeTimerRef.current = setTimeout(() => {
        setShowWelcomeMessage(false);
        welcomeTimerRef.current = null;
      }, 3000);
    } else {
      // If there are messages, hide welcome message immediately
      setShowWelcomeMessage(false);
    }

    // Cleanup function
    return () => {
      if (welcomeTimerRef.current) {
        clearTimeout(welcomeTimerRef.current);
        welcomeTimerRef.current = null;
      }
    };
  }, [messages.length]);

  // Calculate time since last message for daily check-in prompts
  const getTimeSinceLastMessage = () => {
    if (messages.length === 0) return null;
    const lastMessage = messages[messages.length - 1];
    const hoursSince = differenceInHours(new Date(), lastMessage.timestamp);
    return hoursSince;
  };

  const shouldShowDailyPrompt = () => {
    const hoursSince = getTimeSinceLastMessage();
    return hoursSince !== null && hoursSince >= 24;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const messageToSend = inputMessage.trim();
    setInputMessage("");

    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      stopRecording(recognition);
      setRecognition(null);
    } else {
      setShowVoiceModal(true);
      const newRecognition = await startRecording();
      setRecognition(newRecognition);
    }
  };

  const handleVoiceModalClose = () => {
    if (isRecording) {
      stopRecording(recognition);
      setRecognition(null);
    }
    setShowVoiceModal(false);
    clearRecording();
  };

  const handleSendVoiceMessage = async () => {
    if (transcript.trim() && audioUrl) {
      try {
        await sendVoiceMessage(audioUrl, transcript, recordingDuration);
        setShowVoiceModal(false);
        clearRecording();
        toast.success('Voice message sent and mood analyzed!');
      } catch (error) {
        console.error("Failed to send voice message:", error);
      }
    }
  };

  const handleDeleteChatHistory = async () => {
    try {
      await deleteChatHistory();
      setShowDeleteConfirm(false);
      setShowOptionsMenu(false);
    } catch (error) {
      console.error("Failed to delete chat history:", error);
    }
  };

  // Enhanced audio playback with progress tracking
  const handlePlayAudio = (messageId: string, audioUrl: string) => {
    console.log('🎵 Playing audio for message:', messageId, 'URL:', audioUrl);
    
    // Stop all other audio first
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (id !== messageId && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        setAudioProgress(prev => ({ ...prev, [id]: 0 }));
      }
    });

    // If this audio is already playing, pause it
    if (playingAudio === messageId) {
      const audio = audioRefs.current[messageId];
      if (audio) {
        audio.pause();
        setPlayingAudio(null);
      }
      return;
    }

    // Create or get audio element
    if (!audioRefs.current[messageId]) {
      const audio = new Audio(audioUrl);
      audio.volume = isMuted ? 0 : audioVolume;
      audio.preload = 'metadata';
      
      // Set up event listeners
      audio.onloadedmetadata = () => {
        console.log('Audio metadata loaded, duration:', audio.duration);
        setAudioDurations(prev => ({ ...prev, [messageId]: audio.duration }));
      };

      audio.ontimeupdate = () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(prev => ({ ...prev, [messageId]: progress }));
      };

      audio.onended = () => {
        console.log('Audio playback ended for message:', messageId);
        setPlayingAudio(null);
        setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
      };

      audio.onerror = (e) => {
        console.error('Audio playback error for message:', messageId, e);
        toast.error('Failed to play voice message');
        setPlayingAudio(null);
      };

      audio.oncanplay = () => {
        console.log('Audio can play for message:', messageId);
      };

      audioRefs.current[messageId] = audio;
    }

    const audio = audioRefs.current[messageId];
    
    // Update volume
    audio.volume = isMuted ? 0 : audioVolume;
    
    // Play audio
    audio.play()
      .then(() => {
        console.log('Audio playback started successfully for message:', messageId);
        setPlayingAudio(messageId);
      })
      .catch((error) => {
        console.error('Failed to play audio for message:', messageId, error);
        toast.error('Failed to play voice message. The audio file may be corrupted or unavailable.');
        setPlayingAudio(null);
      });
  };

  // Handle audio progress click (seek)
  const handleProgressClick = (messageId: string, event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRefs.current[messageId];
    if (!audio || !audioDurations[messageId]) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioDurations[messageId];
    
    audio.currentTime = newTime;
    setAudioProgress(prev => ({ ...prev, [messageId]: percentage * 100 }));
  };

  // Download audio file
  const handleDownloadAudio = (audioUrl: string, messageId: string) => {
    try {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `voice-message-${messageId}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Voice message download started');
    } catch (error) {
      console.error('Failed to download audio:', error);
      toast.error('Failed to download voice message');
    }
  };

  // Volume control
  const handleVolumeChange = (newVolume: number) => {
    setAudioVolume(newVolume);
    Object.values(audioRefs.current).forEach(audio => {
      audio.volume = isMuted ? 0 : newVolume;
    });
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    Object.values(audioRefs.current).forEach(audio => {
      audio.volume = newMuted ? 0 : audioVolume;
    });
  };

  const handlePlayMessage = (message: any) => {
    if (isPlaying && currentMessageId === message.id) {
      stop();
    } else {
      speak(message.content, message.id);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTodaysMessageCount = () => {
    return messages.filter(msg => 
      msg.role === "user" && isToday(msg.timestamp)
    ).length;
  };

  const getWellnessInsight = () => {
    const todayCount = getTodaysMessageCount();
    const hoursSince = getTimeSinceLastMessage();
    
    if (todayCount === 0) {
      return "Start your daily wellness journey! Share how you're feeling today.";
    } else if (hoursSince && hoursSince >= 24) {
      return "It's been a while! How has your mood been since yesterday?";
    } else if (todayCount >= 3) {
      return "Great job staying connected with your emotions today!";
    } else {
      return "Keep tracking your emotional wellness throughout the day.";
    }
  };

  const handleCloseWelcomeMessage = () => {
    setShowWelcomeMessage(false);
    if (welcomeTimerRef.current) {
      clearTimeout(welcomeTimerRef.current);
      welcomeTimerRef.current = null;
    }
  };

  // Quick mood prompts for easy interaction
  const moodPrompts = [
    { emoji: "😊", text: "I'm feeling happy today!", mood: "happy" },
    { emoji: "😌", text: "I'm feeling calm and peaceful", mood: "calm" },
    { emoji: "😐", text: "I'm feeling okay, nothing special", mood: "neutral" },
    { emoji: "😕", text: "I'm feeling a bit down today", mood: "sad" },
    { emoji: "😰", text: "I'm feeling anxious or worried", mood: "anxious" },
    { emoji: "😠", text: "I'm feeling frustrated or angry", mood: "angry" },
  ];

  const handleQuickMoodResponse = async (prompt: { emoji: string; text: string; mood: string }) => {
    try {
      await sendMessage(prompt.text);
    } catch (error) {
      console.error("Failed to send mood prompt:", error);
    }
  };

  // Helper function to format AI responses with bullet points
  const formatAIResponse = (content: string) => {
    // Split content into lines and identify bullet points
    const lines = content.split('\n').filter(line => line.trim());
    const formattedLines: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if line starts with bullet point indicators
      if (trimmedLine.match(/^[-•*]\s/) || trimmedLine.match(/^\d+\.\s/)) {
        // This is a bullet point
        const bulletContent = trimmedLine.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '');
        formattedLines.push(
          <div key={index} className="flex items-start space-x-3 my-2">
            <div className="flex-shrink-0 w-2 h-2 bg-sage-500 rounded-full mt-2"></div>
            <span className="text-sm leading-relaxed">{bulletContent}</span>
          </div>
        );
      } else {
        // Regular text
        formattedLines.push(
          <p key={index} className="text-sm leading-relaxed mb-2">
            {trimmedLine}
          </p>
        );
      }
    });
    
    return <div className="space-y-1">{formattedLines}</div>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-sage-50">
      <Navbar />

      {/* Welcome Message for New Day */}
      <AnimatePresence>
        {showWelcomeMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-2 right-2 md:top-20 md:left-1/2 md:transform md:-translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-lavender-100 to-sage-100 border border-lavender-300 rounded-xl px-4 py-3 shadow-lg max-w-lg mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-lavender-800 flex-1">
                  <Heart size={20} className="flex-shrink-0 text-lavender-600" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">Welcome to Your Daily Wellness Chat</div>
                    <div className="text-xs text-lavender-700 mt-1">
                      Share your feelings and thoughts to track your mental wellness journey automatically!
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCloseWelcomeMessage}
                  className="ml-2 text-lavender-600 hover:text-lavender-800 transition-colors flex-shrink-0"
                  aria-label="Close welcome message"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex flex-col h-screen pt-16">
        {/* Enhanced Header with Daily Stats */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-lavender-600 to-sage-600 bg-clip-text text-transparent">
                  Daily Wellness Chat
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(), "EEEE, MMMM d, yyyy")} • Continuous Health Tracking
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Today's Check-ins */}
                <div className="flex items-center space-x-2 bg-lavender-50 px-3 py-2 rounded-lg">
                  <Calendar size={16} className="text-lavender-600" />
                  <span className="text-sm font-medium text-lavender-800">
                    {getTodaysMessageCount()} check-ins today
                  </span>
                </div>
                
                {/* Current Mood */}
                <div className="flex items-center space-x-2 bg-sage-50 px-3 py-2 rounded-lg">
                  <span className="text-lg">{dashboardData.currentMood}</span>
                  <span className="text-sm font-medium text-sage-800 capitalize">
                    {dashboardData.moodName}
                  </span>
                </div>

                {/* Options Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>

                  <AnimatePresence>
                    {showOptionsMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[180px]"
                      >
                        <button
                          onClick={() => {
                            setShowVoiceSettings(true);
                            setShowOptionsMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                        >
                          <Settings size={14} className="mr-2" />
                          Voice Settings
                        </button>
                        <Link
                          to="/anxiety-support"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                          onClick={() => setShowOptionsMenu(false)}
                        >
                          <Brain size={14} className="mr-2" />
                          Anxiety Support
                        </Link>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(true);
                            setShowOptionsMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Clear Chat History
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            
            {/* Wellness Insight */}
            <div className="mt-3 p-3 bg-gradient-to-r from-lavender-50 to-sage-50 rounded-lg border border-lavender-200">
              <div className="flex items-center space-x-2">
                <Activity size={16} className="text-lavender-600" />
                <span className="text-sm text-gray-700">{getWellnessInsight()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Daily Prompt if needed */}
            {shouldShowDailyPrompt() && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center space-x-3">
                  <Clock size={20} className="text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Daily Check-in Time!</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      It's been 24+ hours since your last message. How are you feeling today? Share your current mood and any thoughts on your mind.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mood Prompt Section for Empty Chat */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
                  <div className="text-4xl mb-4">🌟</div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Tell Us Your Mood
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Start your wellness journey by sharing how you're feeling right now. 
                    Your mood will be automatically tracked and analyzed to provide personalized insights.
                  </p>
                  
                  {/* Quick Mood Selection */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center justify-center">
                      <MessageCircle size={16} className="mr-2 text-lavender-500" />
                      Quick Mood Check-in
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {moodPrompts.map((prompt, index) => (
                        <motion.button
                          key={prompt.mood}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleQuickMoodResponse(prompt)}
                          disabled={isLoading}
                          className="flex items-center space-x-3 p-3 bg-gradient-to-r from-lavender-50 to-sage-50 hover:from-lavender-100 hover:to-sage-100 border border-lavender-200 rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-left"
                        >
                          <span className="text-2xl">{prompt.emoji}</span>
                          <span className="text-sm text-gray-700 flex-1">{prompt.text}</span>
                          <Sparkles size={14} className="text-lavender-500 opacity-60" />
                        </motion.button>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-3">
                        Or type your own message below to share more details about your current state
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-lavender-50 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-lavender-600 mx-auto mb-2" />
                          <div className="text-sm font-medium text-lavender-800">Mood Tracking</div>
                          <div className="text-xs text-lavender-600">Automatic analysis</div>
                        </div>
                        <div className="text-center p-3 bg-sage-50 rounded-lg">
                          <Heart className="w-6 h-6 text-sage-600 mx-auto mb-2" />
                          <div className="text-sm font-medium text-sage-800">Wellness Insights</div>
                          <div className="text-xs text-sage-600">Personalized tips</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <div className="text-sm font-medium text-blue-800">Daily Progress</div>
                          <div className="text-xs text-blue-600">Continuous support</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence>
              {messages.map((message, index) => {
                const isNewDay = index === 0 || !isToday(messages[index - 1]?.timestamp);
                
                return (
                  <React.Fragment key={message.id}>
                    {/* Day separator */}
                    {isNewDay && index > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-4"
                      >
                        <div className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600">
                          {format(message.timestamp, "EEEE, MMMM d")}
                        </div>
                      </motion.div>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[85%] md:max-w-[75%] ${
                          message.role === "user"
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`flex-shrink-0 ${
                            message.role === "user" ? "ml-3" : "mr-3"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === "user"
                                ? "bg-gradient-to-br from-lavender-100 to-lavender-200 text-lavender-700"
                                : "bg-gradient-to-br from-sage-100 to-sage-200 text-sage-700"
                            }`}
                          >
                            {message.role === "user" ? (
                              <User size={16} />
                            ) : (
                              <Bot size={16} />
                            )}
                          </div>
                        </div>

                        {/* Message Content */}
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.role === "user"
                              ? "bg-gradient-to-br from-lavender-500 to-lavender-600 text-white"
                              : "bg-white border border-gray-200 shadow-sm"
                          }`}
                        >
                          {message.isVoiceMessage ? (
                            // Enhanced Voice Message UI with full controls
                            <div className="space-y-3">
                              {/* Voice message header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Volume2 size={16} className={`${message.role === "user" ? "text-white" : "text-gray-500"}`} />
                                  <span className={`text-sm font-medium ${message.role === "user" ? "text-white" : "text-gray-700"}`}>
                                    Voice Message
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {message.audioUrl && (
                                    <button
                                      onClick={() => handleDownloadAudio(message.audioUrl!, message.id)}
                                      className={`p-1 rounded transition-colors ${
                                        message.role === "user"
                                          ? "hover:bg-lavender-400 text-white"
                                          : "hover:bg-gray-100 text-gray-500"
                                      }`}
                                      title="Download voice message"
                                    >
                                      <Download size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Audio controls */}
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handlePlayAudio(message.id, message.audioUrl!)}
                                  disabled={!message.audioUrl}
                                  className={`p-2 rounded-full transition-colors ${
                                    message.role === "user"
                                      ? "bg-lavender-400 hover:bg-lavender-300 text-white"
                                      : "bg-sage-100 hover:bg-sage-200 text-sage-600"
                                  } ${!message.audioUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {playingAudio === message.id ? (
                                    <Pause size={16} />
                                  ) : (
                                    <Play size={16} />
                                  )}
                                </button>

                                {/* Progress bar */}
                                <div className="flex-1 space-y-1">
                                  <div 
                                    className={`h-2 rounded-full cursor-pointer ${
                                      message.role === "user" ? "bg-lavender-300" : "bg-gray-200"
                                    }`}
                                    onClick={(e) => handleProgressClick(message.id, e)}
                                  >
                                    <div
                                      className={`h-full rounded-full transition-all duration-150 ${
                                        message.role === "user" ? "bg-white" : "bg-sage-500"
                                      }`}
                                      style={{ width: `${audioProgress[message.id] || 0}%` }}
                                    />
                                  </div>
                                  
                                  {/* Time display */}
                                  <div className="flex justify-between text-xs">
                                    <span className={message.role === "user" ? "text-white/80" : "text-gray-500"}>
                                      {playingAudio === message.id && audioRefs.current[message.id] 
                                        ? formatDuration(Math.floor(audioRefs.current[message.id].currentTime))
                                        : "0:00"
                                      }
                                    </span>
                                    <span className={message.role === "user" ? "text-white/80" : "text-gray-500"}>
                                      {formatDuration(audioDurations[message.id] || message.audioDuration || 0)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Transcript (if available) */}
                              {message.content && (
                                <div className={`text-sm p-2 rounded ${
                                  message.role === "user" 
                                    ? "bg-lavender-400/30 text-white/90" 
                                    : "bg-gray-50 text-gray-700"
                                }`}>
                                  <div className="text-xs opacity-75 mb-1">Transcript:</div>
                                  <div className="italic">"{message.content}"</div>
                                </div>
                              )}

                              {/* Audio status indicator */}
                              {!message.audioUrl && (
                                <div className={`text-xs italic ${
                                  message.role === "user" ? "text-white/70" : "text-gray-500"
                                }`}>
                                  Audio unavailable
                                </div>
                              )}
                            </div>
                          ) : (
                            // Regular Text Message with Enhanced Formatting
                            <div
                              className={`${
                                message.role === "user"
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {message.role === "assistant" ? (
                                <div className="relative">
                                  {formatAIResponse(message.content)}
                                  {/* Play button for text-to-speech */}
                                  <button
                                    onClick={() => handlePlayMessage(message)}
                                    className="absolute top-0 right-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                    title={isPlaying && currentMessageId === message.id ? "Stop" : "Play"}
                                  >
                                    {isPlaying && currentMessageId === message.id ? (
                                      <Pause size={16} className="text-gray-700" />
                                    ) : (
                                      <Play size={16} className="text-gray-700" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                              )}
                            </div>
                          )}
                          
                          <div
                            className={`flex items-center justify-between mt-3 text-xs ${
                              message.role === "user"
                                ? "text-white/80"
                                : "text-gray-500"
                            }`}
                          >
                            <span>{format(message.timestamp, "h:mm a")}</span>
                            {message.sentiment && message.role === "user" && (
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`capitalize ${
                                    message.role === "user"
                                      ? "text-white/80"
                                      : getSentimentColor(message.sentiment)
                                  }`}
                                >
                                  {message.sentiment.toLowerCase()}
                                </span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full" title="Mood tracked">
                                  📊
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage-100 to-sage-200 text-sage-700 flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-sage-600" />
                      <span className="text-sm text-gray-900">
                        Analyzing your wellness...
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced Input Area */}
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Volume Control (when voice messages are present) */}
            {messages.some(m => m.isVoiceMessage) && (
              <div className="flex items-center justify-center space-x-4 mb-3 p-2 bg-gray-50 rounded-lg">
                <button
                  onClick={toggleMute}
                  className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : audioVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500 w-8">
                  {Math.round((isMuted ? 0 : audioVolume) * 100)}%
                </span>
              </div>
            )}

            <form
              onSubmit={handleSendMessage}
              className="flex items-end space-x-3"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={messages.length === 0 
                    ? "How are you feeling right now? Share your current mood and thoughts..." 
                    : "How are you feeling today? Share your thoughts, emotions, or any wellness updates..."
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none min-h-[48px] max-h-32 bg-white/80 backdrop-blur-sm"
                  rows={1}
                  disabled={isLoading}
                  style={{ 
                    height: 'auto',
                    minHeight: '48px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
              </div>

              <Button
                type="button"
                variant={isRecording ? "primary" : "outline"}
                size="md"
                onClick={handleVoiceToggle}
                className={`px-3 flex-shrink-0 rounded-xl ${isRecording ? 'animate-pulse' : ''}`}
                disabled={isLoading || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : isRecording ? (
                  <MicOff size={20} />
                ) : (
                  <Mic size={20} />
                )}
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputMessage.trim() || isLoading}
                leftIcon={
                  isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
                  )
                }
                className="flex-shrink-0 rounded-xl bg-gradient-to-r from-lavender-500 to-sage-500 hover:from-lavender-600 hover:to-sage-600"
              >
                <span className="hidden sm:inline">
                  {isLoading ? "Analyzing..." : messages.length === 0 ? "Share Mood" : "Send & Track"}
                </span>
                <span className="sm:hidden">
                  {isLoading ? "..." : "Send"}
                </span>
              </Button>
            </form>
            
            <div className="mt-3 text-center">
              <div className="inline-flex items-center space-x-4 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                <div className="flex items-center space-x-1">
                  <TrendingUp size={12} className="text-lavender-500" />
                  <span>Auto mood tracking</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart size={12} className="text-red-500" />
                  <span>Wellness insights</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap size={12} className="text-blue-500" />
                  <span>Daily progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Clear Chat History?
                </h3>
                
                <p className="text-sm text-gray-600 mb-6">
                  This will permanently delete all your chat messages and conversation history. 
                  Your mood data and wellness scores will be preserved. This action cannot be undone.
                </p>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleDeleteChatHistory}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    leftIcon={<Trash2 size={16} />}
                  >
                    Clear History
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recording Modal */}
      <AnimatePresence>
        {showVoiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleVoiceModalClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Voice Wellness Check-in</h3>
                  <button
                    onClick={handleVoiceModalClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-100'
                  }`}>
                    {isProcessing ? (
                      <Loader2 className="animate-spin text-gray-600" size={32} />
                    ) : isRecording ? (
                      <Volume2 className="text-red-600" size={32} />
                    ) : (
                      <Mic className="text-gray-600" size={32} />
                    )}
                  </div>

                  {isRecording && (
                    <div className="text-2xl font-mono text-red-600 mb-2">
                      {formatDuration(recordingDuration)}
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mb-2 px-2">
                    {isProcessing 
                      ? "Initializing microphone..." 
                      : isRecording 
                        ? "Recording your wellness check-in... Express how you're feeling!" 
                        : audioUrl
                          ? "Voice message recorded! This will update your daily wellness tracking."
                          : "Record your daily emotional state and thoughts"
                    }
                  </p>

                  {audioUrl && !isRecording && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => handlePlayAudio('preview', audioUrl)}
                          className="p-2 bg-lavender-100 text-lavender-600 rounded-full hover:bg-lavender-200 transition-colors"
                        >
                          {playingAudio === 'preview' ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <div className="flex items-center space-x-2">
                          <Volume2 size={16} className="text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {formatDuration(recordingDuration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {voiceError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                      <p className="text-sm text-red-600">{voiceError}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-3">
                  {isRecording ? (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        stopRecording(recognition);
                        setRecognition(null);
                      }}
                      leftIcon={<MicOff size={18} />}
                    >
                      Stop Recording
                    </Button>
                  ) : audioUrl ? (
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => {
                          clearRecording();
                        }}
                        leftIcon={<X size={18} />}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={handleSendVoiceMessage}
                        leftIcon={<Send size={18} />}
                        className="bg-gradient-to-r from-lavender-500 to-sage-500"
                      >
                        Send Check-in
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleVoiceToggle}
                      leftIcon={<Mic size={18} />}
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-lavender-500 to-sage-500"
                    >
                      {isProcessing ? "Starting..." : "Start Recording"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        voiceSettings={voiceSettings}
        voices={voices}
        onUpdateSettings={updateVoiceSettings}
        onTestVoice={testVoice}
        onResetSettings={resetSettings}
        isPlaying={isPlaying}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  );
};

export default Chat;