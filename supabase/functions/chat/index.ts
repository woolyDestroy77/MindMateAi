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
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');

    console.log('DAPPIER_API_KEY exists:', !!dappierApiKey);
    console.log('Available environment variables:', Object.keys(Deno.env.toObject()));

    if (!dappierApiKey) {
      console.log('DAPPIER_API_KEY not found in environment variables');
      console.log('Please configure DAPPIER_API_KEY in your Supabase project dashboard:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to Edge Functions');
      console.log('3. Select the "chat" function');
      console.log('4. Go to the Configuration tab');
      console.log('5. Add DAPPIER_API_KEY with your Dappier API key value');
      
      return new Response(
        JSON.stringify({ 
          error: "API_CONFIGURATION_ERROR",
          message: "AI service configuration is missing. Please configure DAPPIER_API_KEY in Supabase Edge Functions settings.",
          details: "Environment variable DAPPIER_API_KEY is not configured in Supabase Edge Functions. Please add it in your Supabase project dashboard under Edge Functions > chat > Configuration.",
          instructions: [
            "1. Go to your Supabase project dashboard",
            "2. Navigate to Edge Functions",
            "3. Select the 'chat' function",
            "4. Go to the Configuration tab",
            "5. Add DAPPIER_API_KEY with your Dappier API key value"
          ]
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

    // Combine system message with context and new message into a single query string
    let queryContent = `System: ${systemMessage.content}\n\n`;
    
    // Add context messages
    if (context && context.length > 0) {
      for (const msg of context) {
        queryContent += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
      }
    }
    
    // Add the current user message
    queryContent += `User: ${message}\n\nAssistant:`;

    console.log('Using Dappier API...');
    console.log('Dappier API key length:', dappierApiKey.length);
    console.log('Query content length:', queryContent.length);
    
    try {
      // Use Dappier's chat completions endpoint with query parameter
      console.log('Making request to Dappier chat completions API');
      
      const dappierResponse = await fetch('https://api.dappier.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dappierApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryContent,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      console.log('Dappier response status:', dappierResponse.status);
      console.log('Dappier response headers:', Object.fromEntries(dappierResponse.headers.entries()));

      if (!dappierResponse.ok) {
        const errorData = await dappierResponse.text();
        console.log('Dappier API error response:', errorData);
        console.log('Dappier API error status:', dappierResponse.status);
        
        // Handle specific Dappier errors
        if (dappierResponse.status === 401) {
          console.error('Dappier authentication failed - check API key');
          return new Response(
            JSON.stringify({ 
              error: "AUTHENTICATION_ERROR",
              message: "Dappier API authentication failed. Please check your API key configuration.",
              details: "Dappier API authentication error - invalid API key"
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            },
          );
        } else if (dappierResponse.status === 422) {
          console.error('Dappier validation error:', errorData);
          return new Response(
            JSON.stringify({ 
              error: "VALIDATION_ERROR",
              message: "Invalid request format. Please try again.",
              details: `Dappier API validation error: ${errorData}`
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
          console.error('Dappier quota exceeded');
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
        }
        
        return new Response(
          JSON.stringify({ 
            error: "SERVICE_ERROR",
            message: "AI service encountered an error. Please try again.",
            details: `Dappier API error: ${dappierResponse.status} - ${errorData}`
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

      const dappierData = await dappierResponse.json();
      console.log('Success with Dappier API');
      console.log('Dappier response structure:', Object.keys(dappierData));
      
      let responseContent;
      
      // Extract response content from Dappier's response format
      if (dappierData.choices && dappierData.choices[0] && dappierData.choices[0].message) {
        responseContent = dappierData.choices[0].message.content;
      } else if (dappierData.choices && dappierData.choices[0] && dappierData.choices[0].text) {
        responseContent = dappierData.choices[0].text;
      } else if (dappierData.response) {
        responseContent = dappierData.response;
      } else if (dappierData.message) {
        responseContent = dappierData.message;
      } else if (dappierData.text) {
        responseContent = dappierData.text;
      } else if (dappierData.answer) {
        responseContent = dappierData.answer;
      } else if (typeof dappierData === 'string') {
        responseContent = dappierData;
      } else {
        console.log('Unexpected Dappier response format:', dappierData);
        return new Response(
          JSON.stringify({ 
            error: "RESPONSE_FORMAT_ERROR",
            message: "AI service returned an unexpected response format. Please try again.",
            details: "Unable to parse Dappier API response"
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
      
      if (!responseContent) {
        console.error('No response content found in Dappier response');
        return new Response(
          JSON.stringify({ 
            error: "EMPTY_RESPONSE",
            message: "AI service returned an empty response. Please try again.",
            details: "Dappier API returned empty content"
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

      console.log('Successfully generated response using Dappier service');

      return new Response(
        JSON.stringify({ 
          response: responseContent,
          sentiment: sentiment,
          service: 'dappier'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
      
    } catch (error) {
      console.error('Dappier API error:', error);
      console.log('Dappier error details:', error);
      
      // If this is a quota error, return specific error
      if (error.message.includes('429')) {
        return new Response(
          JSON.stringify({ 
            error: "QUOTA_EXCEEDED",
            message: "AI service is temporarily unavailable due to usage limits. Please try again later.",
            details: error.message
          }),
          {
            status: 429,
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
          details: `Failed to get response from Dappier: ${error.message}`
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
    console.error('Error in chat function:', error);
    
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