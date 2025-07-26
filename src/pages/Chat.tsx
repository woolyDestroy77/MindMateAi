import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Settings, Volume2, VolumeX, Send, Loader2, Video, MessageCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ChatInterface from '../components/chat/ChatInterface';
import VoiceSettingsModal from '../components/chat/VoiceSettingsModal';
import VideoCallAssistant from '../components/chat/VideoCallAssistant';
import { useAIChat } from '../hooks/useAIChat';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { supabase } from '../lib/supabase';

const Chat = () => {
  const { 
    messages, 
    isLoading: chatLoading, 
    sendMessage
  } = useAIChat(undefined, updateMood);
  
  const { updateMoodFromAI } = useDashboardData();
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
  
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<'text' | 'video'>('text');

  // Function to update mood from chat
  async function updateMood(sentiment: string, userMessage: string, aiResponse: string) {
    try {
      await updateMoodFromAI(sentiment, userMessage, aiResponse);
    } catch (error) {
      console.error('Error updating mood from chat:', error);
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    try {
      const currentInput = input.trim();
      setInput(""); // Clear input immediately before sending
      await sendMessage(currentInput);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col space-y-6">
          {/* Mode Selector */}
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveMode('text')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeMode === 'text'
                      ? 'bg-lavender-100 text-lavender-800'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <MessageCircle size={16} />
                  <span>Text Chat</span>
                </button>
                <button
                  onClick={() => setActiveMode('video')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeMode === 'video'
                      ? 'bg-lavender-100 text-lavender-800'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Video size={16} />
                  <span>Video Call</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          {activeMode === 'text' && (
            <div className="flex-1">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex justify-between items-center bg-lavender-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-lavender-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-lavender-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Daily Wellness Chat
                    </h2>
                    <p className="text-sm text-gray-600">
                      Chat with PureMind AI about your thoughts and feelings
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVoiceSettings(true)}
                    leftIcon={<Settings size={16} />}
                    title="Voice settings"
                  >
                    Voice
                  </Button>
                  {isPlaying && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stop}
                      leftIcon={<VolumeX size={16} />}
                      title="Stop audio"
                    >
                      Stop Audio
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
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
                            : message.sentiment === "POSITIVE"
                            ? "bg-green-100 text-green-800"
                            : message.sentiment === "NEGATIVE"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
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
                          onClick={() => speak(message.content, message.id)}
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
                {chatLoading && (
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
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <textarea
                    placeholder="Type your message..."
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                    disabled={!input.trim() || chatLoading}
                    className="bg-lavender-600 hover:bg-lavender-700"
                  >
                    {chatLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Send size={20} />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          )}

          {/* Video Call Assistant */}
          {activeMode === 'video' && (
            <div className="flex-1">
              <VideoCallAssistant onMoodUpdate={updateMood} />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Chat Interface */}
      <ChatInterface isOpen={showChatInterface} onClose={() => setShowChatInterface(false)} />

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

export default Chat;