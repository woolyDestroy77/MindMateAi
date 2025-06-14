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
      console.log('=== KEYWORD MOOD DETECTION ANALYSIS ===');
      console.log('User message:', userMessage);
      console.log('AI sentiment:', sentiment);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        console.error('No user found for mood update');
        return;
      }

      // Enhanced keyword-based mood analysis
      const moodAnalysis = analyzeKeywordMood(userMessage, sentiment);
      
      console.log('Keyword mood analysis result:', moodAnalysis);
      
      // Update if we detect any mood keywords or emotional indicators
      if (moodAnalysis.shouldUpdate || moodAnalysis.confidence > 0.1) {
        const newMoodData = {
          current_mood: moodAnalysis.mood,
          mood_name: moodAnalysis.moodName,
          mood_interpretation: generateMoodInterpretation(moodAnalysis, userMessage),
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

        // Update local state immediately
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
        
        // Show notification about the mood update
        toast.success(`Mood detected: ${moodAnalysis.mood} (${moodAnalysis.moodName}) - Dashboard updated!`, {
          duration: 5000,
          icon: moodAnalysis.mood,
        });
        
        console.log('=== KEYWORD MOOD UPDATE COMPLETE ===');
        console.log('Detection method:', moodAnalysis.detectionMethod);
        console.log('Keywords found:', moodAnalysis.keywordsFound);
      } else {
        console.log('Mood update skipped - no clear emotional keywords found');
        console.log('Confidence:', moodAnalysis.confidence);
        console.log('Keywords checked:', moodAnalysis.keywordsChecked);
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
      weight: 1.0
    },
    
    excited: {
      primary: ['excited', 'thrilled', 'pumped', 'enthusiastic', 'eager', 'hyped', 'stoked', 'amped'],
      secondary: ['energetic', 'buzzing', 'electric', 'charged', 'fired up', 'psyched'],
      expressions: ['cant wait', 'so excited', 'really excited', 'super excited', 'absolutely thrilled'],
      phrases: ['feeling excited', 'feeling pumped', 'feeling energetic', 'feeling enthusiastic'],
      emoji: '🤩',
      sentiment: 'positive',
      weight: 1.0
    },

    // SAD/NEGATIVE MOODS
    sad: {
      primary: ['sad', 'depressed', 'down', 'blue', 'melancholy', 'gloomy', 'miserable', 'heartbroken', 'devastated'],
      secondary: ['upset', 'disappointed', 'hurt', 'lonely', 'empty', 'broken', 'lost', 'defeated'],
      expressions: ['crying', 'tears', 'weeping', 'sob', 'sobbing'],
      phrases: ['feeling sad', 'feeling down', 'feeling depressed', 'feeling blue', 'feeling low', 'having a bad day', 'feeling broken'],
      emoji: '😢',
      sentiment: 'negative',
      weight: 1.0
    },

    // ANGRY/FRUSTRATED MOODS
    angry: {
      primary: ['angry', 'mad', 'furious', 'rage', 'livid', 'outraged', 'enraged', 'irate', 'fuming'],
      secondary: ['frustrated', 'annoyed', 'irritated', 'aggravated', 'infuriated', 'bitter', 'resentful'],
      expressions: ['hate', 'pissed', 'fed up', 'sick of', 'tired of', 'cant stand'],
      phrases: ['feeling angry', 'feeling mad', 'feeling frustrated', 'pissed off', 'fed up with', 'sick and tired'],
      emoji: '😠',
      sentiment: 'negative',
      weight: 1.0
    },

    // ANXIOUS/WORRIED MOODS
    anxious: {
      primary: ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'panicking', 'overwhelmed', 'scared', 'afraid'],
      secondary: ['tense', 'uneasy', 'restless', 'troubled', 'concerned', 'apprehensive', 'fearful', 'terrified'],
      expressions: ['freaking out', 'stressed out', 'worried sick', 'scared to death'],
      phrases: ['feeling anxious', 'feeling worried', 'feeling nervous', 'feeling stressed', 'feeling overwhelmed'],
      emoji: '😰',
      sentiment: 'negative',
      weight: 1.0
    },

    // CALM/PEACEFUL MOODS
    calm: {
      primary: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'zen', 'centered', 'balanced'],
      secondary: ['composed', 'content', 'mellow', 'stable', 'steady', 'still', 'quiet'],
      expressions: ['at peace', 'feeling zen', 'chilled out', 'laid back'],
      phrases: ['feeling calm', 'feeling peaceful', 'feeling relaxed', 'feeling centered', 'feeling balanced'],
      emoji: '😌',
      sentiment: 'positive',
      weight: 0.8
    },

    // TIRED/EXHAUSTED MOODS
    tired: {
      primary: ['tired', 'exhausted', 'drained', 'weary', 'fatigued', 'worn out', 'burned out', 'depleted'],
      secondary: ['sleepy', 'drowsy', 'beat', 'wiped out', 'spent'],
      expressions: ['need sleep', 'need rest', 'cant keep my eyes open'],
      phrases: ['feeling tired', 'feeling exhausted', 'feeling drained', 'feeling worn out'],
      emoji: '😴',
      sentiment: 'neutral',
      weight: 0.7
    },

    // CONFUSED/UNCERTAIN MOODS
    confused: {
      primary: ['confused', 'lost', 'uncertain', 'unclear', 'puzzled', 'bewildered', 'perplexed', 'baffled'],
      secondary: ['mixed up', 'stumped', 'clueless', 'unsure', 'doubtful'],
      expressions: ['dont know', 'not sure', 'cant figure out', 'no idea'],
      phrases: ['feeling confused', 'feeling lost', 'feeling uncertain', 'feeling unclear'],
      emoji: '🤔',
      sentiment: 'neutral',
      weight: 0.6
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
    
    if (bestMood && bestScore > 0.2) { // Lowered threshold for better detection
      detectedMood = bestMood;
      confidence = Math.min(bestScore + 0.2, 0.85); // Boost confidence but cap it
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
    keywordsChecked
  };

  console.log('🎯 FINAL KEYWORD ANALYSIS RESULT:', result);
  console.log(`📊 Keywords checked: ${keywordsChecked}, Keywords found: ${keywordsFound.length}`);
  console.log(`🎭 Detected mood: ${result.moodName} ${result.mood} (confidence: ${confidence.toFixed(2)})`);
  console.log(`🔄 Should update: ${shouldUpdate}`);

  return result;
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

// Calculate wellness score based on sentiment
function calculateWellnessScore(sentiment: string, currentScore: number): number {
  let adjustment;
  
  switch (sentiment) {
    case 'positive':
      adjustment = Math.floor(Math.random() * 10) + 5; // +5 to +14
      break;
    case 'negative':
      adjustment = -(Math.floor(Math.random() * 10) + 5); // -5 to -14
      break;
    default:
      adjustment = Math.floor(Math.random() * 6) - 3; // -3 to +2
  }
  
  const newScore = currentScore + adjustment;
  return Math.max(10, Math.min(100, newScore)); // Keep between 10-100
}