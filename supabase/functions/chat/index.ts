const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DappierRequest {
  query: string;
}

interface DappierResponse {
  response?: string;
  answer?: string;
  result?: string;
  data?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();

    console.log('Dappier AI Agent invoked');
    console.log('Received message:', message);
    console.log('Context length:', context?.length || 0);

    // Dappier API configuration
    const DAPPIER_API_KEY = 'ak_01jx00ns9jfjkvkybhzamc2vyk';
    const DATA_MODEL_ID = 'dm_01jx62jyczecdv0gkh2gbp7pge';
    const AI_MODEL_ID = 'am_01jx62jyd7ecea2yy0tjfqmf4y';
    const DAPPIER_ENDPOINT = `https://api.dappier.com/app/datamodel/${DATA_MODEL_ID}`;

    console.log('Using Dappier configuration:');
    console.log('- Data Model ID:', DATA_MODEL_ID);
    console.log('- AI Model ID:', AI_MODEL_ID);
    console.log('- Endpoint:', DAPPIER_ENDPOINT);

    // Prepare the query with context if available
    let enhancedQuery = message;
    if (context && context.length > 0) {
      const contextString = context
        .slice(-5) // Use last 5 messages for context
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      enhancedQuery = `Context from previous conversation:\n${contextString}\n\nCurrent question: ${message}`;
    }

    console.log('Enhanced query prepared');

    // Prepare request payload
    const requestPayload: DappierRequest = {
      query: enhancedQuery
    };

    console.log('Making request to Dappier API...');

    try {
      const dappierResponse = await fetch(DAPPIER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DAPPIER_API_KEY}`,
          'User-Agent': 'MindMate-AI/1.0',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('Dappier response status:', dappierResponse.status);
      console.log('Dappier response headers:', Object.fromEntries(dappierResponse.headers.entries()));

      if (!dappierResponse.ok) {
        const errorText = await dappierResponse.text();
        console.error('Dappier API error response:', errorText);
        console.error('Dappier API error status:', dappierResponse.status);
        
        // Handle specific error cases
        if (dappierResponse.status === 401) {
          return new Response(
            JSON.stringify({ 
              error: "AUTHENTICATION_ERROR",
              message: "Authentication failed with Dappier API. Please check your API key.",
              details: "Invalid or expired Dappier API key"
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            },
          );
        } else if (dappierResponse.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: "QUOTA_EXCEEDED",
              message: "AI service is temporarily unavailable due to usage limits. Please try again later.",
              details: "Dappier API quota exceeded"
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            },
          );
        } else if (dappierResponse.status === 404) {
          return new Response(
            JSON.stringify({ 
              error: "MODEL_NOT_FOUND",
              message: "AI model or data model not found. Please check configuration.",
              details: `Data model ${DATA_MODEL_ID} or AI model ${AI_MODEL_ID} not found`
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            },
          );
        }
        
        return new Response(
          JSON.stringify({ 
            error: "SERVICE_ERROR",
            message: "AI service encountered an error. Please try again.",
            details: `Dappier API error: ${dappierResponse.status} - ${errorText}`
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          },
        );
      }

      const dappierData: DappierResponse = await dappierResponse.json();
      console.log('Dappier response received');
      console.log('Response structure:', Object.keys(dappierData));

      // Extract response content from various possible fields
      let responseContent: string | null = null;
      
      if (dappierData.response) {
        responseContent = dappierData.response;
      } else if (dappierData.answer) {
        responseContent = dappierData.answer;
      } else if (dappierData.result) {
        responseContent = dappierData.result;
      } else if (dappierData.data && typeof dappierData.data === 'string') {
        responseContent = dappierData.data;
      } else if (typeof dappierData === 'string') {
        responseContent = dappierData;
      }

      if (!responseContent) {
        console.error('No valid response content found in Dappier response');
        console.error('Full response:', dappierData);
        return new Response(
          JSON.stringify({ 
            error: "EMPTY_RESPONSE",
            message: "AI service returned an empty response. Please try again.",
            details: "No valid response content found in Dappier API response"
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          },
        );
      }

      // Simple sentiment analysis based on keywords
      const sentimentAnalysis = (text: string): string => {
        const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'joy', 'excited', 'grateful', 'optimistic'];
        const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'depressed', 'anxious', 'worried', 'stressed', 'upset'];
        
        const lowerText = text.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'POSITIVE';
        if (negativeCount > positiveCount) return 'NEGATIVE';
        return 'NEUTRAL';
      };

      const sentiment = sentimentAnalysis(message);

      console.log('Successfully processed Dappier response');
      console.log('Response length:', responseContent.length);
      console.log('Detected sentiment:', sentiment);

      return new Response(
        JSON.stringify({ 
          response: responseContent,
          sentiment: sentiment,
          service: 'dappier',
          model_id: AI_MODEL_ID,
          data_model_id: DATA_MODEL_ID
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
      
    } catch (fetchError) {
      console.error('Network error calling Dappier API:', fetchError);
      
      return new Response(
        JSON.stringify({ 
          error: "NETWORK_ERROR",
          message: "Failed to connect to AI service. Please check your internet connection and try again.",
          details: `Network error: ${fetchError.message}`
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

  } catch (error) {
    console.error('Error in Dappier chat function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again.",
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});