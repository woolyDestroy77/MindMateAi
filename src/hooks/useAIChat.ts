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

export const useAIChat = (sessionId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef<string | null>(null);

  // Fetch messages for current session
  useEffect(() => {
    const initChat = async () => {
      if (!sessionId || isInitialized.current === sessionId) return;

      try {
        setIsLoading(true);
        const { data: { user }, error: userError } = await supabase.auth
          .getUser();
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        // Fetch messages for this specific session
        const { data: dbMessages, error: fetchError } = await supabase
          .from("dappier_chat_history")
          .select("id, user_message, ai_response, created_at")
          .eq("user_id", user.id)
          .eq("session_id", sessionId)
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
        } else {
          // Show welcome message for new sessions
          setMessages([
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                "Hi! I'm MindMate AI, your mental wellness companion. I'm here to listen, support, and help you explore ways to improve your emotional well-being. How are you feeling today?",
              timestamp: new Date(),
            },
          ]);
        }
        
        isInitialized.current = sessionId;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error
          ? err.message
          : "Failed to initialize chat";
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    // Reset messages immediately when session changes
    if (sessionId !== isInitialized.current) {
      setMessages([]);
      isInitialized.current = null;
    }

    initChat();
  }, [sessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId) {
        toast.error("No active chat session");
        return;
      }

      try {
        setIsLoading(true);
        const { data: { user }, error: userError } = await supabase.auth
          .getUser();
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        // Add user message to chat immediately
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Prepare context from previous messages (last 10 messages)
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

        // Add AI response to chat
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseContent,
          sentiment: data.sentiment,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Save conversation to DB with session_id
        const { error: saveError } = await supabase
          .from("dappier_chat_history")
          .insert({
            user_id: user.id,
            session_id: sessionId,
            user_message: content,
            ai_response: responseContent,
            widget_id: "wd_01jxpzftx6e3ntsgzwtgbze71c",
          });
        if (saveError) throw saveError;

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
    [messages, sessionId],
  );

  const sendVoiceMessage = useCallback(
    async (audioUrl: string, transcript: string, duration: number) => {
      if (!sessionId) {
        toast.error("No active chat session");
        return;
      }

      try {
        setIsLoading(true);
        const { data: { user }, error: userError } = await supabase.auth
          .getUser();
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

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

        // Prepare context from previous messages (last 10 messages)
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

        // Add AI response to chat
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseContent,
          sentiment: data.sentiment,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Save conversation to DB with session_id (save the transcript as the message)
        const { error: saveError } = await supabase
          .from("dappier_chat_history")
          .insert({
            user_id: user.id,
            session_id: sessionId,
            user_message: transcript,
            ai_response: responseContent,
            widget_id: "wd_01jxpzftx6e3ntsgzwtgbze71c",
          });
        if (saveError) throw saveError;

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
    [messages, sessionId],
  );

  return {
    messages,
    isLoading,
    sendMessage,
    sendVoiceMessage,
  };
};