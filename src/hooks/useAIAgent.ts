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

      // Create a wellness-focused prompt for the AI
      const wellnessPrompt = `You are MindMate AI, a compassionate and knowledgeable mental wellness companion. Your purpose is to:

1. Provide empathetic emotional support and practical wellness guidance
2. Help users understand and manage their mental health
3. Suggest evidence-based coping strategies and techniques
4. Encourage healthy habits and positive behavioral changes
5. Maintain a warm, supportive, and professional tone

Guidelines:
- Always validate the user's feelings and experiences
- Provide specific, actionable advice when appropriate
- Include examples and step-by-step guidance for techniques
- Ask thoughtful follow-up questions to better understand their needs
- Encourage professional help when appropriate
- Keep responses conversational and supportive

User's message: ${content}`;

      // Call the working dappier-query function instead of ai-agent
      const { data, error } = await supabase.functions.invoke('dappier-query', {
        body: { 
          query: wellnessPrompt,
        },
      });

      console.log('AI Agent response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Handle different types of errors with user-friendly messages
        let userMessage = 'Unable to get a response from AI Agent. Please try again.';
        
        if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
          userMessage = 'AI Agent is temporarily busy due to high demand. Please wait a moment and try again.';
        } else if (error.message?.includes('configuration') || error.message?.includes('API')) {
          userMessage = 'AI Agent service needs to be configured. Please check your API settings.';
        } else if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
          userMessage = 'Network error. Please check your connection and try again.';
        }
        
        toast.error(userMessage);
        throw new Error(`AI Agent error: ${error.message}`);
      }

      if (!data?.response) {
        console.error('Invalid response data:', data);
        toast.error('Invalid response from AI Agent. Please try again.');
        throw new Error('Invalid response from AI Agent');
      }

      // Add AI response to chat
      const aiMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
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