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
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    const datamodelId = 'dm_01jx62jyczecdv0gkh2gbp7pge'; // your model ID

    if (!dappierApiKey) {
      console.error('Missing DAPPIER_API_KEY environment variable');
      return new Response(JSON.stringify({
        error: "API_CONFIGURATION_ERROR",
        message: "Missing DAPPIER_API_KEY in Supabase Edge Function settings.",
        instructions: [
          "1. Go to your Supabase project dashboard",
          "2. Navigate to 'Edge Functions' section",
          "3. Select the 'chat' function",
          "4. Add 'DAPPIER_API_KEY' as a secret environment variable",
          "5. Set the value to your valid Dappier API key"
        ]
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemMessage = {
      role: 'system',
      content: `You are MindMate AI, a highly empathetic and proactive mental wellness companion. Your purpose is to: 1. Provide active emotional support and practical coping strategies 2. Help users explore and understand their feelings 3. Suggest specific exercises and techniques for emotional regulation 4. Encourage positive behavioral changes while acknowledging challenges 5. Maintain a warm, conversational tone while being direct and action-oriented. Guidelines for responses: Start with empathy and validation, follow up with specific actionable suggestions, include examples and exercises when relevant, ask follow-up questions to better understand the situation, provide clear step-by-step guidance for coping strategies, always maintain boundaries and remind users you're an AI support tool. If someone expresses thoughts of self-harm or severe distress: Express immediate concern, provide crisis hotline information (988 Suicide & Crisis Lifeline), strongly encourage seeking professional help, focus on immediate safety and grounding techniques.`
    };

    const messages = [
      systemMessage,
      ...(context || []),
      { role: 'user', content: message }
    ];

    // Compose conversation into a single string
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const graphQLQuery = {
      query: "query RunChat($input: ChatInput!) { run(input: $input) }",
      variables: {
        input: {
          prompt: prompt,
          temperature: 0.7,
          maxTokens: 500
        }
      }
    };

    console.log('Making request to Dappier API with datamodel:', datamodelId);

    const response = await fetch(`https://api.dappier.com/app/datamodel/${datamodelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dappierApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphQLQuery)
    });

    const responseBody = await response.json();
    console.log('Dappier API response status:', response.status);
    console.log('Dappier API response body:', JSON.stringify(responseBody, null, 2));

    if (!response.ok) {
      console.error('Dappier API error - Status:', response.status, 'Body:', JSON.stringify(responseBody));
      
      // Handle specific error cases
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({
          error: "AUTHENTICATION_ERROR",
          message: "Invalid or expired Dappier API key.",
          details: responseBody.message || responseBody.error || 'Authentication failed',
          instructions: [
            "1. Verify your DAPPIER_API_KEY is correct",
            "2. Check if the API key has expired",
            "3. Ensure the API key has proper permissions",
            "4. Contact Dappier support if the issue persists"
          ]
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (response.status === 404) {
        return new Response(JSON.stringify({
          error: "INVALID_DATAMODEL",
          message: "Invalid Dappier data model ID.",
          details: `Data model '${datamodelId}' not found`,
          instructions: [
            "1. Verify the datamodelId in the Edge Function code",
            "2. Check your Dappier dashboard for the correct model ID",
            "3. Ensure the model is active and accessible"
          ]
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (response.status === 429) {
        return new Response(JSON.stringify({
          error: "QUOTA_EXCEEDED",
          message: "Dappier API rate limit exceeded.",
          details: responseBody.message || 'Too many requests'
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        error: "DAPPIER_API_ERROR",
        message: "Dappier API returned an error.",
        details: responseBody.message || responseBody.error || response.statusText,
        status: response.status
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (responseBody.errors && responseBody.errors.length > 0) {
      console.error('GraphQL errors in Dappier response:', responseBody.errors);
      return new Response(JSON.stringify({
        error: "GRAPHQL_ERROR",
        message: "GraphQL query failed.",
        details: responseBody.errors.map(e => e.message).join(', ')
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle different possible response structures from Dappier
    let aiResponse;
    if (responseBody.data?.run) {
      aiResponse = responseBody.data.run;
    } else if (responseBody.run) {
      aiResponse = responseBody.run;
    } else if (responseBody.response) {
      aiResponse = responseBody.response;
    } else if (typeof responseBody === 'string') {
      aiResponse = responseBody;
    } else {
      console.error('Unexpected response structure from Dappier:', responseBody);
      return new Response(JSON.stringify({
        error: "UNEXPECTED_RESPONSE",
        message: "Unexpected response structure from Dappier API.",
        details: "The API response doesn't match expected format"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!aiResponse || (typeof aiResponse === 'string' && aiResponse.trim() === '')) {
      console.error('Empty or invalid AI response:', aiResponse);
      return new Response(JSON.stringify({
        error: "EMPTY_RESPONSE",
        message: "No valid response from Dappier API.",
        details: "The AI service returned an empty response"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Simple sentiment analysis
    const sentiment = (() => {
      const pos = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'joy', 'excited'];
      const neg = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'depressed', 'anxious', 'worried'];
      const text = message.toLowerCase();
      const pc = pos.filter(w => text.includes(w)).length;
      const nc = neg.filter(w => text.includes(w)).length;
      return pc > nc ? 'POSITIVE' : nc > pc ? 'NEGATIVE' : 'NEUTRAL';
    })();

    console.log('Successfully processed chat request');
    return new Response(JSON.stringify({
      response: aiResponse,
      sentiment,
      service: 'dappier'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    
    // Handle network errors specifically
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new Response(JSON.stringify({
        error: "NETWORK_ERROR",
        message: "Failed to connect to Dappier API.",
        details: error.message
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      error: "INTERNAL_ERROR",
      message: "Unexpected server error.",
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});