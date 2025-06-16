// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatContextMessage {
  role: string;
  content: string;
}

interface DappierRequest {
  query: string;
}

interface DappierResponse {
  response?: string;
  answer?: string;
  result?: string;
  data?: string;
}

const DAPPIER_API_KEY = "ak_01jx00ns9jfjkvkybhzamc2vyk";
const DATA_MODEL_ID = "dm_01jx62jyczecdv0gkh2gbp7pge";
const AI_MODEL_ID = "am_01jx62jyd7ecea2yy0tjfqmf4y";
const DAPPIER_ENDPOINT = `https://api.dappier.com/app/aimodel/${AI_MODEL_ID}`;

// --- Utility Functions ---

function buildEnhancedQuery(
  message: string,
  context?: ChatContextMessage[],
): string {
  // Enhanced instruction with addiction support guidance
  const responseInstruction = `
IMPORTANT: Keep your response SHORT and conversational (2-3 sentences max). 
Use bullet points ONLY when giving specific advice or steps.
Be warm but concise. Focus on the main point.

ADDICTION SUPPORT GUIDANCE:
If the user mentions addiction, recovery, cravings, relapse, or substance use:
- Provide supportive, non-judgmental responses
- Suggest practical coping strategies (breathing exercises, calling support, distraction techniques)
- Remind them that recovery is a journey and setbacks are normal
- Encourage them to reach out to their support network
- Suggest daily recovery steps like hydration, exercise, mindfulness
- If they mention crisis or emergency, remind them to call emergency services or crisis hotlines

DAILY RECOVERY STEPS TO SUGGEST:
- Morning: Start with positive affirmations and set daily intentions
- Afternoon: Practice mindful breathing and check in with triggers
- Evening: Reflect on the day and practice gratitude
- Anytime: Connect with support network, use HALT method (Hungry, Angry, Lonely, Tired)

`;

  if (context && context.length > 0) {
    const contextString = context
      .slice(-3) // Reduced context for shorter responses
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");
    return `${responseInstruction}Context:\n${contextString}\n\nUser: ${message}`;
  }
  return `${responseInstruction}User: ${message}`;
}

function extractResponseContent(
  dappierData: DappierResponse | string,
): string | null {
  if (typeof dappierData === "string") return dappierData;
  if (dappierData.response) return dappierData.response;
  if (dappierData.answer) return dappierData.answer;
  if (dappierData.result) return dappierData.result;
  if (typeof dappierData.data === "string") return dappierData.data;
  return null;
}

function enhancedSentimentAnalysis(text: string): string {
  const lowerText = text.toLowerCase().trim();
  
  console.log('🔍 SENTIMENT ANALYSIS - Analyzing text:', lowerText);
  
  // Enhanced sentiment analysis with addiction-specific keywords
  const sentimentIndicators = {
    positive: {
      keywords: [
        'happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'joy', 'excited',
        'grateful', 'optimistic', 'pleased', 'satisfied', 'content', 'delighted', 'thrilled', 'cheerful',
        'glad', 'blessed', 'lucky', 'awesome', 'brilliant', 'perfect', 'beautiful', 'smile', 'laugh',
        'fun', 'enjoy', 'celebration', 'success', 'achievement', 'proud', 'confident', 'hopeful', 'elated',
        'ecstatic', 'blissful', 'joyful', 'upbeat', 'positive', 'energetic', 'motivated', 'inspired',
        // Recovery-specific positive terms
        'clean', 'sober', 'recovery', 'healing', 'progress', 'milestone', 'strength', 'courage', 'hope'
      ],
      phrases: [
        'feeling good', 'feeling great', 'feeling happy', 'feeling amazing', 'feeling wonderful',
        'in a good mood', 'having a great day', 'things are good', 'life is good', 'doing well',
        'feeling positive', 'feeling blessed', 'feeling grateful', 'feeling lucky', 'love it',
        'really enjoy', 'makes me happy', 'so excited', 'cant wait', 'feeling fantastic',
        'really good', 'super happy', 'absolutely love', 'feeling awesome', 'really pleased',
        // Recovery-specific positive phrases
        'staying clean', 'feeling strong', 'making progress', 'proud of myself', 'getting better',
        'recovery journey', 'feeling hopeful', 'staying sober', 'clean and sober', 'healing process'
      ],
      patterns: [
        /i feel (good|great|happy|amazing|wonderful|fantastic|awesome|brilliant|perfect|strong|hopeful|proud)/,
        /i am (happy|excited|thrilled|delighted|pleased|glad|grateful|blessed|lucky|clean|sober|strong)/,
        /feeling (good|great|happy|amazing|wonderful|fantastic|awesome|positive|upbeat|strong|hopeful|clean)/,
        /really (happy|excited|good|great|pleased|glad|proud|strong)/,
        /so (happy|excited|good|great|pleased|glad|proud|grateful)/,
        /absolutely (love|amazing|wonderful|fantastic|brilliant)/,
        /(staying|been) (clean|sober)/,
        /making (progress|headway)/,
        /(recovery|healing) (journey|process)/
      ],
      weight: 1
    },
    negative: {
      keywords: [
        'sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'depressed', 'anxious', 'worried',
        'stressed', 'upset', 'disappointed', 'hurt', 'pain', 'crying', 'lonely', 'empty', 'miserable',
        'devastated', 'heartbroken', 'furious', 'mad', 'annoyed', 'irritated', 'scared', 'afraid',
        'nervous', 'overwhelmed', 'exhausted', 'tired', 'drained', 'hopeless', 'lost', 'broken',
        'panicked', 'panicking', 'terrified', 'fearful', 'distressed', 'troubled', 'concerned',
        'uneasy', 'restless', 'tense', 'agitated', 'distraught', 'despondent', 'melancholy',
        // Addiction-specific negative terms
        'craving', 'relapse', 'relapsed', 'using', 'drinking', 'high', 'withdrawal', 'tempted', 'triggered'
      ],
      phrases: [
        'feeling sad', 'feeling bad', 'feeling down', 'feeling depressed', 'feeling angry', 'feeling frustrated',
        'feeling anxious', 'feeling worried', 'feeling stressed', 'feeling upset', 'feeling hurt',
        'not doing well', 'having a bad day', 'things are bad', 'life is hard', 'struggling with',
        'cant stand', 'hate it when', 'makes me sad', 'makes me angry', 'really upset',
        'feeling awful', 'feeling terrible', 'really anxious', 'super stressed', 'really worried',
        'feeling overwhelmed', 'feeling lost', 'feeling broken', 'feeling empty', 'really scared',
        // Addiction-specific negative phrases
        'want to use', 'thinking about drinking', 'having cravings', 'feeling triggered', 'want to relapse',
        'struggling with addiction', 'cant stop thinking about', 'withdrawal symptoms', 'feeling tempted'
      ],
      patterns: [
        /i feel (sad|bad|terrible|awful|depressed|anxious|worried|stressed|upset|hurt|angry|frustrated)/,
        /i am (sad|depressed|anxious|worried|stressed|upset|angry|frustrated|scared|afraid|nervous)/,
        /feeling (sad|bad|down|depressed|anxious|worried|stressed|upset|angry|frustrated|awful|terrible)/,
        /really (sad|anxious|worried|stressed|upset|angry|frustrated|scared|afraid)/,
        /so (sad|anxious|worried|stressed|upset|angry|frustrated|scared|afraid)/,
        /im (anxious|worried|stressed|depressed|sad|upset|angry|frustrated|scared|afraid)/,
        /(want to|thinking about) (use|drink|relapse)/,
        /having (cravings|urges)/,
        /(struggling with|battling) (addiction|cravings)/,
        /feeling (triggered|tempted)/
      ],
      weight: 1
    }
  };

  let positiveScore = 0;
  let negativeScore = 0;
  let detectionDetails: string[] = [];

  // STEP 1: Check for direct emotional patterns (highest priority)
  console.log('🎯 STEP 1: Checking emotional patterns...');
  
  // Check positive patterns
  for (const pattern of sentimentIndicators.positive.patterns) {
    if (pattern.test(lowerText)) {
      positiveScore += 3; // High weight for direct patterns
      detectionDetails.push(`Positive pattern: ${pattern.source}`);
      console.log(`✅ POSITIVE PATTERN MATCH: ${pattern.source}`);
    }
  }
  
  // Check negative patterns
  for (const pattern of sentimentIndicators.negative.patterns) {
    if (pattern.test(lowerText)) {
      negativeScore += 3; // High weight for direct patterns
      detectionDetails.push(`Negative pattern: ${pattern.source}`);
      console.log(`✅ NEGATIVE PATTERN MATCH: ${pattern.source}`);
    }
  }

  // STEP 2: Check for phrase patterns
  console.log('🎯 STEP 2: Checking phrase patterns...');
  
  sentimentIndicators.positive.phrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      positiveScore += 2;
      detectionDetails.push(`Positive phrase: "${phrase}"`);
      console.log(`✅ POSITIVE PHRASE: "${phrase}"`);
    }
  });
  
  sentimentIndicators.negative.phrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      negativeScore += 2;
      detectionDetails.push(`Negative phrase: "${phrase}"`);
      console.log(`✅ NEGATIVE PHRASE: "${phrase}"`);
    }
  });

  // STEP 3: Check for individual keywords
  console.log('🎯 STEP 3: Checking individual keywords...');
  
  sentimentIndicators.positive.keywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      positiveScore += 1;
      detectionDetails.push(`Positive keyword: "${keyword}"`);
      console.log(`🔑 POSITIVE KEYWORD: "${keyword}"`);
    }
  });
  
  sentimentIndicators.negative.keywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      negativeScore += 1;
      detectionDetails.push(`Negative keyword: "${keyword}"`);
      console.log(`🔑 NEGATIVE KEYWORD: "${keyword}"`);
    }
  });

  console.log('📊 SENTIMENT SCORES:', { positiveScore, negativeScore });
  console.log('🔍 DETECTION DETAILS:', detectionDetails);

  // Determine sentiment with clear thresholds
  let finalSentiment: string;
  
  if (positiveScore > negativeScore && positiveScore >= 1) {
    finalSentiment = "POSITIVE";
  } else if (negativeScore > positiveScore && negativeScore >= 1) {
    finalSentiment = "NEGATIVE";
  } else if (positiveScore === 0 && negativeScore === 0) {
    // No emotional indicators found, default to neutral
    finalSentiment = "NEUTRAL";
  } else {
    // Tie or very low scores
    finalSentiment = "NEUTRAL";
  }

  console.log(`🎭 FINAL SENTIMENT: ${finalSentiment} (positive: ${positiveScore}, negative: ${negativeScore})`);
  
  return finalSentiment;
}

function errorResponse(
  error: string,
  message: string,
  details: string,
  status: number,
): Response {
  return new Response(
    JSON.stringify({ error, message, details }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

// --- Main Handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();

    console.log('=== CHAT FUNCTION CALLED ===');
    console.log('User message:', message);

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse(
        "INVALID_INPUT",
        "Message is required and must be a non-empty string",
        "Empty or invalid message provided",
        400,
      );
    }

    // Prepare enhanced query with context and addiction support
    const enhancedQuery = buildEnhancedQuery(message, context);

    const requestPayload: DappierRequest = { query: enhancedQuery };

    // Call Dappier API
    let dappierResponse: Response;
    try {
      dappierResponse = await fetch(DAPPIER_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DAPPIER_API_KEY}`,
        },
        body: JSON.stringify(requestPayload),
      });
    } catch (fetchError: any) {
      console.error("Network error calling Dappier API:", fetchError);
      return errorResponse(
        "NETWORK_ERROR",
        "Failed to connect to AI service. Please check your internet connection and try again.",
        `Network error: ${fetchError.message}`,
        500,
      );
    }

    // Handle Dappier API errors
    if (!dappierResponse.ok) {
      const errorText = await dappierResponse.text();
      console.error("Dappier API error response:", errorText);
      switch (dappierResponse.status) {
        case 401:
          return errorResponse(
            "AUTHENTICATION_ERROR",
            "Authentication failed with Dappier API. Please check your API key.",
            "Invalid or expired Dappier API key",
            500,
          );
        case 429:
          return errorResponse(
            "QUOTA_EXCEEDED",
            "AI service is temporarily unavailable due to usage limits. Please try again later.",
            "Dappier API quota exceeded",
            429,
          );
        case 404:
          return errorResponse(
            "MODEL_NOT_FOUND",
            "AI model or data model not found. Please check configuration.",
            `Data model ${DATA_MODEL_ID} or AI model ${AI_MODEL_ID} not found`,
            500,
          );
        default:
          return errorResponse(
            "SERVICE_ERROR",
            "AI service encountered an error. Please try again.",
            `Dappier API error: ${dappierResponse.status} - ${errorText}`,
            500,
          );
      }
    }

    // Parse and process successful response
    let dappierData: DappierResponse | string;
    try {
      dappierData = await dappierResponse.json();
    } catch (parseError: any) {
      console.error("Failed to parse Dappier API response:", parseError);
      return errorResponse(
        "INVALID_RESPONSE",
        "AI service returned an invalid response.",
        `Parse error: ${parseError.message}`,
        500,
      );
    }

    const responseContent = extractResponseContent(dappierData);

    if (!responseContent) {
      console.log("No valid response content found in Dappier response");
      return new Response(
        JSON.stringify({
          response: dappierData,
          sentiment: "NEUTRAL", // Always provide a sentiment
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // CRITICAL: Enhanced sentiment analysis on the original user message
    const sentiment = enhancedSentimentAnalysis(message.trim());
    
    console.log('🎯 SENTIMENT ANALYSIS COMPLETE');
    console.log('Original message:', message);
    console.log('Detected sentiment:', sentiment);

    const finalResponse = {
      response: responseContent,
      sentiment, // This should NEVER be undefined now
      service: "dappier",
      model_id: AI_MODEL_ID,
      data_model_id: DATA_MODEL_ID,
      analysis_details: {
        original_message: message,
        detected_sentiment: sentiment,
        timestamp: new Date().toISOString()
      }
    };

    console.log('=== CHAT FUNCTION RESPONSE ===');
    console.log('Final response sentiment:', finalResponse.sentiment);

    return new Response(
      JSON.stringify(finalResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in Dappier chat function:", error);
    return new Response(
      JSON.stringify({
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again.",
        details: error.message,
        sentiment: "NEUTRAL", // Always provide a sentiment even on error
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});