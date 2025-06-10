// AI Chat functionality has been removed
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sentiment?: string;
}

export const useAIChat = () => {
  return {
    messages: [],
    isLoading: false,
    sendMessage: async () => {
      throw new Error('AI Chat functionality has been removed');
    },
  };
};