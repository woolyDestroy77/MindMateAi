import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Loader2, Bot, User, Volume2, VolumeX, X, Play, Pause, Settings, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { useAIChat } from '../../hooks/useAIChat';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import VoiceSettingsModal from '../chat/VoiceSettingsModal';

const AnxietyChat: React.FC = () => {
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage } = useAIChat();
  const { isRecording, transcript, startRecording, stopRecording } = useVoiceInput();
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

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

  // Auto-play AI responses if enabled
  useEffect(() => {
    if (voiceSettings.autoPlay && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.id !== currentMessageId) {
        speak(lastMessage.content, lastMessage.id);
      }
    }
  }, [messages, voiceSettings.autoPlay, speak, currentMessageId]);

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

  const handlePlayMessage = (message: any) => {
    if (isPlaying && currentMessageId === message.id) {
      stop();
    } else {
      speak(message.content, message.id);
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

  // Anxiety-specific prompts
  const anxietyPrompts = [
    "I'm feeling anxious right now and need help calming down",
    "Can you teach me a quick grounding technique?",
    "I'm worried about an upcoming event",
    "I'm having trouble sleeping due to anxiety",
    "How can I manage panic attack symptoms?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-[500px] border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Anxiety Support Chat
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowVoiceSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Voice settings"
          >
            <Settings size={18} />
          </button>
          <Link
            to="/chat"
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-1"
            title="Go to main chat"
          >
            <span className="text-sm">Main Chat</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-blue-50 rounded-xl p-6 max-w-md mx-auto">
              <Bot size={40} className="mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Anxiety Support Assistant
              </h3>
              <p className="text-gray-600 mb-4">
                I'm here to help with anxiety management techniques, grounding exercises, and emotional support. What are you experiencing right now?
              </p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {anxietyPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(prompt)}
                    className="text-left p-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="max-w-[80%] space-y-1 relative group">
                <div className={`flex items-start space-x-2 ${
                  message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                  }`}>
                    {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  
                  <div className={`p-3 rounded-lg relative ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : getSentimentColor(message.sentiment)
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Voice button for assistant messages */}
                    {message.role === "assistant" && (
                      <button
                        onClick={() => handlePlayMessage(message)}
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
                </div>
              </div>
            </motion.div>
          ))
        )}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <Bot size={16} />
              </div>
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
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </Button>
        </div>
      </div>

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
    </div>
  );
};

export default AnxietyChat;