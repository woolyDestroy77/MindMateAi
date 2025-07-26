// deno-lint-ignore-file no-explicit-any
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get the audio file from the request
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "Audio file is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Prepare form data for ElevenLabs
    const elevenlabsFormData = new FormData();
    elevenlabsFormData.append('audio', audioFile);
    elevenlabsFormData.append('model_id', 'whisper-1');

    // Call ElevenLabs Speech-to-Text API
    const elevenlabsResponse = await fetch(
      'https://api.elevenlabs.io/v1/speech-to-text',
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: elevenlabsFormData,
      }
    );

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      console.error('ElevenLabs STT API error:', errorText);
      throw new Error(`ElevenLabs STT API error: ${elevenlabsResponse.status}`);
    }

    const result = await elevenlabsResponse.json();
    
    return new Response(
      JSON.stringify({ 
        transcript: result.text || '',
        confidence: result.confidence || 0
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error('Error in ElevenLabs STT function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to transcribe audio",
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});