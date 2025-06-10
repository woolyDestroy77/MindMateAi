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

    // Get Dappier API key from environment variables
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');
    const dataModelId = Deno.env.get('DAPPIER_DATAMODEL_ID');

    console.log('DAPPIER_API_KEY exists:', !!dappierApiKey);
    console.log('DAPPIER_DATAMODEL_ID exists:', !!dataModelId);

    if (!dappierApiKey) {
      console.log('DAPPIER_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: "API_CONFIGURATION_ERROR",
          message: "AI Agent service configuration is missing. Please configure DAPPIER_API_KEY in Supabase Edge Functions settings.",
          details: "Environment variable DAPPIER_API_KEY is not configured in Supabase Edge Functions.",
          instructions: [
            "1. Go to your Supabase project dashboard",
            "2. Navigate to Edge Functions",
            "3. Select the 'ai-agent' function",
            "4. Go to the Configuration tab",
            "5. Add DAPPIER_API_KEY with your Dappier API key value",
            "6. Add DAPPIER_DATAMODEL_ID with your data model ID"
          ]
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

    if (!dataModelId) {
      console.log('DAPPIER_DATAMODEL_ID not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: "API_CONFIGURATION_ERROR",
          message: "AI Agent data model ID is missing. Please configure DAPPIER_DATAMODEL_ID in Supabase Edge Functions settings.",
          details: "Environment variable DAPPIER_DATAMODEL_ID is not configured in Supabase Edge Functions.",
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

    console.log('Using Dappier API with data model:', dataModelId);
    
    try {
      // Use Dappier's datamodel endpoint
      const dappierUrl = `https://api.dappier.com/app/datamodel/${dataModelId}`;
      console.log('Making request to Dappier datamodel API:', dappierUrl);
      
      const dappierResponse = await fetch(dappierUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dappierApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
        }),
      });

      console.log('Dappier response status:', dappierResponse.status);
      console.log('Dappier response headers:', Object.fromEntries(dappierResponse.headers.entries()));

      if (!dappierResponse.ok) {
        const errorData = await dappierResponse.text();
        console.log('Dappier API error response:', errorData);
        console.log('Dappier API error status:', dappierResponse.status);
        
        // Handle specific Dappier errors
        if (dappierResponse.status === 401) {
          console.error('Dappier authentication failed - check API key');
          return new Response(
            JSON.stringify({ 
              error: "AUTHENTICATION_ERROR",
              message: "Dappier API authentication failed. Please check your API key configuration.",
              details: "Dappier API authentication error - invalid API key"
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            },
          );
        } else if (dappierResponse.status === 429) {
          console.error('Dappier quota exceeded');
          return new Response(
            JSON.stringify({ 
              error: "QUOTA_EXCEEDED",
              message: "AI Agent is temporarily unavailable due to usage limits. Please try again later.",
              details: "Dappier API quota exceeded"
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            },
          );
        } else if (dappierResponse.status === 404) {
          console.error('Dappier data model not found');
          return new Response(
            JSON.stringify({ 
              error: "DATAMODEL_NOT_FOUND",
              message: "AI Agent data model not found. Please check your data model ID configuration.",
              details: "Dappier API data model not found - invalid data model ID"
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
            error: "SERVICE_ERROR",
            message: "AI Agent encountered an error. Please try again.",
            details: `Dappier API error: ${dappierResponse.status} - ${errorData}`
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
      console.log('Success with Dappier API');
      console.log('Dappier response structure:', Object.keys(dappierData));
      
      let responseContent;
      
      // Extract response content from Dappier's datamodel response format
      if (dappierData.response) {
        responseContent = dappierData.response;
      } else if (dappierData.answer) {
        responseContent = dappierData.answer;
      } else if (dappierData.result) {
        responseContent = dappierData.result;
      } else if (dappierData.message) {
        responseContent = dappierData.message;
      } else if (dappierData.text) {
        responseContent = dappierData.text;
      } else if (typeof dappierData === 'string') {
        responseContent = dappierData;
      } else {
        console.log('Unexpected Dappier response format:', dappierData);
        return new Response(
          JSON.stringify({ 
            error: "RESPONSE_FORMAT_ERROR",
            message: "AI Agent returned an unexpected response format. Please try again.",
            details: "Unable to parse Dappier API response"
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
      
      if (!responseContent) {
        console.error('No response content found in Dappier response');
        return new Response(
          JSON.stringify({ 
            error: "EMPTY_RESPONSE",
            message: "AI Agent returned an empty response. Please try again.",
            details: "Dappier API returned empty content"
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

      console.log('Successfully generated response using Dappier AI Agent');

      return new Response(
        JSON.stringify({ 
          response: responseContent,
          service: 'dappier-datamodel'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
      
    } catch (error) {
      console.error('Dappier API error:', error);
      console.log('Dappier error details:', error);
      
      // If this is a quota error, return specific error
      if (error.message.includes('429')) {
        return new Response(
          JSON.stringify({ 
            error: "QUOTA_EXCEEDED",
            message: "AI Agent is temporarily unavailable due to usage limits. Please try again later.",
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
      
      return new Response(
        JSON.stringify({ 
          error: "SERVICE_ERROR",
          message: "AI Agent encountered an error. Please try again.",
          details: `Failed to get response from Dappier: ${error.message}`
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
  } catch (error) {
    console.error('Error in AI Agent function:', error);
    
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