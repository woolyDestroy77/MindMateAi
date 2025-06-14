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
}

export const useAIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // Fetch or create a chat session for the user
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error: userError } = await supabase.auth
          .getUser();
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        // Try to get the latest session for this user
        const { data: sessions, error: sessionError } = await supabase
          .from("dappier_chat_history")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (sessionError) {
          throw sessionError;
        }

        let session_id = sessions?.[0]?.id;
        // If no session, create one with initial welcome message
        if (!session_id) {
          const welcomeMessage =
            "Hi! I'm MindMate AI, your mental wellness companion. I'm here to listen, support, and help you explore ways to improve your emotional well-being. How are you feeling today?";
          const { data: newSession, error: createError } = await supabase
            .from("dappier_chat_history")
            .insert([{
              user_id: user.id,
              user_message: "Hello", // Initial user message to satisfy not-null constraint
              ai_response: welcomeMessage,
              widget_id: "wd_01jxpzftx6e3ntsgzwtgbze71c",
            }])
            .select()
            .single();
          if (createError) throw createError;
          session_id = newSession.id;
        }
        setSessionId(session_id);

        // Fetch all messages for this session
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
              id: msg.id,
              role: "user" as const,
              content: msg.user_message,
              timestamp: new Date(msg.created_at),
            },
            {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content: msg.ai_response,
              timestamp: new Date(msg.created_at),
            },
          ]);
          setMessages(formattedMessages);
        } else {
          // If no messages, show welcome message
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
      } catch (err: unknown) {
        const errorMsg = err instanceof Error
          ? err.message
          : "Failed to initialize chat";
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
        isInitialized.current = true;
      }
    };
    if (!isInitialized.current) initChat();
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setIsLoading(true);
        const { data: { user }, error: userError } = await supabase.auth
          .getUser();
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");
        if (!sessionId) throw new Error("No chat session");

        // Add user message to chat
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

        // Add AI response to chat
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response.message,
          sentiment: data.sentiment,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Save conversation to DB
        const { error: saveError } = await supabase
          .from("dappier_chat_history")
          .insert({
            user_id: user.id,
            user_message: content,
            ai_response: data.response.message,
            widget_id: "wd_01jxpzftx6e3ntsgzwtgbze71c",
          });
        if (saveError) throw saveError;

        return aiMessage;
      } catch (error: unknown) {
        setMessages((prev) => prev.slice(0, -1)); // Remove user message if failed
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

  return {
    messages,
    isLoading,
    sendMessage,
  };
};
