import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, X, Loader2, Volume2, VolumeX } from "lucide-react";
import Button from "../ui/Button";
import { useAIChat } from "../../hooks/useAIChat";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { useTextToSpeech } from "../../hooks/useTextToSpeech";

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage } = useAIChat();
  const { isRecording, transcript, startRecording, stopRecording } =
    useVoiceInput();
  const { speak, stop, isPlaying, currentMessageId } = useTextToSpeech();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [recognition, setRecognition] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const messageToSend = input.trim();
    console.log("Attempting to send message:", messageToSend);

    try {
      setInput("");
      await sendMessage(messageToSend);
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      // The error handling is already done in useAIChat hook
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      stopRecording(recognition);
      setRecognition(null);
    } else {
      const rec = await startRecording();
      setRecognition(rec);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePlayMessage = (messageId: string, content: string) => {
    if (isPlaying && currentMessageId === messageId) {
      stop();
    } else {
      speak(content, messageId);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toUpperCase()) {
      case "POSITIVE":
        return "bg-green-100 text-green-800";
      case "NEGATIVE":
        return "bg-red-100 text-red-800";
      case "NEUTRAL":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50"
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-lavender-50 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                PureMind AI Chat
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[80%] space-y-1 relative group">
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-lavender-500 text-white"
                          : getSentimentColor(message.sentiment)
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.sentiment && message.role === "user" && (
                      <div className="text-xs text-gray-500 italic text-right">
                        Sentiment: {message.sentiment}
                      </div>
                    )}
                    
                    {/* Voice button for assistant messages */}
                    {message.role === "assistant" && (
                      <button
                        onClick={() => handlePlayMessage(message.id, message.content)}
                        className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white/80 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title={isPlaying && currentMessageId === message.id ? "Stop" : "Play"}
                      >
                        {isPlaying && currentMessageId === message.id ? (
                          <VolumeX size={16} className="text-gray-700" />
                        ) : (
                          <Volume2 size={16} className="text-gray-700" />
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%] space-y-1">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="text-gray-700">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <Button
                  variant={isRecording ? "primary" : "outline"}
                  size="sm"
                  onClick={handleVoiceToggle}
                  className={isRecording ? "animate-pulse" : ""}
                >
                  {isRecording ? <Mic size={20} /> : <Mic size={20} />}
                </Button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 resize-none p-2 border rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                  rows={1}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-lavender-600 hover:bg-lavender-700"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatInterface;