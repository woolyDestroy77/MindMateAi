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
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    try {
      setIsLoading(true);

      // Add user message to chat
      setMessages(prev => [...prev, userMessage]);

      // Prepare context from previous messages (last 10 messages)
      const context = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      console.log('Sending message to Edge Function:', content);

      // Call Edge Function with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 45000); // 45 second timeout
      });

      const requestPromise = supabase.functions.invoke('chat', {
        body: { 
          message: content,
          context,
        },
      });

      const { data, error } = await Promise.race([requestPromise, timeoutPromise]) as any;

      console.log('Edge Function response:', { data, error });

      // Handle Supabase function invocation errors first
      if (error) {
        console.error('Supabase function invocation error:', error);
        
        // Try to extract more details from the error
        let errorMessage = 'Edge Function error';
        let errorDetails = '';
        
        if (error.message) {
          errorMessage = error.message;
        }
        
        if (error.details) {
          errorDetails = error.details;
        }
        
        // Log the full error object for debugging
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        // For FunctionsHttpError, try to get more details from the response
        if (error.name === 'FunctionsHttpError') {
          try {
            // The error might contain response data in the context
            if (error.context && error.context.body) {
              const errorBody = typeof error.context.body === 'string' 
                ? JSON.parse(error.context.body) 
                : error.context.body;
              
              if (errorBody.error) {
                errorMessage = errorBody.error;
                errorDetails = errorBody.details || '';
              }
            }
          } catch (parseError) {
            console.error('Failed to parse error context:', parseError);
          }
        }
        
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }

      // Check for specific error messages in the Edge Function's response data
      if (data?.error) {
        console.error('API error from Edge Function:', data.error);
        console.error('Error details:', data.details);
        console.error('Status code:', data.status);
        
        // Create a more specific error message based on the details
        let errorMessage = data.error;
        if (data.details) {
          if (data.details.includes('DAPPIER_API_KEY') || data.details.includes('Missing environment variables')) {
            errorMessage = 'AI service configuration error. Environment variables may not be set in Supabase. Please check the Edge Function logs and ensure DAPPIER_API_KEY, DAPPIER_DATAMODEL_ID, and DAPPIER_AI_MODEL_API_KEY are set as Supabase secrets.';
          } else if (data.details.includes('Rate limit')) {
            errorMessage = 'AI service is busy. Please try again in a moment.';
          } else if (data.details.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          } else if (data.details.includes('Authentication failed') || data.details.includes('Invalid or expired API key')) {
            errorMessage = 'AI service authentication failed. Please check that your API keys are correctly set in Supabase secrets.';
          }
        }
        
        throw new Error(errorMessage);
      }

      if (!data?.response) {
        console.error('No response from Edge Function:', data);
        throw new Error('No response received from AI service. Check Edge Function logs for details.');
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
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      
      // Provide specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else if (errorMessage.includes('configuration error') || errorMessage.includes('Environment variables') || errorMessage.includes('Missing Supabase secrets')) {
        toast.error('AI service is not properly configured. Please ensure DAPPIER_API_KEY, DAPPIER_DATAMODEL_ID, and DAPPIER_AI_MODEL_API_KEY are set as Supabase Edge Function secrets.');
      } else if (errorMessage.includes('Authentication failed') || errorMessage.includes('API keys')) {
        toast.error('AI service authentication failed. Please check your API key configuration in Supabase.');
      } else if (errorMessage.includes('Service is busy')) {
        toast.error('AI service is busy. Please try again in a moment.');
      } else if (errorMessage.includes('Service temporarily unavailable')) {
        toast.error('AI service is temporarily unavailable. Please try again later.');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network error')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('Edge Function') || errorMessage.includes('FunctionsHttpError') || errorMessage.includes('non-2xx status code')) {
        toast.error('AI service configuration error. Please ensure the required environment variables (DAPPIER_API_KEY, DAPPIER_DATAMODEL_ID, DAPPIER_AI_MODEL_API_KEY) are set as Supabase Edge Function secrets.');
      } else {
        toast.error(`AI Chat Error: ${errorMessage}`);
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