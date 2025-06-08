import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { DappierClient } from 'npm:@dappier/client@1.0.0';

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
    console.log('Environment variables available:', Object.keys(Deno.env.toObject()));

    if (!apiKey) {
      console.log('DAPPIER_API_KEY not found in environment variables');
      
      // Return a helpful fallback response instead of an error
      const fallbackResponse = `I understand you're reaching out, and I want to help. I'm experiencing some technical difficulties with my AI service right now, but I'm here to listen. Could you tell me more about what's on your mind? Sometimes just talking through your feelings can be helpful, and I'll do my best to provide support based on common wellness practices.`;
      
      return new Response(
        JSON.stringify({ response: fallbackResponse }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    console.log('Initializing Dappier client');
    
    // Initialize Dappier client
    const dappier = new DappierClient(apiKey);

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

    console.log('Calling Dappier API');

    // Call Dappier API
    const response = await dappier.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    console.log('Dappier API response received');

    return new Response(
      JSON.stringify({ response: response.choices[0].message.content }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in chat function:', error);
    
    // Return a helpful fallback response for any errors
    const fallbackResponse = `I'm experiencing some technical difficulties right now, but I'm still here to support you. While I work through these issues, here are some general wellness tips that might help:

1. Take a few deep breaths - inhale for 4 counts, hold for 4, exhale for 6
2. Try grounding yourself by naming 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste
3. Remember that difficult feelings are temporary and will pass
4. Consider reaching out to a trusted friend, family member, or mental health professional

Is there anything specific you'd like to talk about? I'm here to listen.`;

    return new Response(
      JSON.stringify({ response: fallbackResponse }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});