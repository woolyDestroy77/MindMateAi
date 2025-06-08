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
    const { message, context } = await req.json();

    console.log('Chat function invoked');
    console.log('Received message:', message);

    // Debug environment variables
    console.log('Environment check:');
    console.log('All env vars:', Object.keys(Deno.env.toObject()));
    
    // Get Dappier API key from environment variables
    const apiKey = Deno.env.get('DAPPIER_API_KEY');
    console.log('DAPPIER_API_KEY exists:', !!apiKey);
    console.log('DAPPIER_API_KEY length:', apiKey?.length || 0);
    console.log('DAPPIER_API_KEY starts with:', apiKey?.substring(0, 10) || 'undefined');

    if (!apiKey) {
      console.log('DAPPIER_API_KEY not found in environment variables');
      
      return new Response(
        JSON.stringify({ 
          error: "API configuration error",
          details: "DAPPIER_API_KEY environment variable is not set. Please set it as a Supabase Edge Function secret using: supabase secrets set DAPPIER_API_KEY=your_key_here",
          debug: {
            availableEnvVars: Object.keys(Deno.env.toObject()),
            timestamp: new Date().toISOString()
          }
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

    // Enhanced system message for more dynamic responses
    const systemMessage: Message = {
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

    // Combine system message with context and new message
    const messages = [
      systemMessage,
      ...context,
      { role: 'user', content: message }
    ];

    console.log('Making request to Dappier API with key:', apiKey.substring(0, 10) + '...');

    // Make direct HTTP request to Dappier API
    const dappierResponse = await fetch('https://api.dappier.com/app/datamodelchat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      }),
    });

    console.log('Dappier API response status:', dappierResponse.status);

    if (!dappierResponse.ok) {
      const errorText = await dappierResponse.text();
      console.error('Dappier API error:', dappierResponse.status, errorText);
      
      // Handle specific Dappier API errors
      if (dappierResponse.status === 401) {
        throw new Error('Invalid API key. Please check your DAPPIER_API_KEY.');
      } else if (dappierResponse.status === 403) {
        throw new Error('API key does not have permission to access this resource.');
      } else if (dappierResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Dappier API error: ${dappierResponse.status} ${errorText}`);
      }
    }

    const dappierData = await dappierResponse.json();
    console.log('Dappier API response received successfully');

    // Extract the response content
    const responseContent = dappierData.choices?.[0]?.message?.content || 
                           dappierData.response || 
                           dappierData.message ||
                           'I apologize, but I encountered an issue processing your message. Please try again.';

    // Simple sentiment analysis based on keywords
    const sentimentAnalysis = (text: string): string => {
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

    return new Response(
      JSON.stringify({ 
        response: responseContent,
        sentiment: sentiment
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
        error: error.message,
        details: 'An error occurred while processing your request. Please try again.',
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