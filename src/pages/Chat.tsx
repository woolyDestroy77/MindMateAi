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
  MessageSquare,
  Sidebar,
  Volume2,
  X,
  Play,
  Pause,
  TrendingUp,
  Zap,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import ChatSidebar from "../components/chat/ChatSidebar";
import { useAIChat } from "../hooks/useAIChat";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { useChatSessions } from "../hooks/useChatSessions";
import { useDashboardData } from "../hooks/useDashboardData";

const Chat = () => {
  const { updateMoodFromAI } = useDashboardData();
  
  const {
    sessions,
    activeSession,
    isLoading: sessionsLoading,
    createNewSession,
    switchToSession,
    deleteSession,
    renameSession,
  } = useChatSessions();

  // CRITICAL: Pass the mood update callback to useAIChat
  const { messages, isLoading, sendMessage, sendVoiceMessage } = useAIChat(
    activeSession?.id,
    updateMoodFromAI // This is the key connection!
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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showMoodUpdateNotice, setShowMoodUpdateNotice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create initial session if none exists
  useEffect(() => {
    if (!sessionsLoading && sessions.length === 0 && !activeSession) {
      createNewSession();
    }
  }, [sessionsLoading, sessions.length, activeSession, createNewSession]);

  // Show mood update notice when dashboard integration is active
  useEffect(() => {
    if (messages.length > 2) { // Show after some conversation
      setShowMoodUpdateNotice(true);
      const timer = setTimeout(() => setShowMoodUpdateNotice(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true); // Auto-open on desktop
      } else {
        setSidebarOpen(false); // Auto-close on mobile
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !activeSession) return;

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

  const handleCreateNewChat = async () => {
    await createNewSession();
    // Close sidebar on mobile after creating new chat
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handlePlayAudio = (messageId: string, audioUrl: string) => {
    // Stop any currently playing audio
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Mood Update Notice - Mobile Optimized */}
      <AnimatePresence>
        {showMoodUpdateNotice && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-2 right-2 md:top-20 md:left-1/2 md:transform md:-translate-x-1/2 z-50"
          >
            <div className="bg-lavender-100 border border-lavender-300 rounded-lg px-3 py-2 md:px-4 md:py-3 shadow-lg max-w-md mx-auto">
              <div className="flex items-center space-x-2 text-lavender-800">
                <TrendingUp size={14} className="flex-shrink-0" />
                <span className="text-xs md:text-sm font-medium">
                  🎯 Mood Tracking Active!
                </span>
              </div>
              <div className="text-xs text-lavender-700 mt-1">
                Your emotional expressions are being analyzed to update your dashboard automatically. Try saying "I'm feeling anxious" or "I'm really happy today"!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex h-screen pt-16 relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop for mobile */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              
              {/* Sidebar */}
              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", damping: 20 }}
                className="fixed left-0 top-16 bottom-0 z-50 md:relative md:top-0"
              >
                <ChatSidebar
                  sessions={sessions}
                  activeSession={activeSession}
                  isLoading={sessionsLoading}
                  onCreateNew={handleCreateNewChat}
                  onSwitchSession={(sessionId) => {
                    switchToSession(sessionId);
                    // Close sidebar on mobile after switching
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  onDeleteSession={deleteSession}
                  onRenameSession={renameSession}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Chat Area - Responsive */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - Mobile Optimized */}
          <div className="bg-white border-b border-gray-200 p-3 md:p-4 flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                leftIcon={sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
                className="mr-2 md:mr-3 flex-shrink-0"
              >
                <span className="hidden md:inline">
                  {sidebarOpen ? "Hide" : "Show"} Sidebar
                </span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                  {activeSession?.name || "MindMate AI Chat"}
                </h1>
                {activeSession && (
                  <div className="flex flex-col md:flex-row md:items-center text-xs md:text-sm text-gray-500">
                    <span className="truncate">
                      Created {format(new Date(activeSession.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    <span className="flex items-center text-lavender-600 mt-1 md:mt-0 md:ml-2">
                      <Zap size={10} className="mr-1 flex-shrink-0" />
                      Dashboard Integration Active
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNewChat}
              leftIcon={<MessageSquare size={14} />}
              className="ml-2 flex-shrink-0"
            >
              <span className="hidden sm:inline">New Chat</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          {/* Messages Area - Mobile Optimized */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6">
            <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[85%] md:max-w-[80%] ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 ${
                          message.role === "user" ? "ml-2 md:ml-3" : "mr-2 md:mr-3"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                            message.role === "user"
                              ? "bg-lavender-100 text-lavender-600"
                              : "bg-sage-100 text-sage-600"
                          }`}
                        >
                          {message.role === "user" ? (
                            <User size={12} className="md:w-4 md:h-4" />
                          ) : (
                            <Bot size={12} className="md:w-4 md:h-4" />
                          )}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div
                        className={`rounded-lg px-3 py-2 md:px-4 md:py-3 ${
                          message.role === "user"
                            ? "bg-lavender-600"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        {message.isVoiceMessage ? (
                          // Voice Message UI - Mobile Optimized
                          <div className="flex items-center space-x-2 md:space-x-3">
                            <button
                              onClick={() => handlePlayAudio(message.id, message.audioUrl!)}
                              className={`p-1.5 md:p-2 rounded-full transition-colors ${
                                message.role === "user"
                                  ? "bg-lavender-500 hover:bg-lavender-400 text-white"
                                  : "bg-sage-100 hover:bg-sage-200 text-sage-600"
                              }`}
                            >
                              {playingAudio === message.id ? (
                                <Pause size={12} className="md:w-4 md:h-4" />
                              ) : (
                                <Play size={12} className="md:w-4 md:h-4" />
                              )}
                            </button>
                            <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
                              <Volume2 size={12} className={`md:w-4 md:h-4 flex-shrink-0 ${message.role === "user" ? "text-white" : "text-gray-500"}`} />
                              <div className="flex space-x-0.5 md:space-x-1">
                                {[...Array(8)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-0.5 md:w-1 rounded-full ${
                                      message.role === "user" ? "bg-white" : "bg-gray-300"
                                    }`}
                                    style={{
                                      height: `${Math.random() * 12 + 6}px`,
                                      animation: playingAudio === message.id ? `pulse 1s infinite ${i * 0.1}s` : 'none'
                                    }}
                                  />
                                ))}
                              </div>
                              <span className={`text-xs ${
                                message.role === "user" ? "text-white" : "text-gray-500"
                              }`}>
                                {formatDuration(message.audioDuration || 0)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          // Regular Text Message
                          <p
                            className={`text-sm md:text-base ${
                              message.role === "user"
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {message.content}
                          </p>
                        )}
                        
                        <div
                          className={`flex items-center justify-between mt-2 text-xs ${
                            message.role === "user"
                              ? "text-white opacity-80"
                              : "text-gray-500"
                          }`}
                        >
                          <span>{format(message.timestamp, "h:mm a")}</span>
                          {message.sentiment && (
                            <span
                              className={`capitalize flex items-center space-x-1 ${
                                message.role === "user"
                                  ? "text-white opacity-80"
                                  : getSentimentColor(message.sentiment)
                              }`}
                            >
                              <span>{message.sentiment}</span>
                              {message.role === "user" && (
                                <span className="ml-1" title="This message updates your dashboard mood">
                                  📊
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-2 md:mr-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center">
                        <Bot size={12} className="md:w-4 md:h-4" />
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 md:px-4 md:py-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin text-sage-600" />
                        <span className="text-xs md:text-sm text-gray-900">
                          MindMate AI is analyzing your mood and crafting a response...
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - Mobile Optimized */}
          <div className="bg-white border-t border-gray-200 p-3 md:p-4 safe-area-bottom">
            <div className="max-w-4xl mx-auto">
              <form
                onSubmit={handleSendMessage}
                className="flex items-end space-x-2 md:space-x-3"
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
                    placeholder="Express your feelings... Try: 'I'm feeling anxious about work' or 'I'm really happy today!'"
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none min-h-[44px] max-h-32"
                    rows={1}
                    disabled={isLoading || !activeSession}
                    style={{ 
                      height: 'auto',
                      minHeight: '44px'
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
                  className={`px-3 flex-shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
                  disabled={isLoading || !activeSession || isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : isRecording ? (
                    <MicOff size={18} />
                  ) : (
                    <Mic size={18} />
                  )}
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputMessage.trim() || isLoading || !activeSession}
                  leftIcon={
                    isLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )
                  }
                  className="flex-shrink-0"
                >
                  <span className="hidden sm:inline">
                    {isLoading ? "Analyzing..." : "Send & Track Mood"}
                  </span>
                  <span className="sm:hidden">
                    {isLoading ? "..." : "Send"}
                  </span>
                </Button>
              </form>

              {!activeSession && (
                <div className="mt-2 text-sm text-gray-500 text-center">
                  Create a new chat session to start messaging
                </div>
              )}
              
              <div className="mt-2 text-xs text-center text-lavender-600 bg-lavender-50 p-2 rounded">
                💡 <strong>Mood Tracking:</strong> Express emotions like "I'm anxious", "feeling happy", "really sad today" to automatically update your dashboard!
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Voice Recording Modal - Mobile Optimized */}
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
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 md:p-6 mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Record Voice Message</h3>
                  <button
                    onClick={handleVoiceModalClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-100'
                  }`}>
                    {isProcessing ? (
                      <Loader2 className="animate-spin text-gray-600" size={24} />
                    ) : isRecording ? (
                      <Volume2 className="text-red-600" size={24} />
                    ) : (
                      <Mic className="text-gray-600" size={24} />
                    )}
                  </div>

                  {isRecording && (
                    <div className="text-xl md:text-2xl font-mono text-red-600 mb-2">
                      {formatDuration(recordingDuration)}
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mb-2 px-2">
                    {isProcessing 
                      ? "Initializing microphone..." 
                      : isRecording 
                        ? "Recording... Express your emotions for mood tracking!" 
                        : audioUrl
                          ? "Voice message recorded! This will analyze your mood and update your dashboard."
                          : "Click to record your emotional state"
                    }
                  </p>

                  {audioUrl && !isRecording && (
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 mt-4">
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
                      >
                        Send & Track Mood
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleVoiceToggle}
                      leftIcon={<Mic size={18} />}
                      disabled={isProcessing}
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
        
        .safe-area-bottom {
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
};

export default Chat;