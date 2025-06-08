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

    // Get Dappier API key from environment variables
    const apiKey = Deno.env.get('DAPPIER_API_KEY');
    console.log('DAPPIER_API_KEY exists:', !!apiKey);

    if (!apiKey) {
      console.log('DAPPIER_API_KEY not found in environment variables');
      
      return new Response(
        JSON.stringify({ 
          error: "API configuration error",
          details: "DAPPIER_API_KEY environment variable is not set. Please set it as a Supabase Edge Function secret using: supabase secrets set DAPPIER_API_KEY=your_key_here"
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

    console.log('Making request to Dappier API...');

    // Try multiple potential Dappier API endpoints
    const endpoints = [
      'https://api.dappier.com/app/chat/completions',
      'https://api.dappier.com/v1/chat/completions',
      'https://api.dappier.com/chat/completions',
      'https://api.dappier.com/app/datamodelchat'
    ];

    let dappierResponse;
    let lastError;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        dappierResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo', // Some APIs require a model parameter
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
            presence_penalty: 0.6,
            frequency_penalty: 0.3,
          }),
        });

        console.log(`Response status for ${endpoint}:`, dappierResponse.status);

        if (dappierResponse.ok) {
          console.log(`Success with endpoint: ${endpoint}`);
          break;
        } else if (dappierResponse.status !== 404) {
          // If it's not a 404, this might be the right endpoint but with a different error
          const errorText = await dappierResponse.text();
          console.log(`Non-404 error for ${endpoint}:`, errorText);
          lastError = `${dappierResponse.status}: ${errorText}`;
          break;
        }
      } catch (error) {
        console.log(`Error with endpoint ${endpoint}:`, error.message);
        lastError = error.message;
        continue;
      }
    }

    if (!dappierResponse || !dappierResponse.ok) {
      console.error('All Dappier API endpoints failed');
      
      // If we have a specific error from a non-404 response, use that
      if (lastError) {
        throw new Error(`Dappier API error: ${lastError}`);
      }
      
      // Otherwise, provide a generic error
      throw new Error('Unable to connect to Dappier API. All endpoints returned 404. Please verify your API key and check Dappier documentation for the correct endpoint.');
    }

    const dappierData = await dappierResponse.json();
    console.log('Dappier API response received successfully');

    // Extract the response content - try multiple possible response formats
    let responseContent;
    
    if (dappierData.choices && dappierData.choices[0] && dappierData.choices[0].message) {
      responseContent = dappierData.choices[0].message.content;
    } else if (dappierData.response) {
      responseContent = dappierData.response;
    } else if (dappierData.message) {
      responseContent = dappierData.message;
    } else if (dappierData.text) {
      responseContent = dappierData.text;
    } else if (typeof dappierData === 'string') {
      responseContent = dappierData;
    } else {
      console.log('Unexpected response format:', dappierData);
      responseContent = 'I apologize, but I encountered an issue processing your message. Please try again.';
    }

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