// deno-lint-ignore-file no-explicit-any
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: string;
  content: string;
}

interface OpenAIRequest {
  message: string;
  context?: ChatMessage[];
  isVideoCall?: boolean;
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { message, context = [], isVideoCall = false }: OpenAIRequest = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Prepare system prompt for video call context
    const systemPrompt = isVideoCall 
      ? `You are a compassionate AI mental health companion in a video call with the user. You can see and hear them through the camera and microphone. 

Key guidelines:
- Keep responses conversational and natural (2-3 sentences max)
- Show empathy and understanding
- Ask follow-up questions to encourage sharing
- Provide gentle mental health support and coping strategies
- Remember this is a real-time voice conversation
- Be warm, supportive, and professional
- If they seem distressed, offer immediate coping techniques
- Acknowledge that you can see/hear them when appropriate

Respond as if you're having a natural conversation with someone you care about.`
      : `You are a compassionate AI mental health companion. Provide supportive, empathetic responses that help with emotional wellbeing. Keep responses concise but meaningful.`;

    // Prepare messages for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      ...context.slice(-5), // Include last 5 messages for context
      { role: "user", content: message }
    ];

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        usage: data.usage 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error('Error in OpenAI chat function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process chat request",
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});