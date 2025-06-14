import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface DappierChatMessage {
  id: string;
  user_message: string;
  ai_response: string;
  timestamp: Date;
  widget_id: string;
}

export const useDappierChat = () => {
  const saveChatMessage = useCallback(async (userMessage: string, aiResponse: string) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) return; // Don't save if user is not authenticated

      const { error } = await supabase
        .from('dappier_chat_history')
        .insert([
          {
            user_id: user.id,
            user_message: userMessage,
            ai_response: aiResponse,
            widget_id: 'wd_01jxpzftx6e3ntsgzwtgbze71c',
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      console.log('Dappier chat message saved successfully');
    } catch (err) {
      console.error('Failed to save Dappier chat message:', err);
      // Don't show error toast to avoid interrupting user experience
    }
  }, []);

  const setupWidgetListeners = useCallback(() => {
    // Listen for custom events from the Dappier widget
    const handleWidgetMessage = (event: CustomEvent) => {
      if (event.detail && event.detail.userMessage && event.detail.aiResponse) {
        saveChatMessage(event.detail.userMessage, event.detail.aiResponse);
      }
    };

    // Listen for DOM mutations to detect new messages
    const observeWidgetMessages = () => {
      const widgetContainer = document.getElementById('dappier-ask-ai-widget');
      if (!widgetContainer) return;

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // Look for new message elements
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Try to extract message content (this may need adjustment based on widget structure)
                const userMessages = element.querySelectorAll('[data-role="user"], .user-message, .message-user');
                const aiMessages = element.querySelectorAll('[data-role="assistant"], .ai-message, .message-ai');
                
                if (userMessages.length > 0 && aiMessages.length > 0) {
                  const lastUserMessage = userMessages[userMessages.length - 1]?.textContent?.trim();
                  const lastAiMessage = aiMessages[aiMessages.length - 1]?.textContent?.trim();
                  
                  if (lastUserMessage && lastAiMessage) {
                    saveChatMessage(lastUserMessage, lastAiMessage);
                  }
                }
              }
            });
          }
        });
      });

      observer.observe(widgetContainer, {
        childList: true,
        subtree: true,
      });

      return observer;
    };

    // Set up event listeners
    document.addEventListener('dappier-message', handleWidgetMessage as EventListener);
    
    // Set up DOM observer as fallback
    const observer = observeWidgetMessages();

    return () => {
      document.removeEventListener('dappier-message', handleWidgetMessage as EventListener);
      observer?.disconnect();
    };
  }, [saveChatMessage]);

  useEffect(() => {
    // Wait for widget to load
    const timer = setTimeout(() => {
      setupWidgetListeners();
    }, 2000);

    return () => clearTimeout(timer);
  }, [setupWidgetListeners]);

  return {
    saveChatMessage,
  };
};