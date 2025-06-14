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
  if (context && context.length > 0) {
    const contextString = context
      .slice(-5)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");
    return `Context from previous conversation:\n${contextString}\n\nCurrent question: ${message}`;
  }
  return message;
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
  const lowerText = text.toLowerCase();
  
  // Enhanced sentiment analysis with more comprehensive patterns
  const sentimentIndicators = {
    positive: {
      keywords: [
        'happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'joy', 'excited',
        'grateful', 'optimistic', 'pleased', 'satisfied', 'content', 'delighted', 'thrilled', 'cheerful',
        'glad', 'blessed', 'lucky', 'awesome', 'brilliant', 'perfect', 'beautiful', 'smile', 'laugh',
        'fun', 'enjoy', 'celebration', 'success', 'achievement', 'proud', 'confident', 'hopeful'
      ],
      phrases: [
        'feeling good', 'feeling great', 'feeling happy', 'feeling amazing', 'feeling wonderful',
        'in a good mood', 'having a great day', 'things are good', 'life is good', 'doing well',
        'feeling positive', 'feeling blessed', 'feeling grateful', 'feeling lucky', 'love it',
        'really enjoy', 'makes me happy', 'so excited', 'cant wait'
      ],
      weight: 1
    },
    negative: {
      keywords: [
        'sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'depressed', 'anxious', 'worried',
        'stressed', 'upset', 'disappointed', 'hurt', 'pain', 'crying', 'lonely', 'empty', 'miserable',
        'devastated', 'heartbroken', 'furious', 'mad', 'annoyed', 'irritated', 'scared', 'afraid',
        'nervous', 'overwhelmed', 'exhausted', 'tired', 'drained', 'hopeless', 'lost', 'broken'
      ],
      phrases: [
        'feeling sad', 'feeling bad', 'feeling down', 'feeling depressed', 'feeling angry', 'feeling frustrated',
        'feeling anxious', 'feeling worried', 'feeling stressed', 'feeling upset', 'feeling hurt',
        'not doing well', 'having a bad day', 'things are bad', 'life is hard', 'struggling with',
        'cant stand', 'hate it when', 'makes me sad', 'makes me angry', 'really upset'
      ],
      weight: 1
    }
  };

  let positiveScore = 0;
  let negativeScore = 0;

  // Check for direct emotional statements with higher weight
  const emotionalPatterns = [
    /i feel (.*)/,
    /i am (.*)/,
    /i'm (.*)/,
    /feeling (.*)/,
    /makes me (.*)/,
    /i'm so (.*)/,
    /really (.*)/
  ];

  for (const pattern of emotionalPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const emotionText = match[1];
      
      // Check positive indicators in emotional statements
      sentimentIndicators.positive.keywords.forEach(keyword => {
        if (emotionText.includes(keyword)) {
          positiveScore += 2; // Higher weight for direct emotional statements
        }
      });
      
      sentimentIndicators.positive.phrases.forEach(phrase => {
        if (emotionText.includes(phrase.replace('feeling ', ''))) {
          positiveScore += 2;
        }
      });
      
      // Check negative indicators in emotional statements
      sentimentIndicators.negative.keywords.forEach(keyword => {
        if (emotionText.includes(keyword)) {
          negativeScore += 2;
        }
      });
      
      sentimentIndicators.negative.phrases.forEach(phrase => {
        if (emotionText.includes(phrase.replace('feeling ', ''))) {
          negativeScore += 2;
        }
      });
    }
  }

  // Check for phrase patterns
  sentimentIndicators.positive.phrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      positiveScore += 1.5;
    }
  });
  
  sentimentIndicators.negative.phrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      negativeScore += 1.5;
    }
  });

  // Check for individual keywords
  sentimentIndicators.positive.keywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      positiveScore += 1;
    }
  });
  
  sentimentIndicators.negative.keywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      negativeScore += 1;
    }
  });

  console.log('Sentiment analysis scores:', { positiveScore, negativeScore, text: lowerText });

  // Determine sentiment with threshold
  if (positiveScore > negativeScore && positiveScore > 0.5) {
    return "POSITIVE";
  } else if (negativeScore > positiveScore && negativeScore > 0.5) {
    return "NEGATIVE";
  } else {
    return "NEUTRAL";
  }
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

    // Prepare enhanced query with context
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
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Enhanced sentiment analysis
    const sentiment = enhancedSentimentAnalysis(message);
    
    console.log('Enhanced sentiment analysis result:', sentiment);

    const finalResponse = {
      response: responseContent,
      sentiment,
      service: "dappier",
      model_id: AI_MODEL_ID,
      data_model_id: DATA_MODEL_ID,
    };

    console.log('=== CHAT FUNCTION RESPONSE ===');
    console.log('Final response:', finalResponse);

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
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});