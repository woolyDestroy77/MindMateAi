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

      // Call Dappier through Edge Function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          message: content,
          context,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Handle specific error cases
        if (error.message.includes('DAPPIER_API_KEY')) {
          toast.error('AI service is currently unavailable. Please check the API configuration.');
          throw new Error('Dappier API key configuration error');
        }
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data?.response) {
        console.error('Invalid response data:', data);
        throw new Error('Invalid response from AI service');
      }

      // Update user message with sentiment if provided
      if (data.sentiment) {
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, sentiment: data.sentiment }
            : msg
        ));
      }

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
      
      // Provide specific error messages based on error type
      const errorMessage = error?.message || 'Unknown error';
      
      if (errorMessage.includes('Dappier API key configuration error')) {
        toast.error('AI service is currently unavailable. Please check the API configuration.');
      } else if (errorMessage.includes('Edge function error')) {
        toast.error('Unable to connect to AI service. Please try again.');
      } else if (errorMessage.includes('Invalid response')) {
        toast.error('Unable to get a valid response. Please try again.');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Unable to get a response. Please try again.');
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