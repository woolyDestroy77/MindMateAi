import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sentiment?: string;
}

export const useAIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize chat with a welcome message
  useState(() => {
    const welcomeMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: "Hi! I'm MindMate AI, your mental wellness companion. I'm here to listen, support, and help you explore ways to improve your emotional well-being. How are you feeling today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);

      // Add user message to chat
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Prepare context from previous messages (last 10 messages)
      const context = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      console.log('Sending message to Edge Function:', content);

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          message: content,
          context,
        },
      });

      console.log('Edge Function response:', data, error);

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }

      if (data?.error) {
        console.error('API error from Edge Function:', data.error);
        throw new Error(data.error);
      }

      if (!data?.response) {
        console.error('No response from Edge Function:', data);
        throw new Error('No response received from AI service');
      }

      // Update user message with sentiment
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, sentiment: data.sentiment }
          : msg
      ));

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        sentiment: data.sentiment,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      return aiMessage;
    } catch (error) {
      console.error('Error in AI chat:', error);
      
      // Remove the user's message if the AI response failed
      setMessages(prev => prev.slice(0, -1));
      
      // Provide specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('API configuration error')) {
        toast.error('AI service is not properly configured. Please contact support.');
      } else if (errorMessage.includes('Authentication failed')) {
        toast.error('AI service authentication failed. Please contact support.');
      } else if (errorMessage.includes('Service is busy')) {
        toast.error('AI service is busy. Please try again in a moment.');
      } else if (errorMessage.includes('Service temporarily unavailable')) {
        toast.error('AI service is temporarily unavailable. Please try again later.');
      } else if (errorMessage.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Unable to get a response from AI. Please try again.');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return {
    messages,
    isLoading,
    sendMessage,
  };
};