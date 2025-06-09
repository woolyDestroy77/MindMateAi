const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    const datamodelId = 'dm_01jx62jyczecdv0gkh2gbp7pge'; // your model ID

    if (!dappierApiKey) {
      return new Response(JSON.stringify({
        error: "API_CONFIGURATION_ERROR",
        message: "Missing DAPPIER_API_KEY in Supabase Edge Function settings."
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemMessage = {
      role: 'system',
      content: `You are MindMate AI, a highly empathetic and proactive mental wellness companion. ...`
    };

    const messages = [
      systemMessage,
      ...(context || []),
      { role: 'user', content: message }
    ];

    // Compose conversation into a single string
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const graphQLQuery = {
      query: `
        query RunChat($input: ChatInput!) {
          run(input: $input)
        }
      `,
      variables: {
        input: {
          prompt: prompt,
          temperature: 0.7,
          maxTokens: 500
        }
      }
    };

    const response = await fetch(`https://api.dappier.com/app/datamodel/${datamodelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dappierApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphQLQuery)
    });

    const responseBody = await response.json();

    if (!response.ok || responseBody.errors) {
      return new Response(JSON.stringify({
        error: "DAPPIER_API_ERROR",
        message: "Dappier API returned an error.",
        details: responseBody.errors || response.statusText
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiResponse = responseBody.data?.run;

    if (!aiResponse) {
      return new Response(JSON.stringify({
        error: "EMPTY_RESPONSE",
        message: "No valid response from Dappier."
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sentiment = (() => {
      const pos = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'joy', 'excited'];
      const neg = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'depressed', 'anxious', 'worried'];
      const text = message.toLowerCase();
      const pc = pos.filter(w => text.includes(w)).length;
      const nc = neg.filter(w => text.includes(w)).length;
      return pc > nc ? 'POSITIVE' : nc > pc ? 'NEGATIVE' : 'NEUTRAL';
    })();

    return new Response(JSON.stringify({
      response: aiResponse,
      sentiment,
      service: 'dappier'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: "INTERNAL_ERROR",
      message: "Unexpected server error.",
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
