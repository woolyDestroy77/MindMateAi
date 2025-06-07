export type Emotion = 'calm' | 'anxious' | 'happy' | 'sad' | 'angry' | 'neutral';

export interface User {
  id: string;
  name: string;
  email: string;
  preferredLanguage: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  emotion?: Emotion;
  voiceUrl?: string;
}

export interface JournalEntry {
  id: string;
  date: Date;
  content: string;
  emotion: Emotion;
  tags: string[];
}

export interface EmotionData {
  date: Date;
  emotion: Emotion;
  intensity: number; // 1-10
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  emotion: Emotion;
  avatar?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: 'general' | 'technical' | 'privacy' | 'support';
}