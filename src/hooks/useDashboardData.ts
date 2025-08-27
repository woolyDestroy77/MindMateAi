import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        // Clear any stale session data and sign out
        await supabase.auth.signOut();
        setIsLoading(false);
        throw new Error("Your session has expired or is invalid. Please sign in again.");
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

      if (moodError && moodError.code !== 'PGRST116') {
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
        const defaultData = {
          user_id: user.id,
          current_mood: '😌',
          mood_name: 'calm',
          mood_interpretation: 'Welcome to PureMind AI! Your mood will be tracked automatically as you chat with our AI.',
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
      const errorMsg = error instanceof Error ? error.message : 'Failed to load dashboard data';
      toast.error(errorMsg);
    }
  }, []);

  const updateMoodFromAI = useCallback(async (
    sentiment: string, 
    userMessage: string, 
    aiResponse: string
  ) => {
    console.log('=== UPDATE MOOD FROM AI CALLED ===');
    console.log('Sentiment:', sentiment);
    console.log('User message:', userMessage);
    console.log('AI response:', aiResponse);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        // Clear any stale session data and sign out
        await supabase.auth.signOut();
        console.error('No user found for mood update - session expired');
        throw new Error("Your session has expired or is invalid. Please sign in again.");
      }

      // Enhanced keyword-based mood analysis
      const moodAnalysis = analyzeKeywordMood(userMessage, sentiment);
      
      console.log('Mood analysis result:', moodAnalysis);
      
      // Update if we detect any mood keywords or emotional indicators
      if (moodAnalysis.shouldUpdate || moodAnalysis.confidence > 0.1) {
        const currentTime = new Date().toISOString();
        
        // Calculate new wellness score based on mood and historical data
        const newWellnessScore = await calculateAdvancedWellnessScore(
          user.id,
          moodAnalysis.sentiment,
          moodAnalysis.moodName,
          dashboardData.wellnessScore
        );
        
        const newMoodData = {
          current_mood: moodAnalysis.mood,
          mood_name: moodAnalysis.moodName,
          mood_interpretation: generateMoodInterpretation(moodAnalysis, userMessage),
          wellness_score: newWellnessScore,
          sentiment: moodAnalysis.sentiment,
          last_message: userMessage,
          ai_response: aiResponse,
          updated_at: currentTime,
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

        // IMMEDIATELY update local state with fresh data
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

        // Force immediate update
        setDashboardData(newDashboardData);
        setUpdateTrigger(prev => prev + 1);
        
        // Show notification about the mood update with wellness score change
        const scoreChange = newWellnessScore - dashboardData.wellnessScore;
        const scoreChangeText = scoreChange > 0 ? `+${scoreChange}` : `${scoreChange}`;
        
        toast.success(`🎯 Mood updated: ${moodAnalysis.mood} (${moodAnalysis.moodName}) | Wellness: ${scoreChangeText}`, {
          duration: 4000,
          icon: moodAnalysis.mood,
        });
        
        console.log('=== MOOD UPDATE COMPLETE ===');
        console.log('New dashboard data:', newDashboardData);
        console.log('Wellness score change:', scoreChangeText);
        
      } else {
        console.log('Mood update skipped - no clear emotional keywords found');
        console.log('Confidence:', moodAnalysis.confidence);
      }
    } catch (error) {
      console.error('Error updating mood from AI:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update mood data';
      toast.error(errorMsg);
    }
  }, [dashboardData.wellnessScore]);

  // Set up real-time subscription ONCE
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      // Prevent multiple subscriptions
      if (isSubscribedRef.current) {
        console.log('Real-time subscription already active, skipping...');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Setting up real-time subscription for user:', user.id);

      try {
        // Clean up any existing subscription first
        if (subscriptionRef.current) {
          console.log('🧹 Cleaning up existing mood data subscription');
          await supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
          isSubscribedRef.current = false;
        }

        const channelName = `mood_data_changes_${user.id}`;
        
        isSubscribedRef.current = true;

        const subscription = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_mood_data',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log('Real-time mood data change detected:', payload);
              
              if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                const newData = payload.new as any;
                const updatedDashboardData: DashboardData = {
                  currentMood: newData.current_mood,
                  moodName: newData.mood_name,
                  moodInterpretation: newData.mood_interpretation,
                  wellnessScore: newData.wellness_score,
                  sentiment: newData.sentiment,
                  lastUpdated: newData.updated_at,
                  lastMessage: newData.last_message,
                  aiResponse: newData.ai_response,
                };
                
                console.log('Updating dashboard data from real-time:', updatedDashboardData);
                setDashboardData(updatedDashboardData);
                setUpdateTrigger(prev => prev + 1);
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to real-time updates');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('Subscription error:', status);
              // Clean up failed subscription
              if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
              }
              isSubscribedRef.current = false;
            }
          });

        subscriptionRef.current = subscription;

      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
        isSubscribedRef.current = false;
      }
    };

    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up subscription on unmount');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    isLoading,
    updateMoodFromAI,
    refreshDashboardData: fetchDashboardData,
    updateTrigger,
  };
};

// Enhanced keyword-based mood analysis function
function analyzeKeywordMood(message: string, sentiment: string) {
  const lowerMessage = message.toLowerCase();
  
  console.log('🔍 KEYWORD ANALYSIS - Analyzing message:', lowerMessage);
  
  // Comprehensive keyword database for mood detection
  const moodKeywords = {
    // HAPPY/POSITIVE MOODS
    happy: {
      primary: ['happy', 'joy', 'joyful', 'cheerful', 'glad', 'pleased', 'delighted', 'elated', 'ecstatic', 'blissful'],
      secondary: ['good', 'great', 'amazing', 'wonderful', 'fantastic', 'awesome', 'brilliant', 'excellent', 'perfect', 'beautiful'],
      expressions: ['smile', 'smiling', 'laugh', 'laughing', 'grin', 'grinning', 'beam', 'beaming'],
      phrases: ['feeling good', 'feeling great', 'feeling happy', 'in a good mood', 'having a great day', 'life is good', 'things are good'],
      emoji: '😊',
      sentiment: 'positive',
      weight: 1.0,
      baseScore: 85
    },
    
    excited: {
      primary: ['excited', 'thrilled', 'pumped', 'enthusiastic', 'eager', 'hyped', 'stoked', 'amped'],
      secondary: ['energetic', 'buzzing', 'electric', 'charged', 'fired up', 'psyched'],
      expressions: ['cant wait', 'so excited', 'really excited', 'super excited', 'absolutely thrilled'],
      phrases: ['feeling excited', 'feeling pumped', 'feeling energetic', 'feeling enthusiastic'],
      emoji: '🤩',
      sentiment: 'positive',
      weight: 1.0,
      baseScore: 90
    },

    // SAD/NEGATIVE MOODS
    sad: {
      primary: ['sad', 'depressed', 'down', 'blue', 'melancholy', 'gloomy', 'miserable', 'heartbroken', 'devastated'],
      secondary: ['upset', 'disappointed', 'hurt', 'lonely', 'empty', 'broken', 'lost', 'defeated'],
      expressions: ['crying', 'tears', 'weeping', 'sob', 'sobbing'],
      phrases: ['feeling sad', 'feeling down', 'feeling depressed', 'feeling blue', 'feeling low', 'having a bad day', 'feeling broken'],
      emoji: '😢',
      sentiment: 'negative',
      weight: 1.0,
      baseScore: 35
    },

    // ANGRY/FRUSTRATED MOODS
    angry: {
      primary: ['angry', 'mad', 'furious', 'rage', 'livid', 'outraged', 'enraged', 'irate', 'fuming'],
      secondary: ['frustrated', 'annoyed', 'irritated', 'aggravated', 'infuriated', 'bitter', 'resentful'],
      expressions: ['hate', 'pissed', 'fed up', 'sick of', 'tired of', 'cant stand'],
      phrases: ['feeling angry', 'feeling mad', 'feeling frustrated', 'pissed off', 'fed up with', 'sick and tired'],
      emoji: '😠',
      sentiment: 'negative',
      weight: 1.0,
      baseScore: 25
    },

    // ANXIOUS/WORRIED MOODS
    anxious: {
      primary: ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'panicking', 'overwhelmed', 'scared', 'afraid'],
      secondary: ['tense', 'uneasy', 'restless', 'troubled', 'concerned', 'apprehensive', 'fearful', 'terrified'],
      expressions: ['freaking out', 'stressed out', 'worried sick', 'scared to death'],
      phrases: ['feeling anxious', 'feeling worried', 'feeling nervous', 'feeling stressed', 'feeling overwhelmed'],
      emoji: '😰',
      sentiment: 'negative',
      weight: 1.0,
      baseScore: 40
    },

    // CALM/PEACEFUL MOODS
    calm: {
      primary: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'zen', 'centered', 'balanced'],
      secondary: ['composed', 'content', 'mellow', 'stable', 'steady', 'still', 'quiet'],
      expressions: ['at peace', 'feeling zen', 'chilled out', 'laid back'],
      phrases: ['feeling calm', 'feeling peaceful', 'feeling relaxed', 'feeling centered', 'feeling balanced'],
      emoji: '😌',
      sentiment: 'positive',
      weight: 0.8,
      baseScore: 75
    },

    // TIRED/EXHAUSTED MOODS
    tired: {
      primary: ['tired', 'exhausted', 'drained', 'weary', 'fatigued', 'worn out', 'burned out', 'depleted'],
      secondary: ['sleepy', 'drowsy', 'beat', 'wiped out', 'spent'],
      expressions: ['need sleep', 'need rest', 'cant keep my eyes open'],
      phrases: ['feeling tired', 'feeling exhausted', 'feeling drained', 'feeling worn out'],
      emoji: '😴',
      sentiment: 'neutral',
      weight: 0.7,
      baseScore: 50
    },

    // CONFUSED/UNCERTAIN MOODS
    confused: {
      primary: ['confused', 'lost', 'uncertain', 'unclear', 'puzzled', 'bewildered', 'perplexed', 'baffled'],
      secondary: ['mixed up', 'stumped', 'clueless', 'unsure', 'doubtful'],
      expressions: ['dont know', 'not sure', 'cant figure out', 'no idea'],
      phrases: ['feeling confused', 'feeling lost', 'feeling uncertain', 'feeling unclear'],
      emoji: '🤔',
      sentiment: 'neutral',
      weight: 0.6,
      baseScore: 60
    }
  };

  // Enhanced direct emotional statement patterns
  const emotionalPatterns = [
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
    /i'm becoming (.*)/,
    /i feel kind of (.*)/,
    /i feel a bit (.*)/,
    /i'm a little (.*)/,
    /lately i've been (.*)/,
    /recently i've been (.*)/,
    /these days i'm (.*)/,
    /i keep feeling (.*)/,
    /makes me feel (.*)/,
    /makes me (.*)/,
    /i always feel (.*)/,
    /i usually feel (.*)/,
    /i often feel (.*)/,
    /i sometimes feel (.*)/
  ];

  let detectedMood = null;
  let confidence = 0;
  let detectionMethod = '';
  let keywordsFound: string[] = [];
  let keywordsChecked = 0;

  console.log('🎯 STEP 1: Checking direct emotional patterns...');

  // STEP 1: Check for direct emotional statements (highest priority)
  for (const pattern of emotionalPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const emotionText = match[1];
      console.log(`📝 Found emotional pattern: "${match[0]}" with emotion text: "${emotionText}"`);
      
      for (const [mood, data] of Object.entries(moodKeywords)) {
        keywordsChecked++;
        
        // Check primary keywords (highest weight)
        const primaryMatch = data.primary.find(keyword => emotionText.includes(keyword));
        if (primaryMatch) {
          detectedMood = mood;
          confidence = 0.95 * data.weight;
          detectionMethod = `Direct emotional statement with primary keyword`;
          keywordsFound.push(primaryMatch);
          console.log(`✅ PRIMARY MATCH: "${primaryMatch}" in mood "${mood}" - confidence: ${confidence}`);
          break;
        }
        
        // Check secondary keywords
        const secondaryMatch = data.secondary.find(keyword => emotionText.includes(keyword));
        if (secondaryMatch) {
          detectedMood = mood;
          confidence = 0.85 * data.weight;
          detectionMethod = `Direct emotional statement with secondary keyword`;
          keywordsFound.push(secondaryMatch);
          console.log(`✅ SECONDARY MATCH: "${secondaryMatch}" in mood "${mood}" - confidence: ${confidence}`);
          break;
        }
        
        // Check expressions
        const expressionMatch = data.expressions.find(expr => emotionText.includes(expr));
        if (expressionMatch) {
          detectedMood = mood;
          confidence = 0.80 * data.weight;
          detectionMethod = `Direct emotional statement with expression`;
          keywordsFound.push(expressionMatch);
          console.log(`✅ EXPRESSION MATCH: "${expressionMatch}" in mood "${mood}" - confidence: ${confidence}`);
          break;
        }
      }
      if (detectedMood) break;
    }
  }

  // STEP 2: Check for phrase patterns (medium-high priority)
  if (!detectedMood) {
    console.log('🎯 STEP 2: Checking phrase patterns...');
    for (const [mood, data] of Object.entries(moodKeywords)) {
      const phraseMatch = data.phrases.find(phrase => lowerMessage.includes(phrase));
      if (phraseMatch) {
        detectedMood = mood;
        confidence = 0.75 * data.weight;
        detectionMethod = `Phrase pattern match`;
        keywordsFound.push(phraseMatch);
        console.log(`✅ PHRASE MATCH: "${phraseMatch}" in mood "${mood}" - confidence: ${confidence}`);
        break;
      }
    }
  }

  // STEP 3: Check for individual keyword presence with scoring (medium priority)
  if (!detectedMood) {
    console.log('🎯 STEP 3: Checking individual keywords...');
    let bestMood = null;
    let bestScore = 0;
    let bestKeywords: string[] = [];
    let bestMethod = '';
    
    for (const [mood, data] of Object.entries(moodKeywords)) {
      let moodScore = 0;
      let foundKeywords: string[] = [];
      
      // Check primary keywords (high weight)
      data.primary.forEach(keyword => {
        keywordsChecked++;
        if (lowerMessage.includes(keyword)) {
          moodScore += 0.8 * data.weight;
          foundKeywords.push(`${keyword}(primary)`);
          console.log(`🔑 PRIMARY keyword found: "${keyword}" in mood "${mood}"`);
        }
      });
      
      // Check secondary keywords (medium weight)
      data.secondary.forEach(keyword => {
        keywordsChecked++;
        if (lowerMessage.includes(keyword)) {
          moodScore += 0.6 * data.weight;
          foundKeywords.push(`${keyword}(secondary)`);
          console.log(`🔑 SECONDARY keyword found: "${keyword}" in mood "${mood}"`);
        }
      });
      
      // Check expressions (medium weight)
      data.expressions.forEach(expr => {
        keywordsChecked++;
        if (lowerMessage.includes(expr)) {
          moodScore += 0.7 * data.weight;
          foundKeywords.push(`${expr}(expression)`);
          console.log(`🔑 EXPRESSION found: "${expr}" in mood "${mood}"`);
        }
      });
      
      if (moodScore > bestScore) {
        bestMood = mood;
        bestScore = moodScore;
        bestKeywords = foundKeywords;
        bestMethod = `Individual keyword matching`;
        console.log(`🏆 NEW BEST: mood "${mood}" with score ${moodScore}`);
      }
    }
    
    if (bestMood && bestScore > 0.2) {
      detectedMood = bestMood;
      confidence = Math.min(bestScore + 0.2, 0.85);
      detectionMethod = bestMethod;
      keywordsFound = bestKeywords;
      console.log(`✅ KEYWORD MATCH: mood "${detectedMood}" - confidence: ${confidence}`);
    }
  }

  // STEP 4: Sentiment fallback (low priority)
  if (!detectedMood && sentiment) {
    console.log('🎯 STEP 4: Using sentiment fallback...');
    switch (sentiment.toLowerCase()) {
      case 'positive':
        detectedMood = 'happy';
        confidence = 0.4;
        detectionMethod = 'Sentiment analysis fallback: positive';
        break;
      case 'negative':
        detectedMood = 'sad';
        confidence = 0.4;
        detectionMethod = 'Sentiment analysis fallback: negative';
        break;
      default:
        detectedMood = 'calm';
        confidence = 0.25;
        detectionMethod = 'Sentiment analysis fallback: neutral';
    }
    console.log(`📊 SENTIMENT FALLBACK: mood "${detectedMood}" - confidence: ${confidence}`);
  }

  // Very responsive threshold - we want to catch emotional content
  const shouldUpdate = confidence > 0.15;

  const result = {
    mood: detectedMood ? moodKeywords[detectedMood as keyof typeof moodKeywords].emoji : '😐',
    moodName: detectedMood || 'neutral',
    sentiment: detectedMood ? moodKeywords[detectedMood as keyof typeof moodKeywords].sentiment : 'neutral',
    confidence,
    shouldUpdate,
    detectionMethod,
    keywordsFound,
    keywordsChecked,
    baseScore: detectedMood ? moodKeywords[detectedMood as keyof typeof moodKeywords].baseScore : 60
  };

  console.log('🎯 FINAL KEYWORD ANALYSIS RESULT:', result);
  console.log(`📊 Keywords checked: ${keywordsChecked}, Keywords found: ${keywordsFound.length}`);
  console.log(`🎭 Detected mood: ${result.moodName} ${result.mood} (confidence: ${confidence.toFixed(2)})`);
  console.log(`🔄 Should update: ${shouldUpdate}`);

  return result;
}

// Advanced wellness score calculation based on mood patterns and historical data
async function calculateAdvancedWellnessScore(
  userId: string,
  sentiment: string,
  moodName: string,
  currentScore: number
): Promise<number> {
  console.log('🧮 CALCULATING ADVANCED WELLNESS SCORE');
  console.log('Input:', { sentiment, moodName, currentScore });

  try {
    // Fetch recent mood history (last 7 days) for trend analysis
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentMoods, error } = await supabase
      .from('dappier_chat_history')
      .select('created_at, user_message')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching mood history:', error);
      // Fallback to simple calculation if history fetch fails
      return calculateSimpleWellnessScore(sentiment, moodName, currentScore);
    }

    // Mood base scores (0-100 scale)
    const moodBaseScores: { [key: string]: number } = {
      'excited': 90,
      'happy': 85,
      'calm': 75,
      'confused': 60,
      'tired': 50,
      'anxious': 40,
      'sad': 35,
      'angry': 25
    };

    // Get base score for current mood
    const baseScore = moodBaseScores[moodName] || 60;
    
    // Calculate trend factor based on recent messages
    let trendFactor = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    if (recentMoods && recentMoods.length > 0) {
      recentMoods.forEach((mood, index) => {
        const weight = 1 - (index * 0.1); // More recent messages have higher weight
        const moodAnalysis = analyzeKeywordMood(mood.user_message, '');
        
        if (moodAnalysis.sentiment === 'positive') {
          positiveCount += weight;
        } else if (moodAnalysis.sentiment === 'negative') {
          negativeCount += weight;
        } else {
          neutralCount += weight;
        }
      });

      // Calculate trend factor (-20 to +20)
      const totalWeight = positiveCount + negativeCount + neutralCount;
      if (totalWeight > 0) {
        const positiveRatio = positiveCount / totalWeight;
        const negativeRatio = negativeCount / totalWeight;
        trendFactor = (positiveRatio - negativeRatio) * 20;
      }
    }

    // Calculate momentum factor based on current vs previous score
    const momentumFactor = Math.max(-15, Math.min(15, (baseScore - currentScore) * 0.3));

    // Calculate consistency bonus/penalty
    let consistencyFactor = 0;
    if (recentMoods && recentMoods.length >= 3) {
      const recentSentiments = recentMoods.slice(0, 5).map(mood => {
        const analysis = analyzeKeywordMood(mood.user_message, '');
        return analysis.sentiment;
      });
      
      const consistentPositive = recentSentiments.filter(s => s === 'positive').length;
      const consistentNegative = recentSentiments.filter(s => s === 'negative').length;
      
      if (consistentPositive >= 3) {
        consistencyFactor = 5; // Bonus for consistent positive mood
      } else if (consistentNegative >= 3) {
        consistencyFactor = -5; // Penalty for consistent negative mood
      }
    }

    // Time-based factor (encourage regular check-ins)
    const now = new Date();
    const lastCheckIn = recentMoods && recentMoods.length > 0 ? new Date(recentMoods[0].created_at) : new Date();
    const hoursSinceLastCheckIn = Math.abs(now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60);
    
    let timeBasedFactor = 0;
    if (hoursSinceLastCheckIn <= 24) {
      timeBasedFactor = 2; // Small bonus for regular daily check-ins
    } else if (hoursSinceLastCheckIn > 72) {
      timeBasedFactor = -3; // Small penalty for long gaps
    }

    // Calculate final score with weighted average approach
    const targetScore = baseScore + trendFactor + consistencyFactor + timeBasedFactor;
    
    // Smooth transition: don't change score too dramatically
    const maxChange = 12; // Maximum change per update
    const scoreDifference = targetScore - currentScore;
    const actualChange = Math.max(-maxChange, Math.min(maxChange, scoreDifference + momentumFactor));
    
    const newScore = Math.max(10, Math.min(100, Math.round(currentScore + actualChange)));

    console.log('📊 WELLNESS SCORE CALCULATION BREAKDOWN:');
    console.log(`Base score for ${moodName}: ${baseScore}`);
    console.log(`Trend factor (recent history): ${trendFactor.toFixed(1)}`);
    console.log(`Momentum factor: ${momentumFactor.toFixed(1)}`);
    console.log(`Consistency factor: ${consistencyFactor}`);
    console.log(`Time-based factor: ${timeBasedFactor}`);
    console.log(`Target score: ${targetScore.toFixed(1)}`);
    console.log(`Actual change: ${actualChange.toFixed(1)}`);
    console.log(`Final score: ${currentScore} → ${newScore}`);

    return newScore;

  } catch (error) {
    console.error('Error in advanced wellness calculation:', error);
    return calculateSimpleWellnessScore(sentiment, moodName, currentScore);
  }
}

// Fallback simple wellness score calculation
function calculateSimpleWellnessScore(sentiment: string, moodName: string, currentScore: number): number {
  console.log('🔄 Using simple wellness score calculation');
  
  const moodAdjustments: { [key: string]: number } = {
    'excited': 8,
    'happy': 6,
    'calm': 2,
    'confused': -1,
    'tired': -3,
    'anxious': -5,
    'sad': -7,
    'angry': -8
  };

  const adjustment = moodAdjustments[moodName] || 0;
  const sentimentMultiplier = sentiment === 'positive' ? 1.2 : sentiment === 'negative' ? 0.8 : 1.0;
  
  const finalAdjustment = Math.round(adjustment * sentimentMultiplier);
  const newScore = Math.max(10, Math.min(100, currentScore + finalAdjustment));
  
  console.log(`Simple calculation: ${currentScore} + ${finalAdjustment} = ${newScore}`);
  return newScore;
}

// Generate mood interpretation based on analysis
function generateMoodInterpretation(moodAnalysis: any, userMessage: string) {
  const interpretations = {
    happy: [
      "🌟 Your positive energy is shining through! The happiness in your words shows you're in a great emotional space.",
      "😊 I can feel the joy in your message. This positive mood is wonderful for your overall wellbeing!",
      "✨ Your cheerful spirit is evident. Keep embracing these positive feelings - they're great for your mental health.",
      "🌈 The happiness you're expressing is contagious! This upbeat mood is a fantastic foundation for the day."
    ],
    excited: [
      "🚀 Your excitement is absolutely electric! This high-energy mood can fuel amazing accomplishments.",
      "⚡ I can feel your enthusiasm radiating through your words. Channel this energy into something meaningful!",
      "🎉 Your excitement is wonderful to see! This energetic state is perfect for taking on new challenges.",
      "🔥 The passion in your message is inspiring. This excited energy is a powerful force for positive change."
    ],
    sad: [
      "💙 I hear the sadness in your words, and I want you to know that these feelings are completely valid.",
      "🤗 You're going through something difficult right now. It's okay to feel sad - healing takes time.",
      "💝 Your emotional honesty shows real strength. Acknowledging sadness is an important step in processing it.",
      "🌧️ I notice you're experiencing some heavy emotions. Remember that storms pass, and brighter days are ahead."
    ],
    angry: [
      "🔥 I can sense the frustration in your message. Anger often signals that something important needs attention.",
      "⚡ Your intense emotions are valid. It's healthy to acknowledge anger rather than suppress it.",
      "🌋 There's some fire in your words today. Let's work on understanding what's triggering these feelings.",
      "💪 Your anger shows you care deeply about something. Channel this energy constructively when you're ready."
    ],
    anxious: [
      "🌊 I notice the worry in your message. Anxiety can feel overwhelming, but talking about it is a brave first step.",
      "🤝 Your anxious feelings are being heard and validated. You're not alone in dealing with these emotions.",
      "🧘 There's some tension in your thoughts today. Remember that anxiety is treatable and manageable.",
      "💚 Your concerns matter. Anxiety often tries to protect us, even when it feels uncomfortable."
    ],
    calm: [
      "🧘 Your peaceful energy is beautiful. This balanced state is wonderful for your mental wellbeing.",
      "🌸 I sense tranquility in your words. Enjoy this centered, calm feeling - it's a gift to yourself.",
      "⚖️ Your balanced emotional state is evident. This inner peace is a valuable resource for facing challenges.",
      "🕊️ The serenity in your message is lovely. This calm energy is perfect for reflection and growth."
    ],
    tired: [
      "😴 I can hear the fatigue in your words. Rest and self-care are essential for your wellbeing.",
      "🛌 Your energy seems low today. Listen to your body's signals - rest is productive and necessary.",
      "☕ Feeling drained is your body's way of asking for care. Make sure you're getting the rest you need.",
      "🌙 Exhaustion affects our emotional state. Be gentle with yourself and prioritize recovery."
    ],
    confused: [
      "🤔 I sense some uncertainty in your thoughts. It's perfectly okay not to have all the answers right now.",
      "🧩 Confusion often comes before clarity. You're working through something complex, and that's normal.",
      "🌫️ Mixed feelings are completely valid. Sometimes we need time to sort through complicated emotions.",
      "🔍 You're navigating some uncertainty today. This questioning mindset can lead to important insights."
    ]
  };

  const moodName = moodAnalysis.moodName;
  const moodInterpretations = interpretations[moodName as keyof typeof interpretations] || [
    "🎭 Your emotional state has been recognized and is being tracked for your wellbeing journey.",
    "📊 I'm monitoring your emotional patterns to help support your mental wellness.",
    "💝 Every feeling you express matters and contributes to understanding your emotional health."
  ];

  // Select a random interpretation
  const randomInterpretation = moodInterpretations[Math.floor(Math.random() * moodInterpretations.length)];
  
  // Add context about the detection
  const detectionNote = moodAnalysis.keywordsFound.length > 0 
    ? ` (Detected from: ${moodAnalysis.keywordsFound.slice(0, 3).join(', ')})`
    : '';
  
  return randomInterpretation + detectionNote;
}