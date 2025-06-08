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
          error: "API configuration error",
          details: "Neither DAPPIER_API_KEY nor OPENAI_API_KEY environment variable is set. Please set at least one using: supabase secrets set DAPPIER_API_KEY=your_key_here or supabase secrets set OPENAI_API_KEY=your_key_here"
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

    let apiResponse;
    let responseContent;

    // Try Dappier API first if available
    if (dappierApiKey) {
      console.log('Attempting to use Dappier API...');
      
      // Updated Dappier API endpoints - try the most common patterns
      const dappierEndpoints = [
        'https://api.dappier.com/app/datamodelchat',
        'https://api.dappier.com/v1/chat/completions',
        'https://api.dappier.com/chat/completions',
        'https://dappier.com/api/v1/chat/completions'
      ];

      let dappierSuccess = false;

      for (const endpoint of dappierEndpoints) {
        try {
          console.log(`Trying Dappier endpoint: ${endpoint}`);
          
          apiResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${dappierApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: messages,
              temperature: 0.7,
              max_tokens: 500,
            }),
          });

          console.log(`Dappier response status for ${endpoint}:`, apiResponse.status);

          if (apiResponse.ok) {
            const dappierData = await apiResponse.json();
            console.log(`Success with Dappier endpoint: ${endpoint}`);
            
            // Extract response content from various possible formats
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
            }
            
            if (responseContent) {
              dappierSuccess = true;
              break;
            }
          }
        } catch (error) {
          console.log(`Error with Dappier endpoint ${endpoint}:`, error.message);
          continue;
        }
      }

      if (!dappierSuccess) {
        console.log('All Dappier endpoints failed, falling back to OpenAI...');
      }
    }

    // Fallback to OpenAI if Dappier failed or wasn't available
    if (!responseContent && openaiApiKey) {
      console.log('Using OpenAI API...');
      
      try {
        apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(`OpenAI API error: ${apiResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const openaiData = await apiResponse.json();
        console.log('OpenAI API response received successfully');
        
        if (openaiData.choices && openaiData.choices[0] && openaiData.choices[0].message) {
          responseContent = openaiData.choices[0].message.content;
        }
      } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error(`Failed to get response from OpenAI: ${error.message}`);
      }
    }

    // If we still don't have a response, return an error
    if (!responseContent) {
      throw new Error('Unable to get a response from any AI service. Please check your API keys and try again.');
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