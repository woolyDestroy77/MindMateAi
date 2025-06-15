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
  
  console.log('=== CHAT COMPONENT INITIALIZED ===');
  console.log('updateMoodFromAI function available:', !!updateMoodFromAI);
  
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !activeSession) return;

    const messageToSend = inputMessage.trim();
    setInputMessage("");

    console.log('=== CHAT COMPONENT SENDING MESSAGE ===');
    console.log('Message:', messageToSend);
    console.log('Active session:', activeSession?.id);
    console.log('updateMoodFromAI available:', !!updateMoodFromAI);

    try {
      await sendMessage(messageToSend);
      console.log('Message sent successfully from Chat component');
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
      console.log('=== CHAT COMPONENT SENDING VOICE MESSAGE ===');
      console.log('Transcript:', transcript);
      console.log('updateMoodFromAI available:', !!updateMoodFromAI);
      
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

      {/* Mood Update Notice */}
      <AnimatePresence>
        {showMoodUpdateNotice && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-lavender-100 border border-lavender-300 rounded-lg px-4 py-3 shadow-lg max-w-md">
              <div className="flex items-center space-x-2 text-lavender-800">
                <TrendingUp size={16} />
                <span className="text-sm font-medium">
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

      <main className="flex h-screen pt-16">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed left-0 top-16 bottom-0 z-40"
            >
              <ChatSidebar
                sessions={sessions}
                activeSession={activeSession}
                isLoading={sessionsLoading}
                onCreateNew={handleCreateNewChat}
                onSwitchSession={switchToSession}
                onDeleteSession={deleteSession}
                onRenameSession={renameSession}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarOpen ? "ml-80" : "ml-0"
          }`}
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                leftIcon={<Sidebar size={18} />}
                className="mr-3"
              >
                {sidebarOpen ? "Hide" : "Show"} Sidebar
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {activeSession?.name || "MindMate AI Chat"}
                </h1>
                {activeSession && (
                  <p className="text-sm text-gray-500">
                    Created {format(new Date(activeSession.created_at), "MMM d, yyyy 'at' h:mm a")}
                    <span className="ml-2 text-lavender-600 flex items-center">
                      <Zap size={12} className="mr-1" />
                      Dashboard Integration Active
                    </span>
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNewChat}
              leftIcon={<MessageSquare size={16} />}
            >
              New Chat
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
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
                      className={`flex max-w-[80%] ${
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
                              ? "bg-lavender-100 text-lavender-600"
                              : "bg-sage-100 text-sage-600"
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
                        className={`rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-lavender-600"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        {message.isVoiceMessage ? (
                          // Voice Message UI
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handlePlayAudio(message.id, message.audioUrl!)}
                              className={`p-2 rounded-full transition-colors ${
                                message.role === "user"
                                  ? "bg-lavender-500 hover:bg-lavender-400 text-white"
                                  : "bg-sage-100 hover:bg-sage-200 text-sage-600"
                              }`}
                            >
                              {playingAudio === message.id ? (
                                <Pause size={16} />
                              ) : (
                                <Play size={16} />
                              )}
                            </button>
                            <div className="flex items-center space-x-2">
                              <Volume2 size={16} className={message.role === "user" ? "text-white" : "text-gray-500"} />
                              <div className="flex space-x-1">
                                {[...Array(12)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 rounded-full ${
                                      message.role === "user" ? "bg-white" : "bg-gray-300"
                                    }`}
                                    style={{
                                      height: `${Math.random() * 20 + 8}px`,
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
                            className={`text-sm ${
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
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-sage-600" />
                        <span className="text-sm text-gray-900">
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

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-3"
              >
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Express your feelings... Try: 'I'm feeling anxious about work' or 'I'm really happy today!'"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent pr-12"
                    disabled={isLoading || !activeSession}
                  />
                </div>

                <Button
                  type="button"
                  variant={isRecording ? "primary" : "outline"}
                  size="md"
                  onClick={handleVoiceToggle}
                  className={`px-3 ${isRecording ? 'animate-pulse' : ''}`}
                  disabled={isLoading || !activeSession || isProcessing}
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
                  disabled={!inputMessage.trim() || isLoading || !activeSession}
                  leftIcon={
                    isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Send size={20} />
                    )
                  }
                >
                  {isLoading ? "Analyzing..." : "Send & Track Mood"}
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
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
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

                  <p className="text-sm text-gray-600 mb-2">
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

                <div className="flex space-x-3">
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
                    <>
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
                    </>
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
      `}</style>
    </div>
  );
};

export default Chat;