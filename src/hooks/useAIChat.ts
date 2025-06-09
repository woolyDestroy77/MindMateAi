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

      // Call AI service through Edge Function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          message: content,
          context,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Handle different types of errors with user-friendly messages
        let userMessage = 'Unable to get a response. Please try again.';
        
        try {
          // Parse error details from Edge Function response
          let errorDetails = error.message;
          let errorCode = 'UNKNOWN_ERROR';
          
          if (error.context?.body) {
            const errorBody = typeof error.context.body === 'string' 
              ? JSON.parse(error.context.body) 
              : error.context.body;
            
            if (errorBody.error) {
              errorCode = errorBody.error;
              errorDetails = errorBody.details || errorBody.message || errorDetails;
            }
          }
          
          // Provide specific user messages based on error type
          switch (errorCode) {
            case 'QUOTA_EXCEEDED':
              userMessage = 'AI service is temporarily unavailable due to usage limits. Please try again in a few minutes.';
              break;
            case 'API_CONFIGURATION_ERROR':
              userMessage = 'AI service is currently unavailable. Please contact support if this persists.';
              break;
            case 'AUTHENTICATION_ERROR':
              userMessage = 'AI service authentication failed. Please contact support.';
              break;
            case 'SERVICE_UNAVAILABLE':
              userMessage = 'AI service is temporarily unavailable. Please try again later.';
              break;
            case 'INTERNAL_ERROR':
              userMessage = 'An unexpected error occurred. Please try again.';
              break;
            default:
              // Handle legacy error messages for backward compatibility
              if (errorDetails.includes('429') || errorDetails.includes('quota')) {
                userMessage = 'AI service is temporarily unavailable due to usage limits. Please try again in a few minutes.';
              } else if (errorDetails.includes('DAPPIER_API_KEY') || errorDetails.includes('API configuration')) {
                userMessage = 'AI service is currently unavailable. Please contact support if this persists.';
              } else if (errorDetails.includes('authentication') || errorDetails.includes('401')) {
                userMessage = 'AI service authentication failed. Please contact support.';
              } else if (errorDetails.includes('network') || errorDetails.includes('Failed to fetch')) {
                userMessage = 'Network error. Please check your connection and try again.';
              }
              break;
          }
          
          console.error('Edge Function error details:', { errorCode, errorDetails });
        } catch (parseError) {
          console.error('Error parsing Edge Function error details:', parseError);
        }
        
        toast.error(userMessage);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data?.response) {
        console.error('Invalid response data:', data);
        toast.error('Invalid response from AI service. Please try again.');
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
      
      // Only show toast if we haven't already shown one
      const errorMessage = error?.message || 'Unknown error';
      if (!errorMessage.includes('Edge function error')) {
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (errorMessage.includes('Invalid response')) {
          toast.error('Unable to get a valid response. Please try again.');
        } else {
          toast.error('Unable to get a response. Please try again.');
        }
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