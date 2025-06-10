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
            "3. Select the 'ai-agent' function",
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

    // Create a comprehensive query that includes context and system instructions
    let enhancedQuery = query;
    
    // Add context if available
    if (context && context.length > 0) {
      const contextString = context.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      enhancedQuery = `Previous conversation:\n${contextString}\n\nCurrent message: ${query}\n\nPlease respond as MindMate AI, a compassionate mental wellness companion. Provide empathetic support and practical guidance.`;
    } else {
      enhancedQuery = `As MindMate AI, a compassionate mental wellness companion, please respond to: ${query}\n\nProvide empathetic support and practical guidance for mental wellness.`;
    }

    console.log('Enhanced query for Dappier:', enhancedQuery);

    // Use the Dappier API endpoint directly
    console.log('Making request to Dappier API...');
    
    const dappierResponse = await fetch('https://api.dappier.com/app/datamodel/dm_01jx62jyczecdv0gkh2gbp7pge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dappierApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: enhancedQuery
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

    // Parse the JSON response from Dappier
    const dappierData = await dappierResponse.json();
    console.log('Success with Dappier API');
    console.log('Dappier response structure:', Object.keys(dappierData));

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

    // If it's a string response
    if (!responseContent && typeof dappierData === 'string') {
      responseContent = dappierData;
    }

    // Try to find any string field that looks like a response
    if (!responseContent) {
      const textField = Object.keys(dappierData).find(
        key => typeof dappierData[key] === 'string' && dappierData[key].length > 10,
      );
      responseContent = textField ? dappierData[textField] : '';
    }

    if (!responseContent || responseContent.trim().length === 0) {
      console.error('No response content found in Dappier response:', dappierData);
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

    console.log('Successfully extracted response content:', responseContent.substring(0, 100) + '...');

    return new Response(
      JSON.stringify({
        response: responseContent,
        service: 'dappier-direct',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Unhandled error in ai-agent function:', error);
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