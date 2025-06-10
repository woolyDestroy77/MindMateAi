import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Bot, User, Sparkles, Brain, Loader, Volume2, VolumeX } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAIAgent } from '../hooks/useAIAgent';
import { useVoiceInput } from '../hooks/useVoiceInput';

const AIAgent: React.FC = () => {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearConversation } = useAIAgent();
  const { isRecording, transcript, startRecording, stopRecording } = useVoiceInput();
  const [recognition, setRecognition] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const messageToSend = input.trim();
    setInput('');
    
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
      const rec = await startRecording();
      setRecognition(rec);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-lavender-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-lavender-500 to-sage-500 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-3 h-3 text-white" />
              </motion.div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-lavender-600 to-sage-500 bg-clip-text text-transparent mb-2">
            AI Wellness Agent
          </h1>
          <p className="text-gray-600 text-lg">
            Your personalized AI companion for mental wellness support and guidance
          </p>
        </motion.div>

        {/* Chat Interface */}
        <Card variant="elevated" className="h-[600px] flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-lavender-50 to-sage-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-lavender-500 to-sage-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">MindMate AI Agent</h3>
                <p className="text-sm text-gray-500">Online • Ready to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearConversation}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear Chat
                </Button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-lavender-100 to-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-lavender-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to your AI Wellness Agent
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  I'm here to provide personalized mental wellness support. Feel free to share what's on your mind or ask me anything about your wellbeing.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("How can you help me with stress management?")}
                    className="text-left justify-start"
                  >
                    💆‍♀️ Stress management tips
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("I'm feeling anxious today")}
                    className="text-left justify-start"
                  >
                    😰 Dealing with anxiety
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("Help me improve my sleep")}
                    className="text-left justify-start"
                  >
                    😴 Better sleep habits
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("What are some mindfulness exercises?")}
                    className="text-left justify-start"
                  >
                    🧘‍♀️ Mindfulness practices
                  </Button>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-lavender-500 to-sage-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div
                          className={`p-4 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-lavender-500 to-sage-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                        <div className="flex items-center justify-between mt-1 px-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.role === 'assistant' && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                                className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                              >
                                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-lavender-500 to-sage-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin text-lavender-500" />
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex items-end space-x-3">
              <Button
                variant={isRecording ? 'primary' : 'outline'}
                size="sm"
                onClick={handleVoiceToggle}
                className={`flex-shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
                disabled={isLoading}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </Button>
              
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share what's on your mind..."
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 focus:ring-2 focus:ring-lavender-500 focus:border-transparent max-h-32 min-h-[48px]"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 rounded-lg"
                >
                  {isLoading ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                </Button>
              </div>
            </div>
            
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-center"
              >
                <span className="text-sm text-lavender-600 font-medium">
                  🎤 Listening... Speak now
                </span>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card variant="outlined" className="text-center">
            <Brain className="w-8 h-8 text-lavender-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Personalized Support</h3>
            <p className="text-sm text-gray-600">
              Get tailored advice based on your unique mental wellness needs and patterns.
            </p>
          </Card>
          
          <Card variant="outlined" className="text-center">
            <Sparkles className="w-8 h-8 text-sage-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Evidence-Based</h3>
            <p className="text-sm text-gray-600">
              Receive guidance rooted in proven psychological techniques and wellness practices.
            </p>
          </Card>
          
          <Card variant="outlined" className="text-center">
            <Volume2 className="w-8 h-8 text-lavender-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Voice & Text</h3>
            <p className="text-sm text-gray-600">
              Interact through voice or text, with speech synthesis for audio responses.
            </p>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default AIAgent;