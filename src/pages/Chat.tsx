import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Loader2, Bot, User, MessageSquare, History } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAIChat } from '../hooks/useAIChat';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useDappierChat } from '../hooks/useDappierChat';

const Chat = () => {
  const { messages, isLoading, sendMessage } = useAIChat();
  const { isRecording, transcript, startRecording, stopRecording } = useVoiceInput();
  const { saveChatMessage } = useDappierChat();
  const [inputMessage, setInputMessage] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'custom' | 'widget'>('custom');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
    }
  }, [transcript]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');
    
    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      stopRecording(recognition);
      setRecognition(null);
    } else {
      const newRecognition = await startRecording();
      setRecognition(newRecognition);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSentimentBg = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'negative':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Chat</h1>
          <p className="text-gray-600">
            Chat with MindMate AI about your thoughts, feelings, and mental wellness journey.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('custom')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'custom'
                    ? 'border-lavender-500 text-lavender-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <MessageSquare size={16} className="mr-2" />
                  Custom Chat
                </div>
              </button>
              <button
                onClick={() => setActiveTab('widget')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'widget'
                    ? 'border-lavender-500 text-lavender-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Bot size={16} className="mr-2" />
                  AI Widget
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    Auto-Save
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'custom' ? (
          <Card variant="elevated" className="h-[600px] flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-lavender-100 text-lavender-600' 
                            : 'bg-sage-100 text-sage-600'
                        }`}>
                          {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className={`rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? `bg-lavender-600 text-white ${message.sentiment ? getSentimentBg(message.sentiment) : ''}`
                          : 'bg-white border border-gray-200'
                      }`}>
                        <p className={`text-sm ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                          {message.content}
                        </p>
                        <div className={`flex items-center justify-between mt-2 text-xs ${
                          message.role === 'user' ? 'text-lavender-100' : 'text-gray-500'
                        }`}>
                          <span>{format(message.timestamp, 'h:mm a')}</span>
                          {message.sentiment && (
                            <span className={`capitalize ${
                              message.role === 'user' ? 'text-lavender-100' : getSentimentColor(message.sentiment)
                            }`}>
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
                        <span className="text-sm text-gray-600">MindMate AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent pr-12"
                    disabled={isLoading}
                  />
                  {isRecording && (
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
                  className="px-3"
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputMessage.trim() || isLoading}
                  leftIcon={isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
              </form>

              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-gray-600 flex items-center"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  Recording... Speak now
                </motion.div>
              )}
            </div>
          </Card>
        ) : (
          <Card variant="elevated" className="min-h-[600px] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Dappier AI Widget</h2>
                <p className="text-gray-600">
                  Experience our enhanced AI chat powered by Dappier's advanced AI technology.
                </p>
              </div>
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <History size={14} className="mr-1" />
                Auto-saving conversations
              </div>
            </div>
            
            {/* Dappier Widget Container */}
            <div id="dappier-ask-ai-widget" className="w-full">
              <dappier-ask-ai-widget widgetId="wd_01jxpzftx6e3ntsgzwtgbze71c" />
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Chat;