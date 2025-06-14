import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface DashboardData {
  currentMood: string;
  moodInterpretation: string;
  wellnessScore: number;
  lastUpdated: string;
}

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    currentMood: '😌',
    moodInterpretation: "You seem calm and balanced today. Your emotional stability has been consistent over the past week.",
    wellnessScore: 85,
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // For now, we'll use the default data
      // In a real implementation, you'd fetch this from a user_dashboard_data table
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
    }
  }, []);

  const updateMoodFromAI = useCallback(async (
    sentiment: string, 
    userMessage: string, 
    aiResponse: string
  ) => {
    try {
      // Analyze the user's message for mood indicators
      const moodAnalysis = analyzeMoodFromMessage(userMessage, sentiment);
      
      if (moodAnalysis.shouldUpdate) {
        const newDashboardData = {
          currentMood: moodAnalysis.mood,
          moodInterpretation: generateMoodInterpretation(moodAnalysis, aiResponse),
          wellnessScore: calculateWellnessScore(moodAnalysis.sentiment),
          lastUpdated: new Date().toISOString(),
        };

        setDashboardData(newDashboardData);
        
        // Show a subtle notification about the mood update
        toast.success(`Mood updated to ${moodAnalysis.mood} based on your conversation`, {
          duration: 3000,
          icon: moodAnalysis.mood,
        });
      }
    } catch (error) {
      console.error('Error updating mood from AI:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    isLoading,
    updateMoodFromAI,
    refreshDashboardData: fetchDashboardData,
  };
};

// Helper function to analyze mood from user message
function analyzeMoodFromMessage(message: string, sentiment: string) {
  const lowerMessage = message.toLowerCase();
  
  // Define mood indicators
  const moodIndicators = {
    happy: {
      keywords: ['happy', 'great', 'amazing', 'wonderful', 'excited', 'joy', 'fantastic', 'awesome', 'love', 'perfect'],
      emoji: '😊',
      sentiment: 'positive'
    },
    sad: {
      keywords: ['sad', 'depressed', 'down', 'upset', 'crying', 'hurt', 'disappointed', 'lonely', 'empty'],
      emoji: '😢',
      sentiment: 'negative'
    },
    angry: {
      keywords: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'irritated', 'rage', 'hate'],
      emoji: '😠',
      sentiment: 'negative'
    },
    anxious: {
      keywords: ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'overwhelmed', 'scared', 'afraid'],
      emoji: '😰',
      sentiment: 'negative'
    },
    calm: {
      keywords: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'centered', 'balanced'],
      emoji: '😌',
      sentiment: 'positive'
    },
    tired: {
      keywords: ['tired', 'exhausted', 'drained', 'weary', 'sleepy', 'fatigue'],
      emoji: '😴',
      sentiment: 'neutral'
    },
    confused: {
      keywords: ['confused', 'lost', 'uncertain', 'unclear', 'puzzled', 'mixed up'],
      emoji: '🤔',
      sentiment: 'neutral'
    }
  };

  // Check for direct mood statements
  const directMoodPatterns = [
    /i feel (.*)/,
    /i am (.*)/,
    /i'm (.*)/,
    /feeling (.*)/,
    /i've been (.*)/,
    /today i am (.*)/,
    /right now i feel (.*)/
  ];

  let detectedMood = null;
  let confidence = 0;

  // Check for direct mood statements first
  for (const pattern of directMoodPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const moodText = match[1];
      for (const [mood, indicators] of Object.entries(moodIndicators)) {
        if (indicators.keywords.some(keyword => moodText.includes(keyword))) {
          detectedMood = mood;
          confidence = 0.9;
          break;
        }
      }
      if (detectedMood) break;
    }
  }

  // If no direct statement, check for keyword presence
  if (!detectedMood) {
    for (const [mood, indicators] of Object.entries(moodIndicators)) {
      const keywordCount = indicators.keywords.filter(keyword => 
        lowerMessage.includes(keyword)
      ).length;
      
      if (keywordCount > 0) {
        const newConfidence = keywordCount / indicators.keywords.length;
        if (newConfidence > confidence) {
          detectedMood = mood;
          confidence = newConfidence;
        }
      }
    }
  }

  // Use sentiment as fallback
  if (!detectedMood && sentiment) {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        detectedMood = 'happy';
        confidence = 0.3;
        break;
      case 'negative':
        detectedMood = 'sad';
        confidence = 0.3;
        break;
      default:
        detectedMood = 'calm';
        confidence = 0.2;
    }
  }

  const shouldUpdate = confidence > 0.4; // Only update if we're reasonably confident

  return {
    mood: detectedMood ? moodIndicators[detectedMood as keyof typeof moodIndicators].emoji : '😐',
    moodName: detectedMood || 'neutral',
    sentiment: detectedMood ? moodIndicators[detectedMood as keyof typeof moodIndicators].sentiment : 'neutral',
    confidence,
    shouldUpdate
  };
}

// Generate mood interpretation based on analysis and AI response
function generateMoodInterpretation(moodAnalysis: any, aiResponse: string) {
  const interpretations = {
    happy: [
      "You're radiating positivity today! Your happiness is reflected in how you express yourself.",
      "It's wonderful to see you in such a great mood. Keep embracing those positive feelings!",
      "Your joyful energy is evident. This positive state can really boost your overall wellbeing."
    ],
    sad: [
      "I notice you're going through a difficult time. It's okay to feel sad - these emotions are valid.",
      "You seem to be processing some challenging feelings. Remember that it's normal to have ups and downs.",
      "Your emotional honesty shows strength. Acknowledging sadness is an important part of healing."
    ],
    angry: [
      "I can sense some frustration in your words. Anger often signals that something important to you needs attention.",
      "You're experiencing some intense emotions. It's healthy to acknowledge anger rather than suppress it.",
      "Your feelings of anger are valid. Let's work on understanding what's triggering these emotions."
    ],
    anxious: [
      "I notice some worry in your message. Anxiety can be overwhelming, but you're taking the right step by talking about it.",
      "You seem to be feeling anxious about something. Remember that anxiety is treatable and you're not alone.",
      "Your concerns are being heard. Anxiety often tries to protect us, even when it feels uncomfortable."
    ],
    calm: [
      "You seem centered and peaceful right now. This balanced state is wonderful for your mental wellbeing.",
      "There's a sense of tranquility in how you're expressing yourself today. Enjoy this peaceful moment.",
      "Your calm energy is evident. This balanced emotional state is great for reflection and growth."
    ],
    tired: [
      "You sound like you might be feeling drained. Rest and self-care are important for your wellbeing.",
      "Fatigue can affect our emotional state. Make sure you're getting enough rest and taking care of yourself.",
      "It seems like you might need some time to recharge. Listen to your body's signals."
    ],
    confused: [
      "You seem to be working through some uncertainty. It's okay not to have all the answers right now.",
      "Confusion often comes before clarity. You're in a process of figuring things out, and that's perfectly normal.",
      "Mixed feelings are completely valid. Sometimes we need time to sort through complex emotions."
    ]
  };

  const moodName = moodAnalysis.moodName;
  const moodInterpretations = interpretations[moodName as keyof typeof interpretations] || [
    "Your emotional state is being recognized and validated. Every feeling you have is important."
  ];

  // Select a random interpretation or use AI response context
  const randomInterpretation = moodInterpretations[Math.floor(Math.random() * moodInterpretations.length)];
  
  return randomInterpretation;
}

// Calculate wellness score based on sentiment
function calculateWellnessScore(sentiment: string): number {
  const baseScore = 75; // Base wellness score
  
  switch (sentiment) {
    case 'positive':
      return Math.min(95, baseScore + Math.floor(Math.random() * 15) + 5);
    case 'negative':
      return Math.max(45, baseScore - Math.floor(Math.random() * 15) - 10);
    default:
      return baseScore + Math.floor(Math.random() * 10) - 5;
  }
}