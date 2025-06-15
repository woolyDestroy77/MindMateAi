import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sentiment?: string;
  context?: unknown;
  isVoiceMessage?: boolean;
  audioUrl?: string;
  audioDuration?: number;
}

export const useAIChat = (sessionId?: string, onMoodUpdate?: (sentiment: string, userMessage: string, aiResponse: string) => void) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef<string | null>(null);

  // For single daily chat, we use a consistent session approach
  const DAILY_SESSION_ID = sessionId || "daily-health-chat";

  // Fetch messages for the daily chat session
  useEffect(() => {
    const initChat = async () => {
      if (isInitialized.current === DAILY_SESSION_ID) return;

      try {
        setIsLoading(true);
        const { data: { user }, error: userError } = await supabase.auth
          .getUser();
        if (userError) throw userError;
        if (!user) {
          // Clear any stale session data and sign out
          await supabase.auth.signOut();
          throw new Error("Your session has expired or is invalid. Please sign in again.");
        }

        console.log('Initializing daily chat for user:', user.id);

        // Fetch ALL messages for this user (daily chat approach)
        const { data: dbMessages, error: fetchError } = await supabase
          .from("dappier_chat_history")
          .select("id, user_message, ai_response, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;

        if (dbMessages && dbMessages.length > 0) {
          const formattedMessages = dbMessages.flatMap((msg: {
            id: string;
            user_message: string;
            ai_response: string;
            created_at: string;
          }) => [
            {
              id: `${msg.id}-user`,
              role: "user" as const,
              content: msg.user_message,
              timestamp: new Date(msg.created_at),
            },
            {
              id: `${msg.id}-assistant`,
              role: "assistant" as const,
              content: msg.ai_response,
              timestamp: new Date(msg.created_at),
            },
          ]);
          setMessages(formattedMessages);
          console.log(`Loaded ${formattedMessages.length} messages from chat history`);
        } else {
          // Show welcome message for new users
          setMessages([
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                "Welcome to your daily wellness chat! 🌟 I'm here to support your mental health journey. Share how you're feeling today, any thoughts on your mind, or simply check in with your emotional state. Every message helps me understand your wellness patterns better and provide personalized support. How are you doing today?",
              timestamp: new Date(),
            },
          ]);
        }
        
        isInitialized.current = DAILY_SESSION_ID;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error
          ? err.message
          : "Failed to initialize daily chat";
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    // Reset messages immediately when session changes
    if (DAILY_SESSION_ID !== isInitialized.current) {
      setMessages([]);
      isInitialized.current = null;
    }

    initChat();
  }, [DAILY_SESSION_ID]);

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setIsLoading(true);
        const { data: { user }, error: userError } = await supabase.auth
          .getUser();
        if (userError) throw userError;
        if (!user) {
          // Clear any stale session data and sign out
          await supabase.auth.signOut();
          throw new Error("Your session has expired or is invalid. Please sign in again.");
        }

        console.log('=== SENDING DAILY WELLNESS MESSAGE ===');
        console.log('User message:', content);
        console.log('onMoodUpdate callback available:', !!onMoodUpdate);

        // Add user message to chat immediately
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Prepare context from recent messages (last 10 messages)
        const context = messages.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Call Dappier AI service through Edge Function
        const { data, error } = await supabase.functions.invoke("chat", {
          body: {
            message: content,
            context,
          },
        });

        if (error) {
          toast.error(
            "AI service error: " + (error.message || "Unknown error"),
          );
          throw error;
        }
        if (!data?.response) {
          toast.error("Invalid response from AI service. Please try again.");
          throw new Error("Invalid response from AI service");
        }

        // Extract the response content
        const responseContent = typeof data.response === 'string' 
          ? data.response 
          : data.response.message || data.response;

        console.log('AI response received:', responseContent);
        console.log('Sentiment detected:', data.sentiment);

        // Add AI response to chat
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseContent,
          sentiment: data.sentiment,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Save conversation to DB (without session_id for daily chat)
        const { error: saveError } = await supabase
          .from("dappier_chat_history")
          .insert({
            user_id: user.id,
            user_message: content,
            ai_response: responseContent,
            widget_id: "wd_01jxpzftx6e3ntsgzwtgbze71c",
          });
        if (saveError) throw saveError;

        // CRITICAL: Trigger mood update callback if provided
        if (onMoodUpdate && data.sentiment) {
          console.log('=== TRIGGERING MOOD UPDATE ===');
          console.log('Calling onMoodUpdate with:', {
            sentiment: data.sentiment,
            userMessage: content,
            aiResponse: responseContent
          });
          
          try {
            await onMoodUpdate(data.sentiment, content, responseContent);
            console.log('Mood update callback completed successfully');
          } catch (moodError) {
            console.error('Error in mood update callback:', moodError);
            // Don't throw here, just log the error
          }
        } else {
          console.log('Mood update skipped:', {
            hasCallback: !!onMoodUpdate,
            hasSentiment: !!data.sentiment,
            sentiment: data.sentiment
          });
        }

        return aiMessage;
      } catch (error: unknown) {
        // Remove the user message if sending failed
        setMessages((prev) => prev.slice(0, -1));
        const errorMsg = error instanceof Error
          ? error.message
          : "Failed to send message";
        toast.error(errorMsg);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [messages, onMoodUpdate],
  );

  const sendVoiceMessage = useCallback(
    async (audioUrl: string, transcript: string, duration: number) => {
      try {
        setIsLoading(true);
        const { data: { user }, error: userError } = await supabase.auth
          .getUser();
        if (userError) throw userError;
        if (!user) {
          // Clear any stale session data and sign out
          await supabase.auth.signOut();
          throw new Error("Your session has expired or is invalid. Please sign in again.");
        }

        console.log('=== SENDING VOICE WELLNESS MESSAGE ===');
        console.log('Voice transcript:', transcript);
        console.log('onMoodUpdate callback available:', !!onMoodUpdate);

        // Add voice message to chat immediately
        const voiceMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content: transcript, // This will be used for AI processing
          timestamp: new Date(),
          isVoiceMessage: true,
          audioUrl: audioUrl,
          audioDuration: duration,
        };
        setMessages((prev) => [...prev, voiceMessage]);

        // Prepare context from recent messages (last 10 messages)
        const context = messages.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Call Dappier AI service with the transcript
        const { data, error } = await supabase.functions.invoke("chat", {
          body: {
            message: transcript,
            context,
          },
        });

        if (error) {
          toast.error(
            "AI service error: " + (error.message || "Unknown error"),
          );
          throw error;
        }
        if (!data?.response) {
          toast.error("Invalid response from AI service. Please try again.");
          throw new Error("Invalid response from AI service");
        }

        // Extract the response content
        const responseContent = typeof data.response === 'string' 
          ? data.response 
          : data.response.message || data.response;

        console.log('AI response to voice message:', responseContent);
        console.log('Sentiment detected:', data.sentiment);

        // Add AI response to chat
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseContent,
          sentiment: data.sentiment,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Save conversation to DB (save the transcript as the message)
        const { error: saveError } = await supabase
          .from("dappier_chat_history")
          .insert({
            user_id: user.id,
            user_message: transcript,
            ai_response: responseContent,
            widget_id: "wd_01jxpzftx6e3ntsgzwtgbze71c",
          });
        if (saveError) throw saveError;

        // CRITICAL: Trigger mood update callback if provided
        if (onMoodUpdate && data.sentiment) {
          console.log('=== TRIGGERING MOOD UPDATE FROM VOICE ===');
          console.log('Calling onMoodUpdate with:', {
            sentiment: data.sentiment,
            userMessage: transcript,
            aiResponse: responseContent
          });
          
          try {
            await onMoodUpdate(data.sentiment, transcript, responseContent);
            console.log('Voice mood update callback completed successfully');
          } catch (moodError) {
            console.error('Error in voice mood update callback:', moodError);
            // Don't throw here, just log the error
          }
        } else {
          console.log('Voice mood update skipped:', {
            hasCallback: !!onMoodUpdate,
            hasSentiment: !!data.sentiment,
            sentiment: data.sentiment
          });
        }

        return aiMessage;
      } catch (error: unknown) {
        // Remove the voice message if sending failed
        setMessages((prev) => prev.slice(0, -1));
        const errorMsg = error instanceof Error
          ? error.message
          : "Failed to send voice message";
        toast.error(errorMsg);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [messages, onMoodUpdate],
  );

  const deleteChatHistory = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        // Clear any stale session data and sign out
        await supabase.auth.signOut();
        throw new Error("Your session has expired or is invalid. Please sign in again.");
      }

      console.log('=== DELETING CHAT HISTORY ===');
      console.log('User ID:', user.id);

      // Delete all chat history for this user
      const { error: deleteError } = await supabase
        .from("dappier_chat_history")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      // Clear local messages and show "start new chat" message
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "🆕 **Start a new chat!** Your previous conversation history has been cleared. I'm ready to begin a fresh wellness journey with you. Share how you're feeling today, any thoughts on your mind, or simply tell me what's going on in your life. Every new conversation helps me better understand and support your mental wellness. What would you like to talk about?",
          timestamp: new Date(),
        },
      ]);

      console.log('Chat history deleted successfully');
      toast.success('Chat history cleared! Ready for a fresh start.');

    } catch (error: unknown) {
      const errorMsg = error instanceof Error
        ? error.message
        : "Failed to delete chat history";
      console.error('Error deleting chat history:', error);
      toast.error(errorMsg);
      throw error;
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    sendVoiceMessage,
    deleteChatHistory,
  };
};