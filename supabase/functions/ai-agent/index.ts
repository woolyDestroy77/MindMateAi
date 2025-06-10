const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, context } = await req.json();

    console.log('AI Agent function invoked');
    console.log('Received query:', query);

    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY') || 'ak_01jx00ns9jfjkvkybhzamc2vyk';
    const dataModelId = Deno.env.get('DAPPIER_DATAMODEL_ID') || 'dm_01jx62jyczecdv0gkh2gbp7pge';

    console.log('DAPPIER_API_KEY exists:', !!dappierApiKey);
    console.log('DAPPIER_DATAMODEL_ID exists:', !!dataModelId);
    console.log('Using data model ID:', dataModelId);

    if (!dappierApiKey || !dataModelId) {
      return new Response(
        JSON.stringify({
          error: "API_CONFIGURATION_ERROR",
          message: "Missing DAPPIER_API_KEY or DAPPIER_DATAMODEL_ID in configuration.",
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

    const dappierUrl = `https://api.dappier.com/app/datamodel/${dataModelId}`;
    console.log('Making request to Dappier datamodel API:', dappierUrl);

    const fullPrompt = (context && context.length > 0)
      ? context.map(msg => `${msg.role}: ${msg.content}`).join('\n') + `\n\nUser: ${query}`
      : query;

    const requestBody = {
      query: fullPrompt,
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

    let responseContent =
      dappierData.response ||
      dappierData.answer ||
      dappierData.result ||
      dappierData.message ||
      dappierData.text ||
      dappierData.output ||
      dappierData.content;

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
          message: "Dappier returned an empty response.",
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
        service: 'dappier-datamodel',
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