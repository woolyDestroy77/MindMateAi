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

    // Get Dappier API key from environment variables
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    
    if (!dappierApiKey) {
      console.error('DAPPIER_API_KEY not found in environment variables');
      throw new Error('DAPPIER_API_KEY not found in environment variables');
    }

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

    console.log('Sending request to Dappier API with', apiMessages.length, 'messages');

    // Call Dappier API directly using fetch
    const dappierResponse = await fetch('https://api.dappier.com/app/datamodelconversation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dappierApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 300,
        stream: false
      }),
    });

    if (!dappierResponse.ok) {
      const errorText = await dappierResponse.text();
      console.error('Dappier API error:', dappierResponse.status, errorText);
      throw new Error(`Dappier API error: ${dappierResponse.status}`);
    }

    const dappierData = await dappierResponse.json();
    console.log('Received response from Dappier API');

    // Extract the AI response
    let aiResponse = '';
    if (dappierData.choices && dappierData.choices[0] && dappierData.choices[0].message) {
      aiResponse = dappierData.choices[0].message.content;
    } else if (dappierData.response) {
      aiResponse = dappierData.response;
    } else if (dappierData.content) {
      aiResponse = dappierData.content;
    } else {
      console.error('Unexpected Dappier response format:', dappierData);
      throw new Error('Unexpected response format from Dappier API');
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
    
    // Provide fallback response if API fails
    const fallbackResponse = {
      response: "I understand you're reaching out, and I want to help. I'm experiencing some technical difficulties right now, but I'm here to listen. Could you tell me more about what's on your mind? Sometimes just talking through your feelings can be helpful.",
      sentiment: 'NEUTRAL'
    };
    
    // Return fallback instead of error for better user experience
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