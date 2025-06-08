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

    // Get environment variables
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    
    console.log('Environment check:');
    console.log('DAPPIER_API_KEY exists:', !!dappierApiKey);
    
    if (!dappierApiKey) {
      console.error('DAPPIER_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'API configuration error',
          details: 'DAPPIER_API_KEY environment variable is not set. Please set it as a Supabase Edge Function secret using: supabase secrets set DAPPIER_API_KEY=your_key_here'
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

    console.log('API Key found, proceeding with request');

    // Enhanced system message
    const systemMessage: Message = {
      role: 'system',
      content: `You are MindMate AI, a compassionate mental wellness companion. Provide empathetic, helpful responses that:

1. Acknowledge the user's feelings with genuine understanding
2. Offer specific, actionable advice and coping strategies
3. Use a warm, conversational tone
4. Encourage positive thinking while validating struggles
5. Ask gentle follow-up questions when appropriate

For mental health crises, provide crisis resources (988 Suicide & Crisis Lifeline) and encourage professional help.

Keep responses concise but meaningful (2-4 sentences).`
    };

    // Prepare messages for the API call
    const apiMessages = [
      systemMessage,
      ...(context || []).slice(-5),
      { role: 'user', content: message }
    ];

    console.log('Making request to Dappier API...');

    // Call Dappier API using the correct endpoint and format
    const dappierResponse = await fetch('https://api.dappier.com/app/datamodelconversation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dappierApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: apiMessages,  // Changed from 'messages' to 'conversation'
        model: 'gpt-3.5-turbo',     // Added model specification
        temperature: 0.7,
        max_tokens: 300,
        stream: false
      }),
    });

    console.log('Dappier API response status:', dappierResponse.status);

    if (!dappierResponse.ok) {
      const errorText = await dappierResponse.text();
      console.error('Dappier API error:', errorText);
      
      let errorMessage = 'AI service error';
      let errorDetails = `Status ${dappierResponse.status}: ${errorText}`;
      
      if (dappierResponse.status === 401) {
        errorMessage = 'Authentication failed';
        errorDetails = 'Invalid DAPPIER_API_KEY. Please check that your API key is correct and set as a Supabase secret.';
      } else if (dappierResponse.status === 429) {
        errorMessage = 'Rate limit exceeded';
        errorDetails = 'Too many requests. Please try again later.';
      } else if (dappierResponse.status >= 500) {
        errorMessage = 'AI service temporarily unavailable';
        errorDetails = 'The Dappier service is experiencing issues. Please try again later.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails,
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
    console.log('Dappier response received:', JSON.stringify(dappierData, null, 2));

    // Extract the AI response - handle different possible response formats
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
      console.error('Unexpected response format from Dappier:', dappierData);
      return new Response(
        JSON.stringify({ 
          error: 'Unexpected response format from AI service',
          details: 'Unable to parse AI response. Check Edge Function logs for the full response format.'
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
          error: 'Empty response from AI service',
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

    console.log('Sending successful response');

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
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
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