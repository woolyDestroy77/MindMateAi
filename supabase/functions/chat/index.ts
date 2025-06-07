const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Chat function invoked');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const { message, context } = await req.json();
    console.log('Received message:', message);
    console.log('Context length:', context?.length || 0);

    // Get all required environment variables
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    const datamodelExternalId = Deno.env.get('DAPPIER_DATAMODEL_ID');
    const aiModelApiKey = Deno.env.get('DAPPIER_AI_MODEL_API_KEY');
    
    // Log all available environment variables for debugging (without values)
    const allEnvKeys = Object.keys(Deno.env.toObject());
    console.log('Available environment variables:', allEnvKeys);
    console.log('Looking for: DAPPIER_API_KEY, DAPPIER_DATAMODEL_ID, DAPPIER_AI_MODEL_API_KEY');
    
    // Check for missing environment variables
    const missingVars = [];
    if (!dappierApiKey) missingVars.push('DAPPIER_API_KEY');
    if (!datamodelExternalId) missingVars.push('DAPPIER_DATAMODEL_ID');
    if (!aiModelApiKey) missingVars.push('DAPPIER_AI_MODEL_API_KEY');
    
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      console.error('This usually means the environment variables are not set as Supabase secrets.');
      console.error('To fix this:');
      console.error('1. Go to your Supabase project dashboard');
      console.error('2. Navigate to Settings > Edge Functions');
      console.error('3. Add the missing variables as secrets');
      console.error('4. Redeploy the Edge Function');
      
      return new Response(
        JSON.stringify({ 
          error: 'API configuration error. Environment variables not found in deployed function.',
          details: `Missing Supabase secrets: ${missingVars.join(', ')}. Please set these as Supabase Edge Function secrets, not just in your local .env file.`,
          availableEnvVars: allEnvKeys,
          missingVars: missingVars
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

    console.log('All required environment variables found');
    console.log('API Key found, length:', dappierApiKey.length);
    console.log('Datamodel ID found:', datamodelExternalId);
    console.log('AI Model API Key found, length:', aiModelApiKey.length);

    // Enhanced system message for more dynamic responses
    const systemMessage: Message = {
      role: 'system',
      content: `You are MindMate AI, a compassionate and knowledgeable mental wellness companion. Your responses should be:

1. EMPATHETIC: Always acknowledge the user's feelings with genuine understanding
2. HELPFUL: Provide specific, actionable advice and coping strategies
3. CONVERSATIONAL: Use a warm, natural tone like talking to a trusted friend
4. SUPPORTIVE: Encourage positive thinking while validating their struggles

When someone expresses sadness or negative emotions:
- Validate their feelings first
- Ask gentle follow-up questions to understand better
- Offer 2-3 specific techniques they can try immediately
- Provide hope and encouragement

Example response structure:
"I hear that you're feeling [emotion]. That's completely understandable, and I want you to know that these feelings are valid. Here are some things that might help..."

Always provide substantive, helpful responses. Never give generic or overly brief answers.

If someone mentions self-harm or crisis:
- Express immediate concern
- Provide crisis resources (988 Suicide & Crisis Lifeline)
- Encourage professional help
- Focus on immediate safety`
    };

    // Prepare messages for the API call
    const apiMessages = [
      systemMessage,
      ...(context || []).slice(-5), // Only use last 5 messages for context
      { role: 'user', content: message }
    ];

    console.log('Sending request to Dappier API with', apiMessages.length, 'messages');
    console.log('Using datamodel ID:', datamodelExternalId);

    // Call Dappier API directly using fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let dappierResponse;
    try {
      // Prepare headers with both API keys
      const headers = {
        'Authorization': `Bearer ${dappierApiKey}`,
        'Content-Type': 'application/json',
      };

      // Add AI model API key if it's different from the main API key
      if (aiModelApiKey !== dappierApiKey) {
        headers['X-AI-Model-Key'] = aiModelApiKey;
      }

      console.log('Making request to Dappier API...');
      console.log('Request headers (without sensitive data):', {
        'Content-Type': headers['Content-Type'],
        'Authorization': 'Bearer [REDACTED]',
        'X-AI-Model-Key': aiModelApiKey !== dappierApiKey ? '[REDACTED]' : 'Same as Authorization'
      });

      dappierResponse = await fetch('https://api.dappier.com/app/datamodelconversation', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          datamodelExternalId: datamodelExternalId,
          messages: apiMessages,
          temperature: 0.8,
          max_tokens: 300,
          stream: false
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      console.error('Fetch error name:', fetchError.name);
      console.error('Fetch error message:', fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            error: 'Request timeout. Please try again.',
            details: 'The AI service took too long to respond (30 second timeout)'
          }),
          {
            status: 408,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          },
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Network error connecting to AI service.',
          details: `Fetch failed: ${fetchError.message}. This could indicate network issues or incorrect API endpoint.`
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    clearTimeout(timeoutId);
    console.log('Dappier API response status:', dappierResponse.status);
    console.log('Dappier API response headers:', Object.fromEntries(dappierResponse.headers.entries()));

    if (!dappierResponse.ok) {
      const errorText = await dappierResponse.text();
      console.error('Dappier API error response:', errorText);
      console.error('Response status:', dappierResponse.status);
      console.error('Response status text:', dappierResponse.statusText);
      
      // Return specific error based on status code
      let errorMessage = 'Unable to process your request right now.';
      let details = errorText;
      
      if (dappierResponse.status === 401) {
        errorMessage = 'Authentication failed with Dappier API.';
        details = 'Invalid or expired DAPPIER_API_KEY. Please check your API key in Supabase secrets.';
      } else if (dappierResponse.status === 403) {
        errorMessage = 'Access denied by Dappier API.';
        details = 'Insufficient permissions. Check your DAPPIER_AI_MODEL_API_KEY or datamodel access rights.';
      } else if (dappierResponse.status === 404) {
        errorMessage = 'Dappier datamodel not found.';
        details = `Invalid DAPPIER_DATAMODEL_ID: ${datamodelExternalId}. Please verify the datamodel ID.`;
      } else if (dappierResponse.status === 429) {
        errorMessage = 'Dappier API rate limit exceeded.';
        details = 'Too many requests. Please try again in a moment.';
      } else if (dappierResponse.status >= 500) {
        errorMessage = 'Dappier API server error.';
        details = `Server error (${dappierResponse.status}): ${errorText}`;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: details,
          status: dappierResponse.status,
          statusText: dappierResponse.statusText
        }),
        {
          status: dappierResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const dappierData = await dappierResponse.json();
    console.log('Received response from Dappier API:', JSON.stringify(dappierData, null, 2));

    // Extract the AI response
    let aiResponse = '';
    if (dappierData.choices && dappierData.choices[0] && dappierData.choices[0].message) {
      aiResponse = dappierData.choices[0].message.content;
    } else if (dappierData.response) {
      aiResponse = dappierData.response;
    } else if (dappierData.content) {
      aiResponse = dappierData.content;
    } else if (dappierData.message) {
      aiResponse = dappierData.message;
    } else {
      console.error('Unexpected Dappier response format:', dappierData);
      return new Response(
        JSON.stringify({ 
          error: 'Received unexpected response format from Dappier API.',
          details: 'Unable to parse AI response. Expected response structure not found.',
          responseFormat: Object.keys(dappierData),
          actualResponse: dappierData
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    if (!aiResponse || aiResponse.trim() === '') {
      console.error('Empty response from Dappier API');
      return new Response(
        JSON.stringify({ 
          error: 'Received empty response from Dappier API.',
          details: 'AI service returned empty content',
          fullResponse: dappierData
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Simple sentiment analysis
    let sentiment = 'NEUTRAL';
    const lowerMessage = message.toLowerCase();
    
    const positiveWords = ['happy', 'good', 'great', 'awesome', 'wonderful', 'excited', 'joy', 'love', 'amazing'];
    const negativeWords = ['sad', 'depressed', 'angry', 'upset', 'terrible', 'awful', 'hate', 'anxious', 'worried', 'stressed'];
    
    const hasPositive = positiveWords.some(word => lowerMessage.includes(word));
    const hasNegative = negativeWords.some(word => lowerMessage.includes(word));
    
    if (hasPositive && !hasNegative) {
      sentiment = 'POSITIVE';
    } else if (hasNegative && !hasPositive) {
      sentiment = 'NEGATIVE';
    }

    console.log('Sending successful response with sentiment:', sentiment);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        sentiment
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in chat function:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return proper error response with more details
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred in the Edge Function.',
        details: `${error.name}: ${error.message}`,
        stack: error.stack
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