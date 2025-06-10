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
    const { query, context } = await req.json();

    console.log('AI Agent function invoked');
    console.log('Received query:', query);

    // Validate that query is not empty
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.error('Empty or invalid query received:', query);
      return new Response(
        JSON.stringify({
          error: "INVALID_QUERY",
          message: "Query cannot be empty. Please provide a valid message.",
          details: "The query parameter is required and must be a non-empty string.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    const dataModelId = Deno.env.get('DAPPIER_DATAMODEL_ID');

    console.log('DAPPIER_API_KEY exists:', !!dappierApiKey);
    console.log('DAPPIER_DATAMODEL_ID exists:', !!dataModelId);

    if (!dappierApiKey || !dataModelId) {
      return new Response(
        JSON.stringify({
          error: "API_CONFIGURATION_ERROR",
          message: "Missing DAPPIER_API_KEY or DAPPIER_DATAMODEL_ID in configuration.",
          details: "Please configure both DAPPIER_API_KEY and DAPPIER_DATAMODEL_ID in your Supabase Edge Functions settings.",
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

    // Define system message for the AI agent
    const systemMessage: Message = {
      role: 'system',
      content: `You are MindMate AI, a compassionate and knowledgeable mental wellness companion. Your purpose is to:

1. Provide empathetic emotional support and practical wellness guidance
2. Help users understand and manage their mental health
3. Suggest evidence-based coping strategies and techniques
4. Encourage healthy habits and positive behavioral changes
5. Maintain a warm, supportive, and professional tone

Guidelines:
- Always validate the user's feelings and experiences
- Provide specific, actionable advice when appropriate
- Include examples and step-by-step guidance for techniques
- Ask thoughtful follow-up questions to better understand their needs
- Maintain appropriate boundaries as an AI support tool
- If someone expresses thoughts of self-harm, provide crisis resources immediately

Remember: You are a supportive companion, not a replacement for professional therapy or medical care.`
    };

    // Construct messages array for conversational API
    const messages: Message[] = [
      systemMessage,
      ...(context || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: query,
      },
    ];

    // Use Dappier's conversation endpoint with correct path
    const dappierUrl = `https://api.dappier.com/app/agent/${dataModelId}/conversation`;
    console.log('Making request to Dappier conversation API:', dappierUrl);

    const requestBody = {
      messages: messages,
    };

    console.log('Sending to Dappier:', JSON.stringify(requestBody, null, 2));

    const dappierResponse = await fetch(dappierUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dappierApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Dappier response status:', dappierResponse.status);

    if (!dappierResponse.ok) {
      const errorText = await dappierResponse.text();
      console.error('Dappier API error response:', errorText);
      
      // Handle specific error cases
      if (dappierResponse.status === 422) {
        return new Response(
          JSON.stringify({
            error: "VALIDATION_ERROR",
            message: "Invalid request format. Please try again.",
            details: `Dappier API validation error: ${errorText}`,
          }),
          {
            status: 400,
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
          message: "AI Agent encountered an error. Please try again.",
          details: `Dappier API error: ${dappierResponse.status} - ${errorText}`,
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
    console.log('Dappier API response:', dappierData);

    // Extract response content from various possible response formats
    let responseContent =
      dappierData.response ||
      dappierData.answer ||
      dappierData.result ||
      dappierData.message ||
      dappierData.text ||
      dappierData.output ||
      dappierData.content;

    // Check if the response is in choices format (like OpenAI)
    if (!responseContent && dappierData.choices && dappierData.choices[0]) {
      responseContent = dappierData.choices[0].message?.content || dappierData.choices[0].text;
    }

    if (!responseContent && typeof dappierData === 'string') {
      responseContent = dappierData;
    }

    if (!responseContent) {
      const textField = Object.keys(dappierData).find(
        key => typeof dappierData[key] === 'string' && dappierData[key].length > 10,
      );
      responseContent = textField ? dappierData[textField] : '';
    }

    if (!responseContent || responseContent.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "EMPTY_RESPONSE",
          message: "AI Agent returned an empty response. Please try again.",
          details: "Dappier API returned empty content",
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

    return new Response(
      JSON.stringify({
        response: responseContent,
        service: 'dappier-conversation',
        dataModelId: dataModelId,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        details: error.message,
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