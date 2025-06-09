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

    // Try Dappier API first, then fallback to OpenAI
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('DAPPIER_API_KEY exists:', !!dappierApiKey);
    console.log('OPENAI_API_KEY exists:', !!openaiApiKey);

    if (!dappierApiKey && !openaiApiKey) {
      console.log('Neither DAPPIER_API_KEY nor OPENAI_API_KEY found in environment variables');
      
      return new Response(
        JSON.stringify({ 
          error: "API_CONFIGURATION_ERROR",
          message: "AI service is currently unavailable. Please contact support.",
          details: "Neither DAPPIER_API_KEY nor OPENAI_API_KEY environment variable is set."
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

    let responseContent;
    let usedService = 'none';

    // Try Dappier API first if available
    if (dappierApiKey) {
      console.log('Attempting to use Dappier API...');
      
      try {
        console.log('Using specific Dappier endpoint: https://api.dappier.com/app/datamodel/dm_01jx62jyczecdv0gkh2gbp7pge');
        
        const dappierResponse = await fetch('https://api.dappier.com/app/datamodel/dm_01jx62jyczecdv0gkh2gbp7pge', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dappierApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: message
          }),
        });

        console.log('Dappier response status:', dappierResponse.status);

        if (dappierResponse.ok) {
          const dappierData = await dappierResponse.json();
          console.log('Success with Dappier API');
          
          // Extract response content from various possible formats
          if (dappierData.choices && dappierData.choices[0] && dappierData.choices[0].message) {
            responseContent = dappierData.choices[0].message.content;
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
            console.log('Dappier response format:', dappierData);
            // Try to extract any text content from the response
            responseContent = JSON.stringify(dappierData);
          }
          
          if (responseContent) {
            usedService = 'dappier';
          }
        } else {
          const errorData = await dappierResponse.text();
          console.log('Dappier API error response:', errorData);
          throw new Error(`Dappier API error: ${dappierResponse.status} - ${errorData}`);
        }
      } catch (error) {
        console.log('Error with Dappier API:', error.message);
        console.log('Falling back to OpenAI...');
      }
    }

    // Fallback to OpenAI if Dappier failed or wasn't available
    if (!responseContent && openaiApiKey) {
      console.log('Using OpenAI API...');
      
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
            presence_penalty: 0.6,
            frequency_penalty: 0.3,
          }),
        });

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json();
          const errorMessage = errorData.error?.message || 'Unknown error';
          
          // Handle specific OpenAI errors
          if (openaiResponse.status === 429) {
            console.error('OpenAI quota exceeded');
            return new Response(
              JSON.stringify({ 
                error: "QUOTA_EXCEEDED",
                message: "AI service is temporarily unavailable due to usage limits. Please try again later.",
                details: "OpenAI API quota exceeded"
              }),
              {
                status: 429,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                },
              },
            );
          } else if (openaiResponse.status === 401) {
            console.error('OpenAI authentication failed');
            return new Response(
              JSON.stringify({ 
                error: "AUTHENTICATION_ERROR",
                message: "AI service authentication failed. Please contact support.",
                details: "OpenAI API authentication error"
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
          
          throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorMessage}`);
        }

        const openaiData = await openaiResponse.json();
        console.log('OpenAI API response received successfully');
        
        if (openaiData.choices && openaiData.choices[0] && openaiData.choices[0].message) {
          responseContent = openaiData.choices[0].message.content;
          usedService = 'openai';
        }
      } catch (error) {
        console.error('OpenAI API error:', error);
        
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
        
        throw new Error(`Failed to get response from OpenAI: ${error.message}`);
      }
    }

    // If we still don't have a response, return an error
    if (!responseContent) {
      console.error('No AI service available or all services failed');
      return new Response(
        JSON.stringify({ 
          error: "SERVICE_UNAVAILABLE",
          message: "AI service is currently unavailable. Please try again later.",
          details: "Unable to get a response from any AI service"
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

    console.log(`Successfully generated response using ${usedService} service`);

    return new Response(
      JSON.stringify({ 
        response: responseContent,
        sentiment: sentiment,
        service: usedService
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