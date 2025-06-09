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

      console.log('Sending message to Edge Function:', { message: content, context });

      // Call AI service through Edge Function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          message: content,
          context,
        },
      });

      console.log('Edge Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Handle different types of errors with user-friendly messages
        let userMessage = 'Unable to get a response. Please try again.';
        let errorCode = 'UNKNOWN_ERROR';
        let errorDetails = error.message || 'Unknown error';
        let shouldRetry = false;
        
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
              
              // Show configuration instructions if available
              if (errorBody.instructions && Array.isArray(errorBody.instructions)) {
                console.log('Configuration instructions:', errorBody.instructions);
                const instructionText = errorBody.instructions.join('\n');
                console.log('Please follow these steps to configure your API keys:\n' + instructionText);
              }
            }
          }
          
          // Check for specific error patterns in the message
          if (error.message?.includes('non-2xx status code')) {
            // This indicates the Edge Function returned an error status
            errorCode = 'EDGE_FUNCTION_ERROR';
            errorDetails = 'Edge Function returned an error status code';
          }
          
          // Provide specific user messages based on error type
          switch (errorCode) {
            case 'QUOTA_EXCEEDED':
              userMessage = '🕒 The AI service has reached its rate limit. Please wait 2-3 minutes and try again.';
              shouldRetry = true;
              break;
            case 'API_CONFIGURATION_ERROR':
              userMessage = 'AI service needs to be configured. Please check the browser console for setup instructions, or contact support.';
              break;
            case 'AUTHENTICATION_ERROR':
              userMessage = 'AI service authentication failed. Please check your API key configuration or contact support.';
              break;
            case 'SERVICE_UNAVAILABLE':
            case 'SERVICE_ERROR':
              userMessage = '⏳ AI service is temporarily unavailable due to high demand. Please wait 2-3 minutes and try again.';
              shouldRetry = true;
              break;
            case 'INTERNAL_ERROR':
              userMessage = 'An unexpected error occurred. Please try again.';
              shouldRetry = true;
              break;
            case 'EDGE_FUNCTION_ERROR':
              // This is likely a rate limit or service overload
              userMessage = '⏳ AI service is experiencing high demand and rate limits. Please wait 2-3 minutes before trying again.';
              shouldRetry = true;
              break;
            default:
              // Handle legacy error messages and common patterns
              if (errorDetails.includes('429') || errorDetails.includes('quota') || errorDetails.includes('Too Many Requests') || errorDetails.includes('rate limit')) {
                userMessage = '🕒 AI service rate limit reached. Please wait 2-3 minutes and try again.';
                shouldRetry = true;
              } else if (errorDetails.includes('DAPPIER_API_KEY') || errorDetails.includes('OPENAI_API_KEY') || errorDetails.includes('API configuration')) {
                userMessage = 'AI service needs to be configured. Please check the browser console for setup instructions, or contact support.';
              } else if (errorDetails.includes('authentication') || errorDetails.includes('401')) {
                userMessage = 'AI service authentication failed. Please check your API key configuration or contact support.';
              } else if (errorDetails.includes('network') || errorDetails.includes('Failed to fetch')) {
                userMessage = 'Network error. Please check your connection and try again.';
                shouldRetry = true;
              } else if (errorDetails.includes('non-2xx status code')) {
                userMessage = '⏳ AI service is experiencing high demand. This is likely due to rate limits. Please wait 2-3 minutes and try again.';
                shouldRetry = true;
              }
              break;
          }
          
          console.error('Edge Function error details:', { errorCode, errorDetails, originalError: error, shouldRetry });
        } catch (parseError) {
          console.error('Error parsing Edge Function error details:', parseError);
          errorDetails = error.message || 'Unknown parsing error';
          userMessage = '⏳ AI service is experiencing issues. Please wait a few minutes and try again.';
          shouldRetry = true;
        }
        
        // Show appropriate toast message
        if (shouldRetry) {
          toast.error(userMessage, {
            duration: 6000, // Show longer for retry messages
            icon: '⏳',
          });
        } else {
          toast.error(userMessage);
        }
        
        throw new Error(`Edge function error: ${errorDetails}`);
      }

      console.log('Received data from Edge Function:', data);

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
      if (!errorMessage.includes('Edge function error')) {
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (errorMessage.includes('Invalid response')) {
          toast.error('Unable to get a valid response. Please try again.');
        } else if (errorMessage.includes('configuration') || errorMessage.includes('non-2xx')) {
          toast.error('⏳ AI service is experiencing high demand. Please wait 2-3 minutes and try again.', {
            duration: 6000,
            icon: '⏳',
          });
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