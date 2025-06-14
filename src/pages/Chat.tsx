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
} from "lucide-react";
import { format } from "date-fns";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ChatSidebar from "../components/chat/ChatSidebar";
import { useAIChat } from "../hooks/useAIChat";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { useChatSessions } from "../hooks/useChatSessions";

const Chat = () => {
  const {
    sessions,
    activeSession,
    isLoading: sessionsLoading,
    createNewSession,
    switchToSession,
    deleteSession,
    renameSession,
  } = useChatSessions();

  const { messages, isLoading, sendMessage } = useAIChat(activeSession?.id);
  const { 
    isRecording, 
    transcript, 
    error: voiceError,
    isProcessing,
    startRecording, 
    stopRecording,
    clearTranscript 
  } = useVoiceInput();

  const [inputMessage, setInputMessage] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update input with transcript
  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
    }
  }, [transcript]);

  // Create initial session if none exists
  useEffect(() => {
    if (!sessionsLoading && sessions.length === 0 && !activeSession) {
      createNewSession();
    }
  }, [sessionsLoading, sessions.length, activeSession, createNewSession]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !activeSession) return;

    const messageToSend = inputMessage.trim();
    setInputMessage("");
    clearTranscript(); // Clear the transcript after sending

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
      setShowVoiceModal(false);
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
  };

  const handleSendVoiceMessage = () => {
    if (transcript.trim()) {
      setInputMessage(transcript);
      setShowVoiceModal(false);
      stopRecording(recognition);
      setRecognition(null);
      
      // Auto-send the voice message
      setTimeout(() => {
        if (inputRef.current) {
          const form = inputRef.current.closest('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }
      }, 100);
    }
  };

  const handleCreateNewChat = async () => {
    await createNewSession();
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
                            ? "bg-lavender-600 text-white"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            message.role === "user"
                              ? "text-white"
                              : "text-gray-800"
                          }`}
                        >
                          {message.content}
                        </p>
                        <div
                          className={`flex items-center justify-between mt-2 text-xs ${
                            message.role === "user"
                              ? "text-lavender-100"
                              : "text-gray-500"
                          }`}
                        >
                          <span>{format(message.timestamp, "h:mm a")}</span>
                          {message.sentiment && (
                            <span
                              className={`capitalize ${
                                message.role === "user"
                                  ? "text-lavender-100"
                                  : getSentimentColor(message.sentiment)
                              }`}
                            >
                              {message.sentiment}
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
                        <span className="text-sm text-gray-600">
                          MindMate AI is thinking...
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
                    placeholder="Type your message here or use voice input..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent pr-12"
                    disabled={isLoading || !activeSession}
                  />
                  {(isRecording || isProcessing) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
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
                  {isLoading ? "Sending..." : "Send"}
                </Button>
              </form>

              {/* Voice Recording Status */}
              {(isRecording || isProcessing) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-gray-600 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    {isProcessing ? "Initializing microphone..." : "Recording... Speak now"}
                  </div>
                  {transcript && (
                    <span className="text-lavender-600 italic">
                      "{transcript.substring(0, 50)}{transcript.length > 50 ? '...' : ''}"
                    </span>
                  )}
                </motion.div>
              )}

              {voiceError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center"
                >
                  <X size={16} className="mr-1" />
                  {voiceError}
                </motion.div>
              )}

              {!activeSession && (
                <div className="mt-2 text-sm text-gray-500 text-center">
                  Create a new chat session to start messaging
                </div>
              )}
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
                  <h3 className="text-lg font-semibold text-gray-900">Voice Input</h3>
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

                  <p className="text-sm text-gray-600 mb-2">
                    {isProcessing 
                      ? "Initializing microphone..." 
                      : isRecording 
                        ? "Listening... Speak clearly into your microphone" 
                        : "Click the microphone to start recording"
                    }
                  </p>

                  {transcript && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-4">
                      <p className="text-sm text-gray-700 italic">"{transcript}"</p>
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
                  ) : (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={handleVoiceToggle}
                      leftIcon={<Mic size={18} />}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Starting..." : "Start Recording"}
                    </Button>
                  )}

                  {transcript && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleSendVoiceMessage}
                      leftIcon={<Send size={18} />}
                    >
                      Send Message
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;