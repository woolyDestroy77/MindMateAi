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
    // Add proper JSON parsing with error handling
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('Empty request body received');
        return new Response(JSON.stringify({
          error: "BAD_REQUEST",
          message: "Request body is empty. Please provide a valid JSON body with 'message' field.",
          details: "Empty request body"
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        error: "BAD_REQUEST",
        message: "Invalid JSON in request body. Please check your request format.",
        details: `JSON parsing failed: ${parseError.message}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { message, context } = requestBody;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim() === '') {
      console.error('Missing or invalid message field');
      return new Response(JSON.stringify({
        error: "BAD_REQUEST",
        message: "Missing required 'message' field in request body.",
        details: "The 'message' field must be a non-empty string"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing message:', message);
    console.log('Context provided:', context);

    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    const datamodelId = 'dm_01jx62jyczecdv0gkh2gbp7pge';

    if (!dappierApiKey) {
      console.error('DAPPIER_API_KEY not found in environment variables');
      return new Response(JSON.stringify({
        error: "API_CONFIGURATION_ERROR",
        message: "Missing DAPPIER_API_KEY in Supabase Edge Function settings.",
        instructions: [
          "1. Go to your Supabase project dashboard",
          "2. Navigate to Edge Functions",
          "3. Select the 'chat' function",
          "4. Go to the Configuration tab",
          "5. Add DAPPIER_API_KEY with your Dappier API key value"
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

Guidelines for responses:
- Start with empathy and validation
- Follow up with specific, actionable suggestions
- Include examples and exercises when relevant
- Ask follow-up questions to better understand the situation
- Provide clear, step-by-step guidance for coping strategies
- Always maintain boundaries and remind users you're an AI support tool

If someone expresses thoughts of self-harm or severe distress:
- Express immediate concern
- Provide crisis hotline information (988 Suicide & Crisis Lifeline)
- Strongly encourage seeking professional help
- Focus on immediate safety and grounding techniques`
    };

    const messages = [
      systemMessage,
      ...(Array.isArray(context) ? context : []),
      { role: 'user', content: message }
    ];

    // Compose conversation into a single string
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const graphQLQuery = {
      query: `
        query RunChat($input: ChatInput!) {
          run(input: $input)
        }
      `,
      variables: {
        input: {
          prompt: prompt,
          temperature: 0.7,
          maxTokens: 500
        }
      }
    };

    console.log('Making request to Dappier API...');
    console.log('Datamodel ID:', datamodelId);
    console.log('API Key length:', dappierApiKey.length);

    const response = await fetch(`https://api.dappier.com/app/datamodel/${datamodelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dappierApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphQLQuery)
    });

    console.log('Dappier API response status:', response.status);
    console.log('Dappier API response headers:', Object.fromEntries(response.headers.entries()));

    const responseBody = await response.json();
    console.log('Dappier API response body:', responseBody);

    if (!response.ok || responseBody.errors) {
      console.error('Dappier API error:', responseBody);
      
      let errorMessage = "Dappier API returned an error.";
      let errorCode = "DAPPIER_API_ERROR";
      
      if (response.status === 401) {
        errorCode = "AUTHENTICATION_ERROR";
        errorMessage = "Dappier API authentication failed. Please check your API key.";
      } else if (response.status === 429) {
        errorCode = "QUOTA_EXCEEDED";
        errorMessage = "Dappier API rate limit exceeded. Please try again later.";
      } else if (response.status === 404) {
        errorCode = "DATAMODEL_NOT_FOUND";
        errorMessage = "Dappier datamodel not found. Please check your datamodel ID.";
      }
      
      return new Response(JSON.stringify({
        error: errorCode,
        message: errorMessage,
        details: responseBody.errors || response.statusText,
        status: response.status
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiResponse = responseBody.data?.run;

    if (!aiResponse) {
      console.error('No response data from Dappier:', responseBody);
      return new Response(JSON.stringify({
        error: "EMPTY_RESPONSE",
        message: "No valid response from Dappier API.",
        details: "Response data structure is unexpected"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Simple sentiment analysis
    const sentiment = (() => {
      const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'joy', 'excited'];
      const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'depressed', 'anxious', 'worried'];
      const text = message.toLowerCase();
      const positiveCount = positiveWords.filter(word => text.includes(word)).length;
      const negativeCount = negativeWords.filter(word => text.includes(word)).length;
      return positiveCount > negativeCount ? 'POSITIVE' : negativeCount > positiveCount ? 'NEGATIVE' : 'NEUTRAL';
    })();

    console.log('Successfully processed request');
    console.log('AI Response length:', aiResponse.length);
    console.log('Detected sentiment:', sentiment);

    return new Response(JSON.stringify({
      response: aiResponse,
      sentiment,
      service: 'dappier'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error in chat function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      error: "INTERNAL_ERROR",
      message: "Unexpected server error occurred.",
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});