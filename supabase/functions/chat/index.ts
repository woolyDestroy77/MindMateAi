const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    console.log('Chat function invoked');
    console.log('Received message:', message);

    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    console.log('DAPPIER_API_KEY exists:', !!dappierApiKey);

    if (!dappierApiKey) {
      console.error('Missing DAPPIER_API_KEY environment variable');
      return new Response(JSON.stringify({
        error: "API_CONFIGURATION_ERROR",
        message: "Missing DAPPIER_API_KEY in Supabase Edge Function settings.",
        instructions: [
          "1. Go to your Supabase project dashboard",
          "2. Navigate to Edge Functions settings",
          "3. Add DAPPIER_API_KEY environment variable",
          "4. Get your API key from https://dappier.com"
        ]
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemMessage = {
      role: 'system',
      content: `You are MindMate AI, a highly empathetic and proactive mental wellness companion. Your purpose is to:

1. Provide active emotional support and practical coping strategies
2. Help users explore and understand their feelings
3. Suggest specific exercises and techniques for emotional regulation
4. Encourage positive behavioral changes while acknowledging challenges
5. Maintain a warm, conversational tone while being direct and action-oriented

If someone expresses thoughts of self-harm or severe distress:
- Express immediate concern
- Provide crisis hotline information (988 Suicide & Crisis Lifeline)
- Strongly encourage seeking professional help
- Focus on immediate safety and grounding techniques`
    };

    const messages = [
      systemMessage,
      ...(context || []),
      { role: 'user', content: message }
    ];

    console.log('Making request to Dappier API...');
    console.log('Request payload:', JSON.stringify({
      messages: messages.slice(-5), // Log only last 5 messages for brevity
      temperature: 0.7,
      max_tokens: 500
    }));

    let dappierResponse;
    try {
      dappierResponse = await fetch('https://api.dappier.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dappierApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          temperature: 0.7,
          max_tokens: 500,
          presence_penalty: 0.6,
          frequency_penalty: 0.3
        })
      });
    } catch (fetchError) {
      console.error('Network error calling Dappier API:', fetchError);
      return new Response(JSON.stringify({
        error: "NETWORK_ERROR",
        message: "Failed to connect to AI service.",
        details: fetchError.message
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Dappier response status:', dappierResponse.status);
    console.log('Dappier response headers:', Object.fromEntries(dappierResponse.headers.entries()));

    if (!dappierResponse.ok) {
      let errorData;
      try {
        errorData = await dappierResponse.text();
        console.error('Dappier API error response:', errorData);
      } catch (e) {
        console.error('Failed to read error response:', e);
        errorData = 'Unable to read error response';
      }

      // Handle specific status codes
      if (dappierResponse.status === 429) {
        return new Response(JSON.stringify({
          error: "QUOTA_EXCEEDED",
          message: "AI service rate limit exceeded. Please try again in a moment.",
          details: errorData
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (dappierResponse.status === 401 || dappierResponse.status === 403) {
        return new Response(JSON.stringify({
          error: "AUTHENTICATION_ERROR",
          message: "AI service authentication failed. Please check API key configuration.",
          details: errorData,
          instructions: [
            "1. Verify your DAPPIER_API_KEY is correct",
            "2. Check if your Dappier account is active",
            "3. Ensure you have sufficient API credits"
          ]
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        error: "SERVICE_ERROR",
        message: "AI service returned an error.",
        details: errorData,
        statusCode: dappierResponse.status
      }), {
        status: dappierResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let dappierData;
    try {
      dappierData = await dappierResponse.json();
      console.log('Dappier response data:', JSON.stringify(dappierData, null, 2));
    } catch (parseError) {
      console.error('Failed to parse Dappier response as JSON:', parseError);
      return new Response(JSON.stringify({
        error: "PARSE_ERROR",
        message: "Failed to parse AI service response.",
        details: parseError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let responseContent =
      dappierData.choices?.[0]?.message?.content ??
      dappierData.choices?.[0]?.text ??
      dappierData.response ??
      dappierData.message ??
      dappierData.text ??
      dappierData.answer ??
      (typeof dappierData === 'string' ? dappierData : null);

    console.log('Extracted response content:', responseContent);

    if (!responseContent) {
      console.error('No valid response content found in Dappier data:', dappierData);
      return new Response(JSON.stringify({
        error: "EMPTY_RESPONSE",
        message: "No response content from AI service.",
        details: "Response structure did not contain expected content fields",
        responseStructure: Object.keys(dappierData || {})
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sentimentAnalysis = (text: string) => {
      const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'joy', 'excited'];
      const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'depressed', 'anxious', 'worried'];
      const lowerText = text.toLowerCase();
      const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
      const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
      if (positiveCount > negativeCount) return 'POSITIVE';
      if (negativeCount > positiveCount) return 'NEGATIVE';
      return 'NEUTRAL';
    };

    const sentiment = sentimentAnalysis(message);

    const successResponse = {
      response: responseContent,
      sentiment,
      service: 'dappier'
    };

    console.log('Returning successful response:', successResponse);

    return new Response(JSON.stringify(successResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error in chat function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred in the chat function.",
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});