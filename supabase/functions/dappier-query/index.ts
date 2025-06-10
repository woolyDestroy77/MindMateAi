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
    const { query } = await req.json();

    console.log('Dappier Query function invoked');
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

    // Get Dappier API key from environment variables
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY');

    console.log('DAPPIER_API_KEY exists:', !!dappierApiKey);

    if (!dappierApiKey) {
      console.log('DAPPIER_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: "API_CONFIGURATION_ERROR",
          message: "AI service configuration is missing. Please configure DAPPIER_API_KEY in Supabase Edge Functions settings.",
          details: "Environment variable DAPPIER_API_KEY is not configured in Supabase Edge Functions.",
          instructions: [
            "1. Go to your Supabase project dashboard",
            "2. Navigate to Edge Functions",
            "3. Select the 'dappier-query' function",
            "4. Go to the Configuration tab",
            "5. Add DAPPIER_API_KEY with your Dappier API key value"
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

    // Make request to Dappier API
    console.log('Making request to Dappier API...');
    
    const dappierResponse = await fetch('https://api.dappier.com/app/datamodel/dm_01jx62jyczecdv0gkh2gbp7pge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dappierApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: query }]
      }),
    });

    console.log('Dappier response status:', dappierResponse.status);

    if (!dappierResponse.ok) {
      const errorData = await dappierResponse.text();
      console.log('Dappier API error response:', errorData);
      
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
            message: "AI service is temporarily unavailable due to usage limits. Please try again later.",
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
      }
      
      return new Response(
        JSON.stringify({ 
          error: "SERVICE_ERROR",
          message: "AI service encountered an error. Please try again.",
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

    // Parse and return the JSON response from Dappier
    const dappierData = await dappierResponse.json();
    console.log('Success with Dappier API');
    console.log('Dappier response:', dappierData);

    // Return the complete JSON response from Dappier
    return new Response(
      JSON.stringify(dappierData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
      
  } catch (error) {
    console.error('Error in dappier-query function:', error);
    
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