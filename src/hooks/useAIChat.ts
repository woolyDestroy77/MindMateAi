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

      console.log('Sending message to Dappier AI Agent:', { message: content, context });

      // Call Dappier AI service through Edge Function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          message: content,
          context,
        },
      });

      console.log('Dappier AI Agent response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Handle 429 (Too Many Requests) specifically
        if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
          console.log('Rate limit detected - 429 error');
          toast.error('AI service is temporarily busy due to high demand. Please wait a moment and try again.');
          throw new Error('Rate limit exceeded - please try again in a moment');
        }
        
        // Handle different types of errors with user-friendly messages
        let userMessage = 'Unable to get a response. Please try again.';
        let errorCode = 'UNKNOWN_ERROR';
        let errorDetails = error.message || 'Unknown error';
        
        try {
          // Parse error details from Edge Function response
          if (error.context?.body) {
            const errorBody = typeof error.context.body === 'string' 
              ? JSON.parse(error.context.body) 
              : error.context.body;
            
            console.log('Parsed error body:', errorBody);
            
            if (errorBody.error) {
              errorCode = errorBody.error;
              errorDetails = errorBody.details || errorBody.message || errorDetails;
            }
          }
          
          // Provide specific user messages based on error type
          switch (errorCode) {
            case 'QUOTA_EXCEEDED':
              userMessage = 'AI service has reached its usage limit. Please try again in a few minutes.';
              break;
            case 'AUTHENTICATION_ERROR':
              userMessage = 'AI service authentication failed. Please contact support.';
              break;
            case 'MODEL_NOT_FOUND':
              userMessage = 'AI model configuration error. Please contact support.';
              break;
            case 'NETWORK_ERROR':
              userMessage = 'Network error. Please check your connection and try again.';
              break;
            case 'SERVICE_ERROR':
              userMessage = 'AI service is experiencing issues. Please try again in a few minutes.';
              break;
            case 'EMPTY_RESPONSE':
              userMessage = 'AI service returned an empty response. Please try again.';
              break;
            default:
              // Handle legacy error messages for backward compatibility
              if (errorDetails.includes('429') || errorDetails.includes('quota') || errorDetails.includes('Too Many Requests')) {
                userMessage = 'AI service is temporarily busy due to high demand. Please wait a moment and try again.';
              } else if (errorDetails.includes('authentication') || errorDetails.includes('401')) {
                userMessage = 'AI service authentication failed. Please contact support.';
              } else if (errorDetails.includes('network') || errorDetails.includes('Failed to fetch')) {
                userMessage = 'Network error. Please check your connection and try again.';
              }
              break;
          }
          
          console.error('Dappier AI Agent error details:', { errorCode, errorDetails, originalError: error });
        } catch (parseError) {
          console.error('Error parsing Edge Function error details:', parseError);
          errorDetails = error.message || 'Unknown parsing error';
        }
        
        toast.error(userMessage);
        throw new Error(`Dappier AI Agent error: ${errorDetails}`);
      }

      console.log('Received data from Dappier AI Agent:', data);

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

      console.log('Successfully added AI message to chat');
      return aiMessage;
    } catch (error) {
      console.error('Error in AI chat:', error);
      
      // Remove the user's message if the AI response failed
      setMessages(prev => prev.slice(0, -1));
      
      // Only show toast if we haven't already shown one
      const errorMessage = error?.message || 'Unknown error';
      if (!errorMessage.includes('Dappier AI Agent error') && !errorMessage.includes('Rate limit exceeded')) {
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (errorMessage.includes('Invalid response')) {
          toast.error('Unable to get a valid response. Please try again.');
        } else if (errorMessage.includes('configuration') || errorMessage.includes('non-2xx')) {
          toast.error('AI service is experiencing issues. Please try again in a few minutes.');
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