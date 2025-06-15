/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from "lucide-react";
import { format, isToday, startOfDay, differenceInHours } from "date-fns";
import { toast } from "react-hot-toast";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import { useAIChat } from "../hooks/useAIChat";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { useDashboardData } from "../hooks/useDashboardData";

const Chat = () => {
  const { dashboardData, updateMoodFromAI } = useDashboardData();
  
  // Use a fixed session ID for the single daily chat
  const DAILY_CHAT_SESSION = "daily-health-chat";
  
  const { messages, isLoading, sendMessage, sendVoiceMessage } = useAIChat(
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

  const [inputMessage, setInputMessage] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show welcome message for new day or first visit
  useEffect(() => {
    if (messages.length === 0) {
      setShowWelcomeMessage(true);
      const timer = setTimeout(() => setShowWelcomeMessage(false), 10000);
      return () => clearTimeout(timer);
    }
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

  const handlePlayAudio = (messageId: string, audioUrl: string) => {
    Object.values(audioRefs.current).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    if (playingAudio === messageId) {
      setPlayingAudio(null);
      return;
    }

    if (!audioRefs.current[messageId]) {
      audioRefs.current[messageId] = new Audio(audioUrl);
      audioRefs.current[messageId].onended = () => {
        setPlayingAudio(null);
      };
    }

    audioRefs.current[messageId].play();
    setPlayingAudio(messageId);
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
            className="fixed top-16 left-2 right-2 md:top-20 md:left-1/2 md:transform md:-translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-lavender-100 to-sage-100 border border-lavender-300 rounded-xl px-4 py-3 shadow-lg max-w-lg mx-auto">
              <div className="flex items-center space-x-3 text-lavender-800">
                <Heart size={20} className="flex-shrink-0 text-lavender-600" />
                <div>
                  <div className="font-semibold text-sm">Welcome to Your Daily Wellness Chat</div>
                  <div className="text-xs text-lavender-700 mt-1">
                    This is your personal space to track emotions, share thoughts, and monitor your mental wellness journey. Every message helps build your wellness profile!
                  </div>
                </div>
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

            {/* Welcome message for first-time users */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
                  <div className="text-4xl mb-4">🌟</div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Welcome to Your Personal Wellness Journey
                  </h2>
                  <p className="text-gray-600 mb-4">
                    This is your dedicated space for daily emotional check-ins. Share your feelings, thoughts, and experiences. 
                    I'll help track your mood patterns and provide personalized wellness insights.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
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
                            // Voice Message UI
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handlePlayAudio(message.id, message.audioUrl!)}
                                className={`p-2 rounded-full transition-colors ${
                                  message.role === "user"
                                    ? "bg-lavender-400 hover:bg-lavender-300 text-white"
                                    : "bg-sage-100 hover:bg-sage-200 text-sage-600"
                                }`}
                              >
                                {playingAudio === message.id ? (
                                  <Pause size={16} />
                                ) : (
                                  <Play size={16} />
                                )}
                              </button>
                              <div className="flex items-center space-x-2 min-w-0">
                                <Volume2 size={16} className={`flex-shrink-0 ${message.role === "user" ? "text-white" : "text-gray-500"}`} />
                                <div className="flex space-x-1">
                                  {[...Array(10)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-1 rounded-full ${
                                        message.role === "user" ? "bg-white" : "bg-gray-300"
                                      }`}
                                      style={{
                                        height: `${Math.random() * 16 + 8}px`,
                                        animation: playingAudio === message.id ? `pulse 1s infinite ${i * 0.1}s` : 'none'
                                      }}
                                    />
                                  ))}
                                </div>
                                <span className={`text-sm ${
                                  message.role === "user" ? "text-white" : "text-gray-500"
                                }`}>
                                  {formatDuration(message.audioDuration || 0)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            // Regular Text Message
                            <p
                              className={`text-sm md:text-base leading-relaxed ${
                                message.role === "user"
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {message.content}
                            </p>
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
                        Analyzing your wellness and crafting a personalized response...
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
                  placeholder="How are you feeling today? Share your thoughts, emotions, or any wellness updates..."
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
                  {isLoading ? "Analyzing..." : "Send & Track"}
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