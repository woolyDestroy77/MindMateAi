import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface DashboardData {
  currentMood: string;
  moodName: string;
  moodInterpretation: string;
  wellnessScore: number;
  sentiment: string;
  lastUpdated: string;
  lastMessage?: string;
  aiResponse?: string;
}

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    currentMood: '😌',
    moodName: 'calm',
    moodInterpretation: "Loading your mood data...",
    wellnessScore: 75,
    sentiment: 'neutral',
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setIsLoading(false);
        return;
      }

      console.log('Fetching dashboard data for user:', user.id);

      // Fetch user mood data from Supabase
      const { data: moodData, error: moodError } = await supabase
        .from('user_mood_data')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (moodError && moodError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching mood data:', moodError);
        throw moodError;
      }

      if (moodData) {
        console.log('Fetched mood data:', moodData);
        const fetchedData: DashboardData = {
          currentMood: moodData.current_mood,
          moodName: moodData.mood_name,
          moodInterpretation: moodData.mood_interpretation,
          wellnessScore: moodData.wellness_score,
          sentiment: moodData.sentiment,
          lastUpdated: moodData.updated_at,
          lastMessage: moodData.last_message,
          aiResponse: moodData.ai_response,
        };
        setDashboardData(fetchedData);
      } else {
        console.log('No mood data found, creating default entry');
        // Create default mood data for new user
        const defaultData = {
          user_id: user.id,
          current_mood: '😌',
          mood_name: 'calm',
          mood_interpretation: 'Welcome to MindMate AI! Your mood will be tracked automatically as you chat with our AI.',
          wellness_score: 75,
          sentiment: 'neutral',
        };

        const { data: newMoodData, error: insertError } = await supabase
          .from('user_mood_data')
          .insert([defaultData])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default mood data:', insertError);
          throw insertError;
        }

        console.log('Created default mood data:', newMoodData);
        setDashboardData({
          currentMood: newMoodData.current_mood,
          moodName: newMoodData.mood_name,
          moodInterpretation: newMoodData.mood_interpretation,
          wellnessScore: newMoodData.wellness_score,
          sentiment: newMoodData.sentiment,
          lastUpdated: newMoodData.updated_at,
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
      toast.error('Failed to load dashboard data');
    }
  }, []);

  const updateMoodFromAI = useCallback(async (
    sentiment: string, 
    userMessage: string, 
    aiResponse: string
  ) => {
    try {
      console.log('Updating mood from AI:', { sentiment, userMessage });
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        console.error('No user found for mood update');
        return;
      }

      // Analyze the user's message for mood indicators
      const moodAnalysis = analyzeMoodFromMessage(userMessage, sentiment);
      
      console.log('Mood analysis result:', moodAnalysis);
      
      if (moodAnalysis.shouldUpdate) {
        const newMoodData = {
          current_mood: moodAnalysis.mood,
          mood_name: moodAnalysis.moodName,
          mood_interpretation: generateMoodInterpretation(moodAnalysis, aiResponse),
          wellness_score: calculateWellnessScore(moodAnalysis.sentiment, dashboardData.wellnessScore),
          sentiment: moodAnalysis.sentiment,
          last_message: userMessage,
          ai_response: aiResponse,
          updated_at: new Date().toISOString(),
        };

        console.log('Updating mood data in Supabase:', newMoodData);
        
        // Update or insert mood data in Supabase
        const { data: updatedData, error: updateError } = await supabase
          .from('user_mood_data')
          .upsert([{
            user_id: user.id,
            ...newMoodData,
          }], {
            onConflict: 'user_id'
          })
          .select()
          .single();

        if (updateError) {
          console.error('Error updating mood data:', updateError);
          throw updateError;
        }

        console.log('Successfully updated mood data:', updatedData);

        // Update local state
        const newDashboardData: DashboardData = {
          currentMood: updatedData.current_mood,
          moodName: updatedData.mood_name,
          moodInterpretation: updatedData.mood_interpretation,
          wellnessScore: updatedData.wellness_score,
          sentiment: updatedData.sentiment,
          lastUpdated: updatedData.updated_at,
          lastMessage: updatedData.last_message,
          aiResponse: updatedData.ai_response,
        };

        setDashboardData(newDashboardData);
        
        // Show a subtle notification about the mood update
        toast.success(`Mood updated to ${moodAnalysis.mood} based on your conversation`, {
          duration: 4000,
          icon: moodAnalysis.mood,
        });
      } else {
        console.log('Mood update skipped - confidence too low:', moodAnalysis.confidence);
      }
    } catch (error) {
      console.error('Error updating mood from AI:', error);
      toast.error('Failed to update mood data');
    }
  }, [dashboardData.wellnessScore]);

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
      keywords: ['happy', 'great', 'amazing', 'wonderful', 'excited', 'joy', 'fantastic', 'awesome', 'love', 'perfect', 'good', 'excellent', 'brilliant', 'cheerful', 'delighted', 'thrilled', 'elated', 'overjoyed'],
      emoji: '😊',
      sentiment: 'positive'
    },
    sad: {
      keywords: ['sad', 'depressed', 'down', 'upset', 'crying', 'hurt', 'disappointed', 'lonely', 'empty', 'miserable', 'heartbroken', 'devastated', 'gloomy', 'blue', 'melancholy', 'sorrowful'],
      emoji: '😢',
      sentiment: 'negative'
    },
    angry: {
      keywords: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'irritated', 'rage', 'hate', 'pissed', 'livid', 'outraged', 'enraged', 'irate', 'fuming', 'incensed'],
      emoji: '😠',
      sentiment: 'negative'
    },
    anxious: {
      keywords: ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'overwhelmed', 'scared', 'afraid', 'tense', 'uneasy', 'restless', 'troubled', 'concerned', 'apprehensive'],
      emoji: '😰',
      sentiment: 'negative'
    },
    calm: {
      keywords: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'centered', 'balanced', 'zen', 'composed', 'content', 'mellow', 'placid'],
      emoji: '😌',
      sentiment: 'positive'
    },
    tired: {
      keywords: ['tired', 'exhausted', 'drained', 'weary', 'sleepy', 'fatigue', 'worn out', 'depleted', 'spent', 'burned out'],
      emoji: '😴',
      sentiment: 'neutral'
    },
    confused: {
      keywords: ['confused', 'lost', 'uncertain', 'unclear', 'puzzled', 'mixed up', 'bewildered', 'perplexed', 'baffled'],
      emoji: '🤔',
      sentiment: 'neutral'
    },
    excited: {
      keywords: ['excited', 'thrilled', 'pumped', 'energetic', 'enthusiastic', 'eager', 'hyped', 'stoked', 'amped'],
      emoji: '🤩',
      sentiment: 'positive'
    }
  };

  // Check for direct mood statements with more patterns
  const directMoodPatterns = [
    /i feel (.*)/,
    /i am (.*)/,
    /i'm (.*)/,
    /feeling (.*)/,
    /i've been (.*)/,
    /today i am (.*)/,
    /right now i feel (.*)/,
    /i'm so (.*)/,
    /i feel really (.*)/,
    /i'm feeling (.*)/,
    /currently feeling (.*)/,
    /i'm quite (.*)/,
    /i'm very (.*)/,
    /i feel pretty (.*)/,
    /i feel like (.*)/,
    /i'm getting (.*)/,
    /i'm becoming (.*)/
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

  // If no direct statement, check for keyword presence with weighted scoring
  if (!detectedMood) {
    let bestMood = null;
    let bestScore = 0;
    
    for (const [mood, indicators] of Object.entries(moodIndicators)) {
      const keywordMatches = indicators.keywords.filter(keyword => 
        lowerMessage.includes(keyword)
      );
      
      if (keywordMatches.length > 0) {
        // Weight the score based on number of matches and keyword strength
        const score = keywordMatches.length * 0.4 + (keywordMatches.length / indicators.keywords.length) * 0.6;
        if (score > bestScore) {
          bestMood = mood;
          bestScore = score;
        }
      }
    }
    
    if (bestMood && bestScore > 0.15) {
      detectedMood = bestMood;
      confidence = Math.min(bestScore, 0.8);
    }
  }

  // Use sentiment as fallback with higher confidence for clear sentiment
  if (!detectedMood && sentiment) {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        detectedMood = 'happy';
        confidence = 0.5;
        break;
      case 'negative':
        detectedMood = 'sad';
        confidence = 0.5;
        break;
      default:
        detectedMood = 'calm';
        confidence = 0.3;
    }
  }

  // Lower the threshold for updates to be more responsive
  const shouldUpdate = confidence > 0.2;

  console.log('Mood analysis:', {
    message: lowerMessage,
    detectedMood,
    confidence,
    shouldUpdate,
    sentiment
  });

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
      "Your joyful energy is evident. This positive state can really boost your overall wellbeing.",
      "Your positive outlook is shining through. This is a great foundation for mental wellness."
    ],
    sad: [
      "I notice you're going through a difficult time. It's okay to feel sad - these emotions are valid.",
      "You seem to be processing some challenging feelings. Remember that it's normal to have ups and downs.",
      "Your emotional honesty shows strength. Acknowledging sadness is an important part of healing.",
      "You're experiencing some tough emotions right now. This awareness is the first step toward feeling better."
    ],
    angry: [
      "I can sense some frustration in your words. Anger often signals that something important to you needs attention.",
      "You're experiencing some intense emotions. It's healthy to acknowledge anger rather than suppress it.",
      "Your feelings of anger are valid. Let's work on understanding what's triggering these emotions.",
      "There's some fire in your emotions today. Anger can be a powerful motivator when channeled constructively."
    ],
    anxious: [
      "I notice some worry in your message. Anxiety can be overwhelming, but you're taking the right step by talking about it.",
      "You seem to be feeling anxious about something. Remember that anxiety is treatable and you're not alone.",
      "Your concerns are being heard. Anxiety often tries to protect us, even when it feels uncomfortable.",
      "There's some tension in your thoughts today. Recognizing anxiety is an important step in managing it."
    ],
    calm: [
      "You seem centered and peaceful right now. This balanced state is wonderful for your mental wellbeing.",
      "There's a sense of tranquility in how you're expressing yourself today. Enjoy this peaceful moment.",
      "Your calm energy is evident. This balanced emotional state is great for reflection and growth.",
      "You're in a beautifully balanced state today. This inner peace is a valuable resource."
    ],
    tired: [
      "You sound like you might be feeling drained. Rest and self-care are important for your wellbeing.",
      "Fatigue can affect our emotional state. Make sure you're getting enough rest and taking care of yourself.",
      "It seems like you might need some time to recharge. Listen to your body's signals.",
      "Your energy levels seem low today. Remember that rest is productive and necessary."
    ],
    confused: [
      "You seem to be working through some uncertainty. It's okay not to have all the answers right now.",
      "Confusion often comes before clarity. You're in a process of figuring things out, and that's perfectly normal.",
      "Mixed feelings are completely valid. Sometimes we need time to sort through complex emotions.",
      "You're navigating some uncertainty today. This questioning mindset can lead to important insights."
    ],
    excited: [
      "Your enthusiasm is contagious! This excited energy can be a powerful force for positive change.",
      "There's wonderful excitement in your words today. Channel this energy into something meaningful.",
      "Your excitement is palpable! This high-energy state is great for taking on new challenges.",
      "You're buzzing with positive energy today. This excitement can fuel great accomplishments."
    ]
  };

  const moodName = moodAnalysis.moodName;
  const moodInterpretations = interpretations[moodName as keyof typeof interpretations] || [
    "Your emotional state is being recognized and validated. Every feeling you have is important.",
    "I'm tracking your emotional journey. Your feelings matter and are being acknowledged.",
    "Your current emotional state has been noted. Remember that all emotions are temporary and valid."
  ];

  // Select a random interpretation
  const randomInterpretation = moodInterpretations[Math.floor(Math.random() * moodInterpretations.length)];
  
  return randomInterpretation;
}

// Calculate wellness score based on sentiment
function calculateWellnessScore(sentiment: string, currentScore: number): number {
  let newScore;
  
  switch (sentiment) {
    case 'positive':
      newScore = Math.min(95, currentScore + Math.floor(Math.random() * 6) + 3);
      break;
    case 'negative':
      newScore = Math.max(25, currentScore - Math.floor(Math.random() * 6) - 3);
      break;
    default:
      newScore = currentScore + Math.floor(Math.random() * 4) - 2;
  }
  
  return Math.max(0, Math.min(100, newScore));
}