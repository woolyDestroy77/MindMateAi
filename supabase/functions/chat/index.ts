import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

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

    // Get API keys and model IDs from environment variables
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    const dataModelId = Deno.env.get('DAPPIER_DATA_MODEL_ID');
    const aiModelId = Deno.env.get('DAPPIER_AI_MODEL_ID');
    
    console.log('Environment check:');
    console.log('DAPPIER_API_KEY exists:', !!dappierApiKey);
    console.log('Chat function invoked');
    console.log('Received message:', message);

    // If API key is missing, return fallback response immediately
    if (!dappierApiKey) {
      console.log('DAPPIER_API_KEY not found, using fallback response');
      
      // Provide a helpful fallback response
      const fallbackResponse = {
        response: "I understand you're reaching out, and I want to help. I'm experiencing some technical difficulties with my AI service right now, but I'm here to listen. Could you tell me more about what's on your mind? Sometimes just talking through your feelings can be helpful, and I'll do my best to provide support based on common wellness practices.",
        sentiment: 'NEUTRAL'
      };
      
      return new Response(
        JSON.stringify(fallbackResponse),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Only try to use Dappier if API key is available
    try {
      const { DappierClient } = await import('npm:@dappier/client@1.0.0');
      
      // Initialize Dappier client
      const dappier = new DappierClient(dappierApiKey);

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
        ...context.slice(-5), // Only use last 5 messages for context
        { role: 'user', content: message }
      ];

      console.log('Sending request to Dappier with messages:', apiMessages.length);
      console.log('Using Data Model ID:', dataModelId);
      console.log('Using AI Model ID:', aiModelId);

      // Prepare the request options with model IDs if available
      const requestOptions: any = {
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 300,
        presence_penalty: 0.3,
        frequency_penalty: 0.2,
      };

      // Add model IDs if they are provided
      if (dataModelId) {
        requestOptions.data_model_id = dataModelId;
      }
      
      if (aiModelId) {
        requestOptions.model = aiModelId;
      }

      // Call Dappier API with model IDs
      const response = await dappier.chat.completions.create(requestOptions);

      const aiResponse = response.choices[0].message.content;
      console.log('Received response from Dappier:', aiResponse?.substring(0, 100) + '...');

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
    } catch (dappierError) {
      console.error('Error calling Dappier API:', dappierError);
      
      // Provide fallback response if Dappier API fails
      const fallbackResponse = {
        response: "I understand you're reaching out, and I want to help. I'm experiencing some technical difficulties with my AI service right now, but I'm here to listen. Could you tell me more about what's on your mind? Sometimes just talking through your feelings can be helpful, and I'll do my best to provide support based on common wellness practices.",
        sentiment: 'NEUTRAL'
      };
      
      return new Response(
        JSON.stringify(fallbackResponse),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }
  } catch (error) {
    console.error('Error in chat function:', error);
    
    // Provide fallback response for any other errors
    const fallbackResponse = {
      response: "I understand you're reaching out, and I want to help. I'm experiencing some technical difficulties right now, but I'm here to listen. Could you tell me more about what's on your mind? Sometimes just talking through your feelings can be helpful.",
      sentiment: 'NEUTRAL'
    };
    
    // Always return a successful response with fallback content
    return new Response(
      JSON.stringify(fallbackResponse),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});