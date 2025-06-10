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

    // Get Dappier API key and data model ID from environment variables
    // Fallback to hardcoded values for development
    const dappierApiKey = Deno.env.get('DAPPIER_API_KEY') || 'ak_01jx00ns9jfjkvkybhzamc2vyk';
    const dataModelId = Deno.env.get('DAPPIER_DATAMODEL_ID') || 'dm_01jx62jyczecdv0gkh2gbp7pge';

    console.log('DAPPIER_API_KEY exists:', !!dappierApiKey);
    console.log('DAPPIER_DATAMODEL_ID exists:', !!dataModelId);
    console.log('Using data model ID:', dataModelId);

    if (!dappierApiKey) {
      console.log('DAPPIER_API_KEY not found');
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
            "5. Add DAPPIER_API_KEY with value: ak_01jx00ns9jfjkvkybhzamc2vyk",
            "6. Add DAPPIER_DATAMODEL_ID with value: dm_01jx62jyczecdv0gkh2gbp7pge"
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
      console.log('DAPPIER_DATAMODEL_ID not found');
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
      // Use Dappier's datamodel endpoint with your specific data model
      const dappierUrl = `https://api.dappier.com/app/datamodel/${dataModelId}`;
      console.log('Making request to Dappier datamodel API:', dappierUrl);
      
      // Prepare the request body with context if available
      const requestBody = {
        query: query,
      };

      // Add context to the query if available
      if (context && context.length > 0) {
        const contextString = context
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        requestBody.query = `Context:\n${contextString}\n\nCurrent question: ${query}`;
      }

      console.log('Request body:', requestBody);
      
      const dappierResponse = await fetch(dappierUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dappierApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
              details: `Dappier API data model not found - invalid data model ID: ${dataModelId}`
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
      console.log('Full Dappier response:', dappierData);
      
      let responseContent;
      
      // Extract response content from Dappier's datamodel response format
      // Try different possible response fields
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
      } else if (dappierData.content) {
        responseContent = dappierData.content;
      } else if (dappierData.output) {
        responseContent = dappierData.output;
      } else if (typeof dappierData === 'string') {
        responseContent = dappierData;
      } else {
        console.log('Unexpected Dappier response format, trying to extract any text field:', dappierData);
        
        // Try to find any text-like field in the response
        const textFields = Object.keys(dappierData).filter(key => 
          typeof dappierData[key] === 'string' && dappierData[key].length > 10
        );
        
        if (textFields.length > 0) {
          responseContent = dappierData[textFields[0]];
          console.log(`Using field '${textFields[0]}' as response content`);
        } else {
          return new Response(
            JSON.stringify({ 
              error: "RESPONSE_FORMAT_ERROR",
              message: "AI Agent returned an unexpected response format. Please try again.",
              details: `Unable to parse Dappier API response. Available fields: ${Object.keys(dappierData).join(', ')}`
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
      }
      
      if (!responseContent || responseContent.trim().length === 0) {
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
      console.log('Response content length:', responseContent.length);

      return new Response(
        JSON.stringify({ 
          response: responseContent,
          service: 'dappier-datamodel',
          dataModelId: dataModelId
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