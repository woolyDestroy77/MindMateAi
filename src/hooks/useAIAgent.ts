import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useAIAgent = () => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);

      // Add user message to chat
      const userMessage: AgentMessage = {
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

      console.log('Sending message to AI Agent:', { message: content, context });

      // Call the ai-agent function with proper parameters
      const { data, error } = await supabase.functions.invoke('ai-agent', {
        body: { 
          query: content,
          context: context,
        },
      });

      console.log('AI Agent response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Extract detailed error information from error.context if available
        let userMessage = 'Unable to get a response from AI Agent. Please try again.';
        let specificError = null;
        
        // Check if error.context contains the detailed error response from Edge Function
        if (error.context && typeof error.context === 'object') {
          specificError = error.context.error || error.context.message;
          console.log('Detailed error from Edge Function:', error.context);
        }
        
        // Handle different types of errors with user-friendly messages
        if (specificError === 'API_CONFIGURATION_ERROR' || error.message?.includes('configuration') || error.message?.includes('API')) {
          userMessage = 'AI Agent service needs to be configured. Please set up your DAPPIER_API_KEY in Supabase Edge Functions settings.';
        } else if (specificError === 'AUTHENTICATION_ERROR' || error.message?.includes('AUTHENTICATION_ERROR')) {
          userMessage = 'AI Agent authentication failed. Please check your API key configuration.';
        } else if (specificError === 'QUOTA_EXCEEDED' || error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('QUOTA_EXCEEDED')) {
          userMessage = 'AI service is temporarily unavailable due to usage limits. Please try again later.';
        } else if (specificError === 'INVALID_QUERY' || error.message?.includes('INVALID_QUERY')) {
          userMessage = 'Invalid message format. Please try again.';
        } else if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
          userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.context && error.context.message) {
          // Use the specific message from the Edge Function if available
          userMessage = error.context.message;
        }
        
        toast.error(userMessage);
        throw new Error(`AI Agent error: ${specificError || error.message}`);
      }

      // Handle the Dappier API response format
      let aiResponseContent = '';
      
      if (data?.error) {
        // Handle error responses from the Edge Function
        console.error('Edge Function returned error:', data);
        
        let errorMessage = 'AI service encountered an error. Please try again.';
        
        if (data.error === 'API_CONFIGURATION_ERROR') {
          errorMessage = 'AI Agent service needs to be configured. Please set up your DAPPIER_API_KEY in Supabase Edge Functions settings.';
        } else if (data.error === 'AUTHENTICATION_ERROR') {
          errorMessage = 'AI Agent authentication failed. Please check your API key configuration.';
        } else if (data.error === 'QUOTA_EXCEEDED') {
          errorMessage = 'AI service is temporarily unavailable due to usage limits. Please try again later.';
        } else if (data.error === 'INVALID_QUERY') {
          errorMessage = 'Invalid message format. Please try again.';
        }
        
        toast.error(errorMessage);
        throw new Error(`AI Agent error: ${data.message || data.error}`);
      }

      // Extract response from Dappier API format
      if (data?.choices && data.choices.length > 0 && data.choices[0].message?.content) {
        aiResponseContent = data.choices[0].message.content;
      } else if (data?.response) {
        // Fallback for different response format
        aiResponseContent = data.response;
      } else if (data?.message) {
        // Another possible format
        aiResponseContent = data.message;
      } else {
        console.error('Invalid response data format:', data);
        toast.error('Invalid response from AI Agent. Please try again.');
        throw new Error('Invalid response format from AI Agent');
      }

      if (!aiResponseContent || aiResponseContent.trim().length === 0) {
        console.error('Empty response content:', data);
        toast.error('Received empty response from AI Agent. Please try again.');
        throw new Error('Empty response from AI Agent');
      }

      // Add AI response to chat
      const aiMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponseContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      console.log('Successfully added AI Agent message to chat');
      return aiMessage;
    } catch (error) {
      console.error('Error in AI Agent chat:', error);
      
      // Remove the user's message if the AI response failed
      setMessages(prev => prev.slice(0, -1));
      
      // Only show toast if we haven't already shown one
      const errorMessage = error?.message || 'Unknown error';
      if (!errorMessage.includes('AI Agent error')) {
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (errorMessage.includes('Invalid response')) {
          toast.error('Unable to get a valid response. Please try again.');
        } else {
          toast.error('Unable to get a response from AI Agent. Please try again.');
        }
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
  };
};