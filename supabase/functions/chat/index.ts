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

    // Get API keys from environment variables
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!dappierApiKey) {
      console.error('DAPPIER_API_KEY not found in environment variables');
      throw new Error('DAPPIER_API_KEY not found in environment variables');
    }

    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment variables');
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    // Initialize Dappier client
    const dappier = new DappierClient(dappierApiKey);

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

    // Call Dappier API
    const response = await dappier.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    // Analyze sentiment using Dappier
    const sentimentAnalysis = await dappier.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analyzer. Respond with exactly one word: POSITIVE, NEGATIVE, or NEUTRAL.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0,
      max_tokens: 10
    });

    const sentiment = sentimentAnalysis.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ 
        response: response.choices[0].message.content,
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
    
    // Return more specific error information
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;
    
    if (error.message.includes('DAPPIER_API_KEY')) {
      errorMessage = 'DAPPIER_API_KEY not configured';
      statusCode = 500;
    } else if (error.message.includes('OPENAI_API_KEY')) {
      errorMessage = 'OPENAI_API_KEY not configured';
      statusCode = 500;
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      errorMessage = 'Rate limit exceeded';
      statusCode = 429;
    } else if (error.message.includes('quota')) {
      errorMessage = 'API quota exceeded';
      statusCode = 429;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});