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
    
    const { message, context } = await req.json();
    console.log('Received message:', message);
    console.log('Context length:', context?.length || 0);

    // Get Dappier API key and datamodel ID from environment variables
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    const datamodelExternalId = Deno.env.get('DAPPIER_DATAMODEL_ID');
    
    if (!dappierApiKey) {
      console.error('DAPPIER_API_KEY not found in environment variables');
      console.error('Available env vars:', Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ 
          error: 'API configuration error. Please contact support.',
          details: 'DAPPIER_API_KEY environment variable is not set'
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

    if (!datamodelExternalId) {
      console.error('DAPPIER_DATAMODEL_ID not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'API configuration error. Please contact support.',
          details: 'DAPPIER_DATAMODEL_ID environment variable is not set'
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

    console.log('API Key found, length:', dappierApiKey.length);
    console.log('Datamodel ID found:', datamodelExternalId);

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

    // Call Dappier API directly using fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let dappierResponse;
    try {
      dappierResponse = await fetch('https://api.dappier.com/app/datamodelconversation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dappierApiKey}`,
          'Content-Type': 'application/json',
        },
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
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            error: 'Request timeout. Please try again.',
            details: 'The AI service took too long to respond'
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
          error: 'Network error. Please check your connection and try again.',
          details: fetchError.message
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

    if (!dappierResponse.ok) {
      const errorText = await dappierResponse.text();
      console.error('Dappier API error:', dappierResponse.status, errorText);
      
      // Return specific error based on status code
      let errorMessage = 'Unable to process your request right now.';
      let details = errorText;
      
      if (dappierResponse.status === 401) {
        errorMessage = 'Authentication failed. Please contact support.';
        details = 'Invalid or expired API key';
      } else if (dappierResponse.status === 429) {
        errorMessage = 'Service is busy. Please try again in a moment.';
        details = 'Rate limit exceeded';
      } else if (dappierResponse.status >= 500) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        details = 'Dappier API server error';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: details,
          status: dappierResponse.status
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
          error: 'Received unexpected response format from AI service.',
          details: 'Unable to parse AI response',
          responseFormat: Object.keys(dappierData)
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
          error: 'Received empty response from AI service.',
          details: 'AI service returned empty content'
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
    console.error('Error stack:', error.stack);
    
    // Return proper error response with more details
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
        details: error.message,
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